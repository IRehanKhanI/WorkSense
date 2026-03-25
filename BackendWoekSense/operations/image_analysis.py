"""
Image analysis utilities for task completion verification
- Image quality assessment (blur, contrast, brightness)
- Before/after image similarity comparison
- GPS location validation
"""

import math
import numpy as np
from PIL import Image
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


def calculate_image_quality(image_path_or_file):
    """
    Calculate image quality metrics including blur detection, contrast, and brightness.
    
    Args:
        image_path_or_file: File path string or Django ImageField file object
        
    Returns:
        dict: {
            'quality_score': 0-100,
            'blur_detected': bool,
            'contrast_level': float,
            'brightness_level': float,
            'sharpness_score': float
        }
    """
    try:
        # Handle both file paths and file objects
        if isinstance(image_path_or_file, str):
            img = Image.open(image_path_or_file)
        else:
            # Django ImageField file object
            img.file.seek(0)
            img = Image.open(image_path_or_file.file)
        
        # Convert to grayscale for analysis
        gray_img = img.convert('L')
        img_array = np.array(gray_img, dtype=np.float32)
        
        # Calculate blur detection using Laplacian variance
        # (High variance = sharp, low variance = blurry)
        laplacian = np.array([[0, -1, 0],
                             [-1, 4, -1],
                             [0, -1, 0]], dtype=np.float32)
        blurred = np.convolve(img_array.flatten(), laplacian.flatten())
        blur_variance = np.var(blurred)
        blur_threshold = 100  # Threshold for detecting blur
        blur_detected = blur_variance < blur_threshold
        
        # Calculate contrast (standard deviation of pixel values)
        contrast_level = float(np.std(img_array))
        contrast_normalized = min(contrast_level / 50, 1.0)  # Normalize to 0-1
        
        # Calculate brightness (mean pixel value)
        brightness_level = float(np.mean(img_array))
        brightness_normalized = brightness_level / 255.0  # Normalize to 0-1
        
        # Sharpness score (based on edge detection)
        edges = np.array([[-1, -1, -1],
                         [-1, 8, -1],
                         [-1, -1, -1]], dtype=np.float32)
        sharpness_score = float(np.std(np.convolve(img_array.flatten(), edges.flatten())))
        sharpness_normalized = min(sharpness_score / 100, 1.0)
        
        # Calculate overall quality score (0-100)
        # Factors: contrast (40%), brightness (30%), sharpness (30%)
        quality_score = int(
            contrast_normalized * 40 +
            (0.5 if 50 < brightness_level < 200 else 0) * 30 +  # Good brightness range
            sharpness_normalized * 30
        )
        quality_score = max(0, min(100, quality_score))
        
        result = {
            'quality_score': quality_score,
            'blur_detected': bool(blur_detected),
            'contrast_level': float(contrast_level),
            'brightness_level': float(brightness_level),
            'sharpness_score': float(sharpness_score)
        }
        
        logger.info(f"Image quality analysis: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing image quality: {str(e)}")
        return {
            'quality_score': 0,
            'blur_detected': False,
            'contrast_level': 0.0,
            'brightness_level': 0.0,
            'sharpness_score': 0.0
        }


