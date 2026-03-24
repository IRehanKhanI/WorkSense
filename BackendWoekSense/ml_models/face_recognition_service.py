import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

# Load OpenCV's pre-trained Haar Cascade for Face Detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def verify_face_in_image(image_bytes):
    """
    Takes an uploaded image file (bytes) and uses an AI model (Haar Cascades) 
    to detect if a human face is present.
    In a full production system, this could be swapped out with a DeepFace or Facenet 
    model to verify the identity of the specific user.
    """
    try:
        # Convert image bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        # Decode image using OpenCV
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            logger.error("Failed to decode image.")
            return False, "Could not decode uploaded image."

        # Convert to grayscale for face detection AI
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Detect faces in the image
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )

        face_count = len(faces)
        
        if face_count == 0:
            return False, "No face detected in the image."
        elif face_count > 1:
            return False, f"Multiple faces ({face_count}) detected. Ensure only one person is in the frame."
            
        return True, "Face verified successfully."
        
    except Exception as e:
        logger.error(f"Error during face verification: {str(e)}")
        return False, f"Error processing image: {str(e)}"
