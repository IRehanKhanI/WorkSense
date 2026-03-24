"""
Inference module for cleaning area detection.
Provides methods to load model and make predictions.
"""

import torch
import json
from pathlib import Path
from typing import Dict, Tuple, List
from PIL import Image
import numpy as np
from transformers import AutoImageProcessor, AutoModelForImageClassification


class CleaningDetector:
    """
    Detects if an area is clean or unclean using trained ViT model.
    Compares before/after images to verify cleaning tasks.
    """
    
    def __init__(self, model_path: str = "./ml_models/models/vit_cleaning_detector/best_model"):
        """
        Initialize the detection model.
        
        Args:
            model_path: Path to the trained model directory
        """
        self.model_path = Path(model_path)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Load processor and model
        try:
            self.processor = AutoImageProcessor.from_pretrained(str(self.model_path))
            self.model = AutoModelForImageClassification.from_pretrained(str(self.model_path))
        except Exception:
            print(f"Warning: Model not found at {self.model_path}. Loading default base model.")
            self.processor = AutoImageProcessor.from_pretrained("google/vit-base-patch16-224")
            self.model = AutoModelForImageClassification.from_pretrained("google/vit-base-patch16-224")
            
        self.model.to(self.device)
        self.model.eval()
        
        # Load config
        config_path = self.model_path / "training_config.json"
        if config_path.exists():
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {"labels": {0: "clean", 1: "unclean"}}
        
        self.label_map = {0: "clean", 1: "unclean"}
        self.id2label = self.config.get("labels", self.label_map)
    
    def predict_single_image(self, image_path: str) -> Dict:
        """
        Predict if an image shows a clean or unclean area.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with predictions and confidence scores
        """
        try:
            image = Image.open(image_path).convert('RGB')
            return self._predict_from_pil_image(image)
        except Exception as e:
            return {
                "error": str(e),
                "success": False,
                "prediction": None
            }
    
    def predict_from_pil_image(self, image: Image.Image) -> Dict:
        """
        Predict from a PIL Image object.
        
        Args:
            image: PIL Image object
            
        Returns:
            Dictionary with predictions and confidence scores
        """
        return self._predict_from_pil_image(image)
    
    def _predict_from_pil_image(self, image: Image.Image) -> Dict:
        """Internal method to predict from PIL image."""
        try:
            # Process image
            inputs = self.processor(images=image, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probabilities = torch.softmax(logits, dim=-1)
            
            # Get prediction
            predicted_class_id = logits.argmax(-1).item()
            confidence = probabilities[0][predicted_class_id].item()
            
            # Get all class probabilities
            class_scores = probabilities[0].cpu().numpy()
            
            return {
                "success": True,
                "prediction": self.id2label.get(predicted_class_id, "unknown"),
                "confidence": float(confidence),
                "class_scores": {
                    self.id2label.get(i, f"class_{i}"): float(score)
                    for i, score in enumerate(class_scores)
                },
                "is_clean": predicted_class_id == 0,
                "is_unclean": predicted_class_id == 1
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "prediction": None
            }
    
    def compare_before_after(self, 
                            before_image_path: str, 
                            after_image_path: str,
                            threshold: float = 0.6) -> Dict:
        """
        Compare before and after images to verify cleaning task completion.
        
        Args:
            before_image_path: Path to before image
            after_image_path: Path to after image
            threshold: Confidence threshold for clean prediction (0.0-1.0)
            
        Returns:
            Dictionary with comparison results and verification status
        """
        try:
            # Predict before image
            before_result = self.predict_single_image(before_image_path)
            if not before_result.get("success"):
                return {
                    "success": False,
                    "error": f"Could not process before image: {before_result.get('error')}"
                }
            
            # Predict after image
            after_result = self.predict_single_image(after_image_path)
            if not after_result.get("success"):
                return {
                    "success": False,
                    "error": f"Could not process after image: {after_result.get('error')}"
                }
            
            # Determine if cleaning was successful
            before_state = before_result.get("prediction")
            after_state = after_result.get("prediction")
            after_confidence = after_result.get("confidence", 0.0)
            
            # Task is complete if:
            # 1. Before was unclean
            # 2. After is clean with sufficient confidence
            cleanup_successful = (
                before_state == "unclean" and 
                after_state == "clean" and 
                after_confidence >= threshold
            )
            
            return {
                "success": True,
                "before": {
                    "prediction": before_state,
                    "confidence": before_result.get("confidence"),
                    "class_scores": before_result.get("class_scores")
                },
                "after": {
                    "prediction": after_state,
                    "confidence": after_confidence,
                    "class_scores": after_result.get("class_scores")
                },
                "cleanup_successful": cleanup_successful,
                "cleanup_confidence": after_confidence,
                "recommendation": {
                    "status": "VERIFIED_CLEAN" if cleanup_successful else "INCOMPLETE_OR_FAILED",
                    "message": self._get_recommendation_message(before_state, after_state, after_confidence, threshold)
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _get_recommendation_message(self, before: str, after: str, 
                                   confidence: float, threshold: float) -> str:
        """Generate a human-readable recommendation message."""
        if before != "unclean":
            return "Area was already clean before the task."
        
        if after == "clean":
            if confidence >= threshold:
                return f"✅ Cleaning successful! Area is now clean (confidence: {confidence:.1%})"
            else:
                return f"⚠️ Area appears clean but confidence is low ({confidence:.1%}). Please verify manually."
        else:
            return f"❌ Area is still unclean after cleaning task. Please re-do the cleaning."
    
    def batch_predict(self, image_paths: List[str]) -> List[Dict]:
        """
        Make predictions on multiple images.
        
        Args:
            image_paths: List of image file paths
            
        Returns:
            List of prediction dictionaries
        """
        results = []
        for image_path in image_paths:
            result = self.predict_single_image(image_path)
            results.append({
                "image": str(image_path),
                **result
            })
        return results


def load_detector(model_path: str = None) -> CleaningDetector:
    """
    Load the cleaning detector model.
    
    Args:
        model_path: Optional custom path to model. Defaults to best_model.
        
    Returns:
        CleaningDetector instance
    """
    if model_path is None:
        model_path = "./ml_models/models/vit_cleaning_detector/best_model"
    
    return CleaningDetector(model_path)


# Example usage
if __name__ == "__main__":
    detector = load_detector()
    
    # Example 1: Single image prediction
    print("Single image prediction:")
    result = detector.predict_single_image("path/to/image.jpg")
    print(result)
    
    # Example 2: Before/After comparison
    print("\nBefore/After comparison:")
    comparison = detector.compare_before_after(
        "path/to/before.jpg",
        "path/to/after.jpg",
        threshold=0.7
    )
    print(comparison)