def compare_images_similarity(before_image_path_or_file, after_image_path_or_file):
    """
    Compare two images (before/after) and calculate similarity percentage.
    Uses histogram comparison and structural similarity metrics.
    
    Args:
        before_image_path_or_file: File path or ImageField for before image
        after_image_path_or_file: File path or ImageField for after image
        
    Returns:
        dict: {
            'similarity_percentage': 0-100,
            'histogram_similarity': float,
            'structural_similarity': float
        }
    """
    try:
        # Load images
        if isinstance(before_image_path_or_file, str):
            before_img = Image.open(before_image_path_or_file)
        else:
            before_image_path_or_file.file.seek(0)
            before_img = Image.open(before_image_path_or_file.file)
        
        if isinstance(after_image_path_or_file, str):
            after_img = Image.open(after_image_path_or_file)
        else:
            after_image_path_or_file.file.seek(0)
            after_img = Image.open(after_image_path_or_file.file)
        
        # Resize to same dimensions for comparison
        size = (200, 200)
        before_img_resized = before_img.resize(size)
        after_img_resized = after_img.resize(size)
        
        # Convert to grayscale
        before_gray = np.array(before_img_resized.convert('L'), dtype=np.float32)
        after_gray = np.array(after_img_resized.convert('L'), dtype=np.float32)
        
        # Calculate histogram similarity
        before_hist = np.histogram(before_gray.flatten(), bins=256, range=(0, 256))[0]
        after_hist = np.histogram(after_gray.flatten(), bins=256, range=(0, 256))[0]
        
        # Normalize histograms
        before_hist = before_hist / before_hist.sum()
        after_hist = after_hist / after_hist.sum()
        
        # Histogram correlation
        histogram_similarity = float(np.corrcoef(before_hist, after_hist)[0, 1])
        if np.isnan(histogram_similarity):
            histogram_similarity = 0.0
        histogram_similarity = max(0.0, histogram_similarity)  # Ensure >= 0
        
        # Structural similarity (simplified MSE-based)
        mse = np.mean((before_gray - after_gray) ** 2)
        max_pixel_diff = 255.0
        structural_similarity = float(100 * (1 - (mse / (max_pixel_diff ** 2))))
        structural_similarity = max(0.0, structural_similarity)
        
        # Overall similarity (weighted average)
        # Histogram: 40%, Structural: 60%
        similarity_percentage = int(
            (histogram_similarity * 0.4 + structural_similarity * 0.6) * 100
        )
        similarity_percentage = max(0, min(100, similarity_percentage))
        
        result = {
            'similarity_percentage': similarity_percentage,
            'histogram_similarity': float(histogram_similarity),
            'structural_similarity': float(structural_similarity)
        }
        
        logger.info(f"Image similarity analysis: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error comparing images: {str(e)}")
        return {
            'similarity_percentage': 0,
            'histogram_similarity': 0.0,
            'structural_similarity': 0.0
        }


def validate_gps_proximity(lat1, lon1, lat2, lon2, task_type='OTHER', tolerance_meters=100):
    """
    Validate if two GPS coordinates are within acceptable proximity.
    Uses Haversine formula to calculate distance.
    
    Args:
        lat1, lon1: Latitude and longitude of first location (before image)
        lat2, lon2: Latitude and longitude of second location (after image)
        task_type: Type of task (can have different tolerance thresholds)
        tolerance_meters: Maximum allowed distance between locations (default 100m)
        
    Returns:
        dict: {
            'is_valid': bool,
            'distance_meters': float,
            'within_tolerance': bool,
            'task_type': str,
            'tolerance_meters': int
        }
    """
    try:
        # Define tolerance by task type if needed
        task_type_tolerances = {
            'SWEEPING': 150,          # Sweeping can cover larger area
            'ROAD_REPAIR': 200,       # Road repair location might shift
            'WATER_MAINTENANCE': 100,
            'GARBAGE_COLLECTION': 120,
            'OTHER': 100,
        }
        
        # Use task-specific tolerance if available, otherwise use provided tolerance
        tolerance = task_type_tolerances.get(task_type, tolerance_meters)
        
        # Haversine formula to calculate distance between two GPS points
        R = 6371000  # Earth radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        distance_meters = R * c
        
        is_valid = distance_meters <= tolerance
        
        result = {
            'is_valid': is_valid,
            'distance_meters': float(distance_meters),
            'within_tolerance': is_valid,
            'task_type': task_type,
            'tolerance_meters': tolerance
        }
        
        logger.info(f"GPS proximity validation: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Error validating GPS proximity: {str(e)}")
        return {
            'is_valid': False,
            'distance_meters': 0.0,
            'within_tolerance': False,
            'task_type': task_type,
            'tolerance_meters': tolerance_meters
        }


