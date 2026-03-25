import cv2
import numpy as np
import logging
from deepface import DeepFace
import tempfile
import os

logger = logging.getLogger(__name__)

def verify_face_in_image(image_bytes, reference_image_path=None):
    """
    Takes an uploaded image file (bytes) and a reference image path if available.
    Verifies if a face is in the image, and then cross-checks if it matches
    the reference image utilizing DeepFace.
    """
    try:
        # Convert image bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        # Decode image using OpenCV
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image.")
            return False, "Could not decode uploaded image."

        # To use DeepFace easily we create a temp file for the input image
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_img:
            cv2.imwrite(temp_img.name, img)
            input_img_path = temp_img.name

        try:
            if reference_image_path and os.path.exists(reference_image_path):
                # Perform 1:1 facial verification
                result = DeepFace.verify(
                    img1_path=input_img_path,
                    img2_path=reference_image_path,
                    model_name="VGG-Face",
                    enforce_detection=True
                )
                
                if result.get("verified", False):
                    msg = "Face verified successfully against reference profile."
                    return True, msg
                else:
                    return False, "Face detected does not match the registered profile image."
            else:
                # No reference image, just run face detection to see if ANY face is present
                faces = DeepFace.extract_faces(img_path=input_img_path, enforce_detection=False)
                
                # count if true faces found with high enough confidence
                valid_faces = [f for f in faces if f.get('confidence', 0) > 0.8]
                if len(valid_faces) == 0:
                     return False, "No face detected in the image."
                elif len(valid_faces) > 1:
                     return False, f"Multiple faces ({len(valid_faces)}) detected. Ensure only one person is in the frame."
                return True, "Face detected, but no reference profile image available to compare."
                
        finally:
            if os.path.exists(input_img_path):
                os.remove(input_img_path)

    except Exception as e:
        logger.error(f"Error during face verification with DeepFace: {str(e)}")
        # DeepFace raises exceptions if no face is detected when enforce_detection=True
        if "Face could not be detected" in str(e):
            return False, "No face detected in the image."
