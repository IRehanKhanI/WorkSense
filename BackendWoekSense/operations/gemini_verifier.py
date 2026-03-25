import os
import json
import re
import google.generativeai as genai
from django.conf import settings

class GeminiDetector:
    """Uses Google's Gemini 1.5 Flash API to analyze before/after photos."""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    def compare_before_after(self, before_path, after_path, threshold=0.6, task=None):
        if not self.model:
            return {
                "success": False,
                "error": "GEMINI_API_KEY is missing from .env settings."
            }

        try:
            # Upload the two images natively to Gemini's secure file storage
            before_file = genai.upload_file(before_path)
            after_file = genai.upload_file(after_path)
            
            task_info = ""
            if task:
                task_info = f"Task Title: '{task.title}'\nDescription: '{task.description}'"
                
            prompt = f"""
You are an intelligent supervisor verification assistant. 
Compare these two images visually.
The first image is the 'Before' state. The second is the 'After' state.
{task_info}

Carefully evaluate if the task described was successfully completed based purely on checking the visual evidence in the 'After' image compared to the 'Before' image. If no specific task description is provided, just assume it was a general cleaning or maintenance job.
Respond strictly in valid JSON format with exactly the following keys, and no markdown around it:
{{
    "cleanup_successful": true or false,
    "cleanup_confidence": float between 0.0 and 1.0,
    "recommendation_message": "string explaining exactly why it passed or failed based on what you see in the images"
}}
"""
            
            response = self.model.generate_content([before_file, after_file, prompt])
            text = response.text
            
            # Clean formatting in case Gemini wraps it in markdown blocks
            match = re.search(r'```json\n(.*?)\n```', text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                match = re.search(r'```\n(.*?)\n```', text, re.DOTALL)
                if match:
                    text = match.group(1)
            
            data = json.loads(text.strip())
            
            return {
                "success": True,
                "before": {"prediction": "unknown", "confidence": 0.0, "class_scores": {}},
                "after": {"prediction": "unknown", "confidence": 0.0, "class_scores": {}},
                "cleanup_successful": data.get("cleanup_successful", False),
                "cleanup_confidence": float(data.get("cleanup_confidence", 0.0)),
                "recommendation": {"message": data.get("recommendation_message", "Verified with Gemini AI.")}
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Gemini API Error: {str(e)}"
            }