def generate_completion_report_text(task, before_proof, after_proof, 
                                     metrics, sla, verification_result=None):
    """
    Generate the 5-category completion report text.
    
    Categories:
    1. Time Analysis
    2. Location
    3. Task Quality
    4. SLA Performance
    5. Recommendations
    
    Args:
        task: Task instance
        before_proof: TaskProof instance for BEFORE image
        after_proof: TaskProof instance for AFTER image
        metrics: Dict with similarity and GPS validation results
        sla: TaskSLA instance with duration info
        verification_result: Optional VerificationResult instance
        
    Returns:
        dict: {
            'time_analysis': str,
            'location_analysis': str,
            'quality_analysis': str,
            'sla_analysis': str,
            'recommendations': str
        }
    """
    try:
        # Extract metrics
        similarity_pct = metrics.get('similarity_percentage', 0)
        gps_data = metrics.get('gps_validation', {})
        distance_m = gps_data.get('distance_meters', 0)
        gps_valid = gps_data.get('is_valid', False)
        
        duration_min = sla.duration_minutes if sla else 0
        sla_threshold = sla.sla_threshold_minutes if sla else 0
        sla_met = sla.sla_met if sla else False
        
        before_quality = before_proof.image_quality_score if before_proof else 0
        after_quality = after_proof.image_quality_score if after_proof else 0
        
        # 1. Time Analysis
        time_analysis = (
            f"**Time Analysis:** The task took {duration_min} minutes to complete, "
            f"which is {'within' if sla_met else 'exceeding'} the estimated SLA threshold of {sla_threshold} minutes. "
        )
        if sla_met:
            time_analysis += f"The work was completed {sla_threshold - duration_min} minutes ahead of schedule."
        else:
            time_analysis += f"The work took {duration_min - sla_threshold} minutes longer than expected."
        
        # 2. Location Analysis
        location_analysis = (
            f"**Location:** GPS coordinates validation indicates that the before and after images "
            f"were captured {distance_m:.1f} meters apart. "
        )
        if gps_valid:
            location_analysis += "Both images were taken from the same task location, confirming work was performed at the assigned site."
        else:
            location_analysis += f"WARNING: Images were taken {distance_m:.1f}m apart, exceeding the acceptable tolerance. Verify if this is due to task scope variation."
        
        # 3. Task Quality Analysis
        quality_analysis = (
            f"**Task Quality:** Before-image quality score: {before_quality}/100, "
            f"After-image quality score: {after_quality}/100. "
            f"Image similarity score: {similarity_pct}%. "
        )
        
        if similarity_pct > 70:
            quality_analysis += "High visual difference detected between before and after, indicating substantial work completion."
        elif similarity_pct > 40:
            quality_analysis += "Moderate visual difference detected; some work appears completed but may require verification."
        else:
            quality_analysis += "Low visual difference; limited changes visible between before and after images."
        
        # 4. SLA Performance
        performance_pct = ((sla_threshold - duration_min) / sla_threshold * 100) if sla_threshold > 0 else 0
        performance_pct = max(0, performance_pct)  # Cap at 0% if exceeded
        
        sla_analysis = (
            f"**SLA Performance:** Overall SLA compliance is {performance_pct:.1f}%. "
        )
        if sla_met:
            sla_analysis += "Task status: COMPLETED - SLA threshold met."
        else:
            sla_analysis += f"Task status: COMPLETED - SLA threshold exceeded by {duration_min - sla_threshold} minutes."
        
        # 5. Recommendations
        recommendations = "**Recommendations:** "
        rec_list = []
        
        if duration_min > sla_threshold * 1.5:
            rec_list.append("Consider breaking down similar tasks into smaller subtasks if timing is consistently exceeded.")
        if similarity_pct < 50:
            rec_list.append("Request additional proof images (close-ups) to verify task completion quality.")
        if distance_m > 50 and gps_valid:
            rec_list.append("Note: Work covered a large area. Verify task scope was correctly estimated.")
        if before_quality < 50 or after_quality < 50:
            rec_list.append("Ensure better lighting and camera angle for higher quality proof images.")
        if verification_result and verification_result.verification_status != 'verified_clean':
            rec_list.append(f"AI verification result: {verification_result.verification_status}. {verification_result.recommendation_message}")
        
        if not rec_list:
            rec_list.append("Task completed satisfactorily. No additional actions required.")
        
        recommendations += " ".join(rec_list)
        
        result = {
            'time_analysis': time_analysis,
            'location_analysis': location_analysis,
            'quality_analysis': quality_analysis,
            'sla_analysis': sla_analysis,
            'recommendations': recommendations
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error generating report text: {str(e)}")
        return {
            'time_analysis': 'Error generating report',
            'location_analysis': 'Error generating report',
            'quality_analysis': 'Error generating report',
            'sla_analysis': 'Error generating report',
            'recommendations': 'Error generating report'
        }
