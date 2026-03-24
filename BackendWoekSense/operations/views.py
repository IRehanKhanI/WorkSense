from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from datetime import datetime

from .models import Task, TaskProof, TaskSLA, VerificationResult, CleaningMetrics
from .serializers import TaskSerializer, TaskProofSerializer, TaskProofUploadSerializer, TaskSLASerializer, VerificationResultSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """API for task management"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        user = self.request.user
        # Workers see their assigned tasks, admins see all
        if hasattr(user, 'profile') and user.profile.role == 'ADMIN':
            return Task.objects.all()
        return Task.objects.filter(assigned_to=user)
    
    def list(self, request, *args, **kwargs):
        """Get tasks for current user"""
        queryset = self.get_queryset().order_by('-assigned_date')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[])
    def create_task(self, request):
        """Create a new task (admin only)"""
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(assigned_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TaskProofViewSet(viewsets.ViewSet):
    """API for task proof submission and retrieval"""
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """
        Upload proof image (before/after) for a task
        
        Expected:
        {
            "image": <file>,
            "gps_lat": 12.9716,
            "gps_lon": 77.5946,
            "proof_type": "BEFORE" or "AFTER",
            "task_id": "TASK-001"
        }
        """
        serializer = TaskProofUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        task_id = serializer.validated_data['task_id']
        proof_type = serializer.validated_data['proof_type']
        image = serializer.validated_data['image']
        worker_selfie = serializer.validated_data.get('worker_selfie')
        gps_lat = serializer.validated_data['gps_lat']
        gps_lon = serializer.validated_data['gps_lon']
        
        try:
            task = Task.objects.get(task_id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Verify user is the assigned worker
        if task.assigned_to != request.user:
            return Response(
                {'error': 'You are not assigned to this task'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if proof_type == 'AFTER':
            # Need a BEFORE proof first
            if not task.proofs.filter(proof_type='BEFORE').exists():
                return Response(
                    {'error': 'Please upload BEFORE image first'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create watermark text
        now = timezone.now()
        watermark_text = f"{now.strftime('%Y-%m-%d %H:%M:%S')}, {gps_lat:.4f}°, {gps_lon:.4f}°"
        
        # Create or update TaskProof
        proof, created = TaskProof.objects.update_or_create(
            task=task,
            proof_type=proof_type,
            defaults={
                'image': image,
                'worker_selfie': worker_selfie,
                'gps_lat': gps_lat,
                'gps_lon': gps_lon,
                'watermark_text': watermark_text
            }
        )
        
        verification_response = None
        
        if proof_type == 'BEFORE':
            task.status = 'IN_PROGRESS'
            task.save()
        elif proof_type == 'AFTER':
            before_proof = task.proofs.get(proof_type='BEFORE')
            
            # Create SLA
            TaskSLA.objects.update_or_create(
                task=task,
                defaults={
                    'before_photo_time': before_proof.submitted_at,
                    'after_photo_time': proof.submitted_at
                }
            )
            
            # AI Verification
            detector = get_detector()
            verification_data = {
                'recommendation_message': 'Model not loaded',
                'verification_status': 'error',
                'error_message': 'Detector not available',
            }
            if detector:
                try:
                    comparison = detector.compare_before_after(
                        before_proof.image.path,
                        proof.image.path,
                        threshold=0.6
                    )
                    
                    if comparison.get('success'):
                        cleanup_successful = comparison.get('cleanup_successful', False)
                        verification_data = {
                            'cleanup_confidence': comparison.get('cleanup_confidence', 0.0),
                            'recommendation_message': comparison.get('recommendation', {}).get('message', ''),
                            'verification_status': 'verified_clean' if cleanup_successful else 'incomplete',
                            'error_message': '',
                        }
                        
                        if cleanup_successful:
                            task.status = 'COMPLETED'
                        else:
                            task.status = 'REJECTED'
                        task.save()
                    else:
                        verification_data['error_message'] = comparison.get('error', 'Unknown error')
                except Exception as e:
                    verification_data['error_message'] = str(e)
            
            # Save verification result
            VerificationResult.objects.update_or_create(
                task=task,
                defaults=verification_data
            )
            
            # Update metrics
            metrics, _ = CleaningMetrics.objects.get_or_create(worker=task.assigned_to)
            metrics.calculate_metrics()
            
            verification_response = verification_data
        
        response_data = {
            'message': f'{proof_type} proof uploaded successfully',
            'proof': TaskProofSerializer(proof).data
        }
        if verification_response:
            response_data['verification'] = verification_response
            
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def list_proofs(self, request):
        """Get proofs for a task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(task_id=task_id)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        
        proofs = task.proofs.all().order_by('submitted_at')
        serializer = TaskProofSerializer(proofs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TaskSLAViewSet(viewsets.ViewSet):
    """API for SLA tracking"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def get_sla(self, request):
        """Get SLA for a task"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({'error': 'task_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(task_id=task_id)
            sla = TaskSLA.objects.get(task=task)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        except TaskSLA.DoesNotExist:
            return Response({'error': 'SLA not calculated yet'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = TaskSLASerializer(sla)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def sla_summary(self, request):
        """Get SLA summary for all tasks (admin)"""
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'ADMIN':
            return Response(
                {'error': 'Admin access required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        slas = TaskSLA.objects.all()
        total = slas.count()
        met = slas.filter(sla_met=True).count()
        missed = slas.filter(sla_met=False).count()
        
        compliance_percentage = (met / total * 100) if total > 0 else 0
        
        return Response({
            'total_tasks_with_sla': total,
            'sla_met': met,
            'sla_missed': missed,
            'compliance_percentage': f"{compliance_percentage:.1f}%"
        }, status=status.HTTP_200_OK)

from django.conf import settings

def get_detector():
    """Get the ViT cleaning detector instance"""
    try:
        from ml_models.models.inference import CleaningDetector
        model_path = getattr(settings, 'CLEANING_MODEL_PATH', 'ml_models/models/vit_cleaning_detector/best_model')
        return CleaningDetector(model_path)
    except Exception as e:
        print(f"Error loading detector: {e}")
        return None

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes((MultiPartParser, FormParser))
def upload_before_image(request):
    """
    Upload before image for a cleaning task.
    
    POST /api/operations/upload-before/
    Expected fields:
    - task_id: str
    - location: str
    - description: str (optional)
    - image: file
    """
    try:
        task_id = request.data.get('task_id')
        location = request.data.get('location')
        description = request.data.get('description', '')
        image_file = request.FILES.get('image')
        
        if not all([task_id, location, image_file]):
            return Response(
                {'error': 'Missing required fields: task_id, location, image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create or update cleaning task
        task, created = Task.objects.get_or_create(
            task_id=task_id,
            defaults={
                'worker': request.user,
                'location': location,
                'description': description,
                'status': 'in_progress'
            }
        )
        
        if not created and task.worker != request.user:
            return Response(
                {'error': 'You do not have permission to modify this task'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update task with image
        task.before_image = image_file
        task.status = 'in_progress'
        task.save()
        
        return Response({
            'success': True,
            'message': 'Before image uploaded successfully',
            'task_id': task_id,
            'task': TaskSerializer(task).data
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': f'Error uploading image: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes((MultiPartParser, FormParser))
def upload_after_image_and_verify(request):
    """
    Upload after image and trigger AI verification.
    
    POST /api/operations/upload-after-verify/
    Expected fields:
    - task_id: str
    - image: file
    - confidence_threshold: float (optional, default 0.6)
    """
    try:
        task_id = request.data.get('task_id')
        image_file = request.FILES.get('image')
        confidence_threshold = float(request.data.get('confidence_threshold', 0.6))
        
        if not all([task_id, image_file]):
            return Response(
                {'error': 'Missing required fields: task_id, image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get cleaning task
        try:
            task = Task.objects.get(task_id=task_id)
        except Task.DoesNotExist:
            return Response(
                {'error': f'Task {task_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if task.worker != request.user:
            return Response(
                {'error': 'You do not have permission to modify this task'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not task.before_image:
            return Response(
                {'error': 'No before image for this task. Please upload before image first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update task with after image
        task.after_image = image_file
        task.status = 'submitted'
        task.save()
        
        # Run AI verification if detector is available
        detector = get_detector()
        verification_data = {
            'before_prediction': None,
            'before_confidence': None,
            'before_class_scores': None,
            'after_prediction': None,
            'after_confidence': None,
            'after_class_scores': None,
            'cleanup_successful': None,
            'cleanup_confidence': None,
            'recommendation_message': 'Model not loaded',
            'verification_status': 'error',
            'error_message': 'Detector not available',
        }
        
        if detector:
            try:
                # Get image paths
                before_path = task.before_image.path
                after_path = task.after_image.path
                
                # Run verification
                comparison = detector.compare_before_after(
                    before_path,
                    after_path,
                    threshold=confidence_threshold
                )
                
                if comparison.get('success'):
                    verification_data = {
                        'before_prediction': comparison['before']['prediction'],
                        'before_confidence': comparison['before']['confidence'],
                        'before_class_scores': comparison['before']['class_scores'],
                        'after_prediction': comparison['after']['prediction'],
                        'after_confidence': comparison['after']['confidence'],
                        'after_class_scores': comparison['after']['class_scores'],
                        'cleanup_successful': comparison['cleanup_successful'],
                        'cleanup_confidence': comparison['cleanup_confidence'],
                        'recommendation_message': comparison['recommendation']['message'],
                        'verification_status': 'verified_clean' if comparison['cleanup_successful'] else 'incomplete',
                        'error_message': '',
                    }
                    
                    # Update task status
                    if comparison['cleanup_successful']:
                        task.status = 'verified_clean'
                    else:
                        task.status = 'verification_failed'
                    task.completion_date = timezone.now()
                    task.save()
                else:
                    verification_data['error_message'] = comparison.get('error', 'Unknown error')
            
            except Exception as e:
                verification_data['error_message'] = str(e)
        
        # Create verification record
        verification_result, created = VerificationResult.objects.get_or_create(
            task=task,
            defaults=verification_data
        )
        
        if not created:
            # Update existing verification
            for key, value in verification_data.items():
                setattr(verification_result, key, value)
            verification_result.verified_at = timezone.now()
            verification_result.save()
        else:
            verification_result.verified_at = timezone.now()
            verification_result.save()
        
        # Update worker metrics
        metrics, _ = CleaningMetrics.objects.get_or_create(worker=request.user)
        metrics.calculate_metrics()
        
        return Response({
            'success': True,
            'message': 'After image uploaded and verification complete',
            'task': TaskSerializer(task).data,
            'verification': VerificationResultSerializer(verification_result).data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response(
            {'error': f'Error processing images: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_task_details(request, task_id):
    """
    Get details of a cleaning task including verification results.
    
    GET /api/operations/task/{task_id}/
    """
    try:
        task = Task.objects.get(task_id=task_id)
        
        if task.worker != request.user:
            return Response(
                {'error': 'You do not have permission to view this task'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        verification = getattr(task, 'verification', None)
        
        return Response({
            'success': True,
            'task': TaskSerializer(task).data,
            'verification': VerificationResultSerializer(verification).data if verification else None
        }, status=status.HTTP_200_OK)
    
    except Task.DoesNotExist:
        return Response(
            {'error': f'Task {task_id} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_worker_tasks(request):
    """
    Get all cleaning tasks for the current worker.
    
    GET /api/operations/my-tasks/
    """
    try:
        tasks = Task.objects.filter(worker=request.user).order_by('-assigned_date')
        
        tasks_data = []
        for task in tasks:
            task_data = TaskSerializer(task).data
            verification = getattr(task, 'verification', None)
            if verification:
                task_data['verification'] = VerificationResultSerializer(verification).data
            tasks_data.append(task_data)
        
        return Response({
            'success': True,
            'count': len(tasks_data),
            'tasks': tasks_data
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_worker_metrics(request):
    """
    Get cleaning metrics for the current worker.
    
    GET /api/operations/my-metrics/
    """
    try:
        metrics, _ = CleaningMetrics.objects.get_or_create(worker=request.user)
        metrics.calculate_metrics()
        
        return Response({
            'success': True,
            'metrics': {
                'total_tasks': metrics.total_tasks,
                'completed_tasks': metrics.completed_tasks,
                'verified_clean': metrics.verified_clean,
                'verification_failed': metrics.verification_failed,
                'success_rate': metrics.success_rate,
                'average_confidence': metrics.average_confidence,
                'last_task_date': metrics.last_task_date,
            }
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
