#!/usr/bin/env python
"""
Test Script for WorkSense Cleaning Detection System
Validates that everything is set up correctly
"""

import os
import sys
import json
from pathlib import Path
import subprocess


class HealthCheck:
    """Perform various health checks on the system."""
    
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.checks_passed = 0
        self.checks_failed = 0
    
    def print_header(self, text):
        """Print formatted header."""
        print(f"\n{'='*60}")
        print(f"  {text}")
        print(f"{'='*60}\n")
    
    def check_pass(self, name):
        """Mark check as passed."""
        print(f"✅ {name}")
        self.checks_passed += 1
    
    def check_fail(self, name, reason=""):
        """Mark check as failed."""
        print(f"❌ {name}")
        if reason:
            print(f"   Reason: {reason}")
        self.checks_failed += 1
    
    def check_file_exists(self, path, description):
        """Check if file exists."""
        file_path = self.base_dir / path
        if file_path.exists():
            self.check_pass(f"File exists: {description}")
            return True
        else:
            self.check_fail(f"File missing: {description}", f"Expected at {path}")
            return False
    
    def check_dir_exists(self, path, description):
        """Check if directory exists."""
        dir_path = self.base_dir / path
        if dir_path.exists() and dir_path.is_dir():
            self.check_pass(f"Directory exists: {description}")
            return True
        else:
            self.check_fail(f"Directory missing: {description}", f"Expected at {path}")
            return False
    
    def check_module_import(self, module_name, description):
        """Check if Python module can be imported."""
        try:
            __import__(module_name)
            self.check_pass(f"Module installed: {description}")
            return True
        except ImportError:
            self.check_fail(f"Module missing: {description}", f"Run: pip install {module_name}")
            return False
    
    def run_all_checks(self):
        """Run all health checks."""
        
        self.print_header("🔍 WorkSense System Health Check")
        
        # 1. Python version
        self.print_header("1. Python Environment")
        py_version = sys.version_info
        if py_version.major >= 3 and py_version.minor >= 9:
            self.check_pass(f"Python version: {py_version.major}.{py_version.minor}")
        else:
            self.check_fail(f"Python version too old: {py_version.major}.{py_version.minor}", 
                          "Requires Python 3.9+")
        
        # 2. Project Structure
        self.print_header("2. Project Structure")
        self.check_dir_exists("operations", "Operations app")
        self.check_dir_exists("ml_models", "ML models directory")
        self.check_dir_exists("ml_models/datasets", "Datasets directory")
        self.check_dir_exists("ml_models/training", "Training directory")
        self.check_dir_exists("ml_models/models", "Models directory")
        
        # 3. Key Files
        self.print_header("3. Required Files")
        self.check_file_exists("requirements.txt", "Requirements file")
        self.check_file_exists("manage.py", "Django management script")
        self.check_file_exists("db.sqlite3", "SQLite database")
        self.check_file_exists("README.md", "README documentation")
        self.check_file_exists("IMPLEMENTATION_SUMMARY.md", "Implementation summary")
        self.check_file_exists("ml_models/SETUP_GUIDE.md", "Setup guide")
        
        # 4. Django Configuration
        self.print_header("4. Django Configuration")
        self.check_file_exists("BackendWoekSense/settings.py", "Django settings")
        self.check_file_exists("BackendWoekSense/urls.py", "Django URL config")
        self.check_file_exists("operations/models.py", "Operations models")
        self.check_file_exists("operations/views.py", "Operations views")
        self.check_file_exists("operations/urls.py", "Operations URLs")
        self.check_file_exists("operations/serializers.py", "DRF serializers")
        self.check_file_exists("operations/admin.py", "Django admin")
        
        # 5. ML Components
        self.print_header("5. ML Components")
        self.check_file_exists("ml_models/datasets/prepare_datasets.py", "Dataset preparation")
        self.check_file_exists("ml_models/training/train_vit_model.py", "Training script")
        self.check_file_exists("ml_models/models/inference.py", "Inference engine")
        
        # 6. Python Packages
        self.print_header("6. Python Dependencies")
        packages = [
            ('django', 'Django'),
            ('rest_framework', 'Django REST Framework'),
            ('corsheaders', 'Django CORS Headers'),
            ('torch', 'PyTorch'),
            ('torchvision', 'TorchVision'),
            ('transformers', 'Hugging Face Transformers'),
            ('datasets', 'Hugging Face Datasets'),
            ('PIL', 'Pillow'),
            ('numpy', 'NumPy'),
            ('sklearn', 'Scikit-learn'),
            ('matplotlib', 'Matplotlib'),
        ]
        
        for module, name in packages:
            self.check_module_import(module, name)
        
        # 7. Django Database
        self.print_header("7. Django Database")
        if (self.base_dir / "db.sqlite3").exists():
            self.check_pass("Database file exists")
            
            # Try to query
            try:
                os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BackendWoekSense.settings')
                import django
                django.setup()
                
                from operations.models import CleaningTask
                count = CleaningTask.objects.count()
                self.check_pass(f"Can query database: {count} cleaning tasks")
            except Exception as e:
                self.check_fail("Cannot query database", str(e))
        else:
            self.check_fail("Database file not found", 
                          "Run: python manage.py migrate")
        
        # 8. Media Directory
        self.print_header("8. Media Storage")
        media_dir = self.base_dir / "media"
        if media_dir.exists():
            self.check_pass("Media directory exists")
        else:
            print(f"⚠️  Media directory will be created on first upload")
        
        # 9. Trained Model
        self.print_header("9. Trained ML Model")
        model_dir = self.base_dir / "ml_models/models/vit_cleaning_detector/best_model"
        if model_dir.exists():
            self.check_pass("Trained model found")
            
            # Check for model files
            required_files = ['config.json', 'pytorch_model.bin', 'preprocessor_config.json']
            for fname in required_files:
                if (model_dir / fname).exists():
                    self.check_pass(f"  └─ {fname}")
                else:
                    self.check_fail(f"  └─ {fname} missing")
        else:
            print(f"⚠️  Model directory not found (expected after training)")
            print(f"   Expected at: {model_dir}")
            print(f"   Run: python ml_models/training/train_vit_model.py")
        
        # 10. Datasets
        self.print_header("10. Training Datasets")
        processed_dir = self.base_dir / "ml_models/datasets/processed"
        if processed_dir.exists():
            for split in ['train', 'val', 'test']:
                split_path = processed_dir / split
                if split_path.exists():
                    clean_count = len(list((split_path / 'clean').glob('*')))
                    unclean_count = len(list((split_path / 'unclean').glob('*')))
                    total = clean_count + unclean_count
                    if total > 0:
                        self.check_pass(f"Dataset {split}: {total} images (clean: {clean_count}, unclean: {unclean_count})")
                    else:
                        print(f"⚠️  Dataset {split}: empty")
        else:
            print(f"⚠️  Datasets not prepared yet")
            print(f"   Run: python ml_models/datasets/prepare_datasets.py")
        
        # Print Summary
        self.print_header("📊 Health Check Summary")
        total = self.checks_passed + self.checks_failed
        percentage = (self.checks_passed / total * 100) if total > 0 else 0
        
        print(f"Passed: {self.checks_passed}")
        print(f"Failed: {self.checks_failed}")
        print(f"Total:  {total}")
        print(f"Score:  {percentage:.1f}%\n")
        
        if self.checks_failed == 0:
            print("🎉 All checks passed! System is ready.")
            return 0
        else:
            print(f"⚠️  {self.checks_failed} checks failed. Review above for details.")
            return 1
    
    def print_recommendations(self):
        """Print recommendations based on checks."""
        self.print_header("💡 Recommendations")
        
        if self.checks_failed > 0:
            print("Next steps to fix issues:")
            print("1. Install missing packages: pip install -r requirements.txt")
            print("2. Run migrations: python manage.py migrate")
            print("3. Prepare datasets: python ml_models/datasets/prepare_datasets.py")
            print("4. Train model: python ml_models/training/train_vit_model.py")
            print("5. Start server: python manage.py runserver")
        else:
            print("System is ready! You can now:")
            print("1. Start the server: python manage.py runserver")
            print("2. Access admin panel: http://localhost:8000/admin/")
            print("3. Test the API: /api/operations/")
            print("4. Check documentation: Read README.md and SETUP_GUIDE.md")


def main():
    """Main function."""
    checker = HealthCheck()
    exit_code = checker.run_all_checks()
    checker.print_recommendations()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
