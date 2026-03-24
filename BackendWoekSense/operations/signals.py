from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import TaskProof, TaskSLA


@receiver(post_save, sender=TaskProof)
def auto_create_task_sla(sender, instance, created, **kwargs):
    """
    Automatically create TaskSLA when both BEFORE and AFTER proofs are submitted
    """
    task = instance.task
    
    # Check if both proofs exist
    before_proof = task.proofs.filter(proof_type='BEFORE').first()
    after_proof = task.proofs.filter(proof_type='AFTER').first()
    
    if before_proof and after_proof:
        # Create or update TaskSLA
        TaskSLA.objects.update_or_create(
            task=task,
            defaults={
                'before_photo_time': before_proof.submitted_at,
                'after_photo_time': after_proof.submitted_at
            }
        )
