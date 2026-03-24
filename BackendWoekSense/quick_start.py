#!/usr/bin/env python
"""
Quick Start Script for WorkSense Cleaning Detection System
Run this to get everything up and running quickly!
"""

import os
import sys
import subprocess
from pathlib import Path


def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"🔄 {description}")
    print(f"{'='*60}")
    try:
        result = subprocess.run(cmd, shell=True, check=True)
        print(f"✅ {description} completed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed!")
        print(f"Error: {e}")
        return False


def main():
    """Main function to run setup steps."""
    
    print("""
╔══════════════════════════════════════════════════════════════╗
║                 WorkSense Cleaning Detection                 ║
║               Quick Start Setup & Training                   ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    base_dir = Path(__file__).parent.parent
    os.chdir(base_dir)
    
    steps = [
        ("pip install -r requirements.txt", "Installing Python dependencies"),
        ("python manage.py makemigrations operations", "Creating database migrations"),
        ("python manage.py migrate", "Applying migrations to database"),
        ("python ml_models/datasets/prepare_datasets.py", "Downloading and preparing datasets"),
    ]
    
    print(f"\n📍 Working directory: {base_dir}")
    print(f"\n📋 Setup Steps:")
    for i, (cmd, desc) in enumerate(steps, 1):
        print(f"   {i}. {desc}")
    
    print("\n⚠️  NOTE: Step 3 (Dataset Download) will take 15-30 minutes!")
    response = input("\n👉 Continue with setup? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ Setup cancelled.")
        return
    
    # Run setup steps
    for cmd, desc in steps:
        if not run_command(cmd, desc):
            print("\n❌ Setup failed. Please fix the error and try again.")
            sys.exit(1)
    
    print("\n" + "="*60)
    print("🎓 Now Training the Model...")
    print("="*60)
    print("\n⏱️  This will take 1-3 hours with GPU, 6-12 hours with CPU")
    
    response = input("\n👉 Start model training? (yes/no): ").strip().lower()
    
    if response == 'yes':
        if not run_command("python ml_models/training/train_vit_model.py", "Training ViT model"):
            print("\n❌ Training failed. Check GPU/memory and try again.")
            sys.exit(1)
    else:
        print("\n⏭️  Skipping training for now.")
        print("   You can run it manually: python ml_models/training/train_vit_model.py")
    
    # Final setup
    print("\n" + "="*60)
    print("🚀 Final Setup Steps")
    print("="*60)
    
    print("\n✅ 1. Create superuser (for admin panel)")
    response = input("   Run 'python manage.py createsuperuser'? (yes/no): ").strip().lower()
    if response == 'yes':
        run_command("python manage.py createsuperuser", "Creating superuser")
    
    print("\n✅ 2. Start Django development server")
    print("   Run: python manage.py runserver")
    print("   Access: http://localhost:8000/")
    print("   Admin: http://localhost:8000/admin/")
    
    # Print next steps
    print("\n" + "="*60)
    print("✨ Setup Complete!")
    print("="*60)
    
    print("""
📚 Next Steps:

1. 📖 Review the Full Setup Guide:
   - Read: ml_models/SETUP_GUIDE.md
   
2. 🚀 Start the Server:
   python manage.py runserver
   
3. 🔑 Create User Account (if training completed):
   - Admin panel: http://localhost:8000/admin/
   - Create staff user or use superuser
   
4. 📸 Test the API:
   - Upload before image: POST /api/operations/upload-before/
   - Upload after image: POST /api/operations/upload-after-verify/
   
5. 🎨 Integrate with Frontend:
   - See ml_models/SETUP_GUIDE.md "Frontend Integration" section
   
⚠️  Important:
   - If model training didn't complete, run:
     python ml_models/training/train_vit_model.py
   - Add clean images to: ml_models/datasets/raw/clean_images/
   - Re-run dataset preparation if needed

For detailed documentation, see: ml_models/SETUP_GUIDE.md
    """)


if __name__ == "__main__":
    main()
