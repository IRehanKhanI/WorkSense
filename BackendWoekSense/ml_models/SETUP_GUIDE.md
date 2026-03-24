# WorkSense Cleaning Area Detection - Complete Setup Guide

## 🎯 Overview

This guide walks you through setting up and training a Vision Transformer (ViT) model to automatically verify whether workers successfully completed cleaning tasks by analyzing before/after photos.

**Key Features:**

- ✅ Vision Transformer (ViT) model from Hugging Face for image classification
- ✅ Automatic before/after image comparison
- ✅ Binary classification: Clean vs Unclean areas
- ✅ REST API endpoints for integration with WorkSense app
- ✅ Django admin interface for task management
- ✅ Worker performance metrics tracking

---

## 📋 Table of Contents

1. [Installation](#installation)
2. [Dataset Preparation](#dataset-preparation)
3. [Model Training](#model-training)
4. [Running the Application](#running-the-application)
5. [API Usage](#api-usage)
6. [Troubleshooting](#troubleshooting)

---

## 🔧 Installation

### Prerequisites

- Python 3.9 or higher
- 8GB+ RAM (16GB recommended)
- GPU support (CUDA) for faster training (optional but recommended)
- ~50GB free disk space for datasets

### Step 1: Install Dependencies

All required packages are in `requirements.txt`:

```bash
cd BackendWoekSense
pip install -r requirements.txt
```

**Key packages installed:**

- Django 5.2 + DRF (API framework)
- PyTorch 2.1.2 + TorchVision (Deep learning)
- Transformers 4.35.2 (Hugging Face models)
- Datasets 2.14.6 (Dataset utilities)
- Pillow 10.1.0 (Image processing)

### Step 2: Apply Database Migrations

```bash
python manage.py makemigrations operations
python manage.py migrate
```

This creates tables for:

- `CleaningTask` - Task records with before/after images
- `VerificationResult` - AI model predictions
- `CleaningMetrics` - Worker performance stats

---

## 📊 Dataset Preparation

### Understanding the Dataset

The model will learn to classify images as either:

- **Clean**: Safe, well-maintained areas (roads, drains, spaces)
- **Unclean**: Areas with litter, trash, or debris

### Dataset Sources

1. **TrashNet** (garythung/trashnet)
   - ~2,500 images of garbage items
   - Labels: cardboard, glass, metal, paper, plastic, trash
   - All labeled as "unclean" for our purposes

2. **TACO Dataset** (tacodataset/taco)
   - Real-world litter in context (streets, parks, beaches)
   - Highly relevant for municipal cleaning operations
   - Also labeled as "unclean"

3. **Clean Images** (Manual Collection)
   - Beautiful/maintained areas
   - Streets/parks/drains in clean condition
   - Labeled as "clean"

### Step 1: Prepare Datasets Automatically

Run the dataset preparation script:

```bash
python ml_models/datasets/prepare_datasets.py
```

**What it does:**

1. ✅ Downloads TrashNet from Hugging Face (can take 5-10 minutes)
2. ✅ Downloads TACO dataset from Hugging Face (can take 10-15 minutes)
3. ✅ Creates a clean images directory (manual step required)
4. ✅ Organizes all images into train/val/test splits (80/10/10)
5. ✅ Creates `dataset_info.json` with statistics

**Output Structure:**

```
ml_models/datasets/
├── raw/
│   ├── trashnet/
│   ├── taco/
│   ├── clean_images/  ← ADD YOUR CLEAN IMAGES HERE
│   └── README.txt
└── processed/
    ├── train/
    │   ├── clean/
    │   └── unclean/
    ├── val/
    │   ├── clean/
    │   └── unclean/
    ├── test/
    │   ├── clean/
    │   └── unclean/
    └── dataset_info.json
```

### Step 2: Add Clean Images (IMPORTANT)

The automatic download gets unclean images from TrashNet and TACO. You must add clean images:

**Option A: Use existing municipal photos** (Recommended)

- Add your organization's photos of well-maintained areas
- ~500-1000 images for best results
- Place in: `ml_models/datasets/raw/clean_images/`

**Option B: Download from public sources**

Example using Python:

```python
# Get clean images from COCO or Open Images
# Place resulting images in ml_models/datasets/raw/clean_images/
```

**Image Requirements:**

- Format: JPG, PNG
- Size: Any (will be resized to 224x224 by ViT)
- Variety: Different times, weather, locations
- Minimum: 200-500 images per class

---

## 🎓 Model Training

### Step 1: Download Datasets

Run the dataset preparation script (see above):

```bash
python ml_models/datasets/prepare_datasets.py
```

### Step 2: Train the ViT Model

Start training:

```bash
python ml_models/training/train_vit_model.py
```

**Training Configuration (edit in `train_vit_model.py` if needed):**

- Model: `google/vit-base-patch16-224`
- Epochs: 15
- Batch size: 16 (adjust if GPU memory issues)
- Learning rate: 2e-5
- Validation split: 15%
- Test split: 10%

**Expected Training Time:**

- With GPU: 1-3 hours
- Without GPU: 6-12 hours

**During Training, you'll see:**

```
Epoch 1/15
============================================================
Training: 100%|████| 125/125 [00:45<00:00, 2.75it/s]
Train Loss: 0.8234
Validating: 100%|████| 19/19 [00:05<00:00, 3.82it/s]
Val Loss: 0.4521 | Val Accuracy: 0.8923
✅ Best model saved! Accuracy: 0.8923
...
Testing on test set...
Test Loss: 0.4823 | Test Accuracy: 0.8756
✨ Training complete!
```

### Step 3: Training Artifacts

After training, check:

```
ml_models/models/vit_cleaning_detector/
├── best_model/                    # ← Best model from training
│   ├── pytorch_model.bin
│   ├── config.json
│   ├── preprocessor_config.json
│   └── training_config.json
├── final_model/                   # ← Final checkpoint
│   └── ...
├── training_history.png           # ← Loss/accuracy plots
└── training_history.json          # ← Detailed metrics
```

---

## 🚀 Running the Application

### Step 1: Create Superuser

```bash
python manage.py createsuperuser
```

### Step 2: Start Django Server

```bash
python manage.py runserver
```

**Output:**

```
Starting development server at http://127.0.0.1:8000/
```

### Step 3: Access Admin Panel

Visit: `http://localhost:8000/admin/`

Log in with your superuser credentials.

**Admin features:**

- 📋 View all cleaning tasks
- 🖼️ See before/after images
- ✅ Monitor verification results
- 📊 Track worker metrics
- ⚙️ Manage system configuration

---

## 📡 API Usage

### Authentication

All API endpoints require REST token authentication:

```bash
# Get authentication token (if enabled)
curl -X POST http://localhost:8000/api-auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "worker1", "password": "password123"}'
```

Or use session authentication:

```bash
# Login in admin panel or via Django shell
```

### 1️⃣ Upload Before Image

**Endpoint:** `POST /api/operations/upload-before/`

```bash
curl -X POST http://localhost:8000/api/operations/upload-before/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "task_id=TASK_001" \
  -F "location=Main Street Drain" \
  -F "description=Clean the street drain" \
  -F "image=@before_photo.jpg"
```

**Response:**

```json
{
  "success": true,
  "message": "Before image uploaded successfully",
  "task_id": "TASK_001",
  "task": {
    "id": 1,
    "task_id": "TASK_001",
    "worker": 1,
    "worker_name": "John Doe",
    "location": "Main Street Drain",
    "status": "in_progress",
    "assigned_date": "2024-03-24T10:30:00Z",
    "before_image": "/media/cleaning_tasks/before/before_photo_xyz.jpg"
  }
}
```

### 2️⃣ Upload After Image & Verify

**Endpoint:** `POST /api/operations/upload-after-verify/`

⚠️ **Important:** Upload before image first, then this endpoint triggers automatic AI verification.

```bash
curl -X POST http://localhost:8000/api/operations/upload-after-verify/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -F "task_id=TASK_001" \
  -F "image=@after_photo.jpg" \
  -F "confidence_threshold=0.6"
```

**Response (if cleaning successful):**

```json
{
  "success": true,
  "message": "After image uploaded and verification complete",
  "task": {
    "id": 1,
    "task_id": "TASK_001",
    "status": "verified_clean",
    "completion_date": "2024-03-24T11:00:00Z",
    "before_image": "/media/cleaning_tasks/before/before_photo.jpg",
    "after_image": "/media/cleaning_tasks/after/after_photo.jpg"
  },
  "verification": {
    "verification_status": "verified_clean",
    "verified_at": "2024-03-24T11:00:00Z",
    "before_prediction": "unclean",
    "before_confidence": 0.92,
    "after_prediction": "clean",
    "after_confidence": 0.88,
    "cleanup_successful": true,
    "cleanup_confidence": 0.88,
    "recommendation_message": "✅ Cleaning successful! Area is now clean (confidence: 88.0%)"
  }
}
```

**Response (if cleaning incomplete):**

```json
{
  "verification": {
    "verification_status": "incomplete",
    "cleanup_successful": false,
    "recommendation_message": "❌ Area is still unclean after cleaning task. Please re-do the cleaning."
  }
}
```

### 3️⃣ Get Task Details

**Endpoint:** `GET /api/operations/task/{task_id}/`

```bash
curl http://localhost:8000/api/operations/task/TASK_001/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### 4️⃣ Get Worker's Tasks

**Endpoint:** `GET /api/operations/my-tasks/`

```bash
curl http://localhost:8000/api/operations/my-tasks/ \
  -H "Authorization: Token YOUR_TOKEN"
```

### 5️⃣ Get Worker Metrics

**Endpoint:** `GET /api/operations/my-metrics/`

```bash
curl http://localhost:8000/api/operations/my-metrics/ \
  -H "Authorization: Token YOUR_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "metrics": {
    "total_tasks": 45,
    "completed_tasks": 43,
    "verified_clean": 40,
    "verification_failed": 3,
    "success_rate": 93.02,
    "average_confidence": 0.87,
    "last_task_date": "2024-03-24T11:00:00Z"
  }
}
```

---

## 🔗 Frontend Integration (React)

### Step 1: Add Camera/Image Capture Component

In your React app (`WorkSense/app/(worker)/camera.jsx`):

```jsx
import { useState } from "react";
import { API_BASE_URL } from "../../src/constants/api";

export default function CameraScreen() {
  const [taskId, setTaskId] = useState("");
  const [location, setLocation] = useState("");
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const uploadBeforeImage = async () => {
    const formData = new FormData();
    formData.append("task_id", taskId);
    formData.append("location", location);
    formData.append("image", beforeImage);

    try {
      const response = await fetch(
        `${API_BASE_URL}/operations/upload-before/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      const data = await response.json();
      if (data.success) {
        // Show success message
        alert("Before image uploaded!");
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const uploadAfterImageAndVerify = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("task_id", taskId);
    formData.append("image", afterImage);
    formData.append("confidence_threshold", 0.65);

    try {
      const response = await fetch(
        `${API_BASE_URL}/operations/upload-after-verify/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      const data = await response.json();
      setResult(data);

      if (data.verification.cleanup_successful) {
        alert("✅ Cleaning verified successful!");
      } else {
        alert("❌ Area needs more cleaning!");
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Step 1: Before Image */}
      <input
        type="text"
        placeholder="Task ID"
        value={taskId}
        onChange={(e) => setTaskId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setBeforeImage(e.target.files?.[0])}
      />
      <button onClick={uploadBeforeImage}>Capture Before</button>

      {/* Step 2: After Image */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => setAfterImage(e.target.files?.[0])}
      />
      <button onClick={uploadAfterImageAndVerify} disabled={loading}>
        {loading ? "Verifying..." : "Capture After & Verify"}
      </button>

      {/* Results */}
      {result && (
        <div>
          <h3>Verification Result</h3>
          <p>Status: {result.verification.verification_status}</p>
          <p>
            Confidence:{" "}
            {(result.verification.cleanup_confidence * 100).toFixed(1)}%
          </p>
          <p>{result.verification.recommendation_message}</p>
        </div>
      )}
    </div>
  );
}
```

### Step 2: Update API Constants

In `WorkSense/src/constants/api.js`:

```javascript
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export const OPERATIONS_ENDPOINTS = {
  UPLOAD_BEFORE: `${API_BASE_URL}/operations/upload-before/`,
  UPLOAD_AFTER_VERIFY: `${API_BASE_URL}/operations/upload-after-verify/`,
  GET_TASK: `${API_BASE_URL}/operations/task/`,
  GET_MY_TASKS: `${API_BASE_URL}/operations/my-tasks/`,
  GET_MY_METRICS: `${API_BASE_URL}/operations/my-metrics/`,
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Model not found error"

```
FileNotFoundError: [Errno 2] No such file or directory: 'ml_models/models/vit_cleaning_detector/best_model'
```

**Solution:**

- Ensure training completed successfully
- Check model directory exists
- Run training again if needed

#### 2. "CUDA out of memory"

```
RuntimeError: CUDA out of memory. Tried to allocate 2.00 GiB
```

**Solution:**

```python
# In train_vit_model.py, reduce batch size:
trainer = ViTTrainer(
    batch_size=8,  # Reduce from 16 to 8
    ...
)
```

#### 3. "Datasets directory not found"

```
FileNotFoundError: ml_models/datasets/processed directory not found
```

**Solution:**

```bash
# Run dataset preparation:
python ml_models/datasets/prepare_datasets.py
```

#### 4. "No clean images found"

```
Warning: Found 0 clean images
```

**Solution:**

- Add images to `ml_models/datasets/raw/clean_images/`
- Run dataset preparation again
- Ensure images are JPG, PNG, or JPEG format

#### 5. "Low accuracy (< 70%)"

**Solutions:**

- Add more diverse training images
- Collect better quality clean images
- Increase epochs (up to 20-30)
- Use data augmentation in training script

---

## 📈 Performance Optimization

### For Faster Training

1. **Use GPU:**

   ```bash
   # Verify CUDA is available:
   python -c "import torch; print(torch.cuda.is_available())"
   ```

2. **Adjust batch size:**
   - Batch size 16-32 (with GPU): Faster
   - Batch size 4-8 (CPU only or limited VRAM)

3. **Use mixed precision:**
   ```python
   # Add to train_vit_model.py
   from torch.cuda.amp import autocast, GradScaler
   ```

### For Better Accuracy

1. **Collect more data:** 1000+ images per class
2. **Improve image quality:** High resolution, well-lit photos
3. **Data augmentation:** Random crops, rotations, brightness
4. **Training longer:** 20-30 epochs with early stopping
5. **Fine-tune hyperparameters:** Learning rate 1e-5 to 5e-5

---

## 📋 Quick Reference Commands

```bash
# Setup
pip install -r requirements.txt
python manage.py migrate

# Datasets
python ml_models/datasets/prepare_datasets.py

# Training
python ml_models/training/train_vit_model.py

# Running
python manage.py runserver

# Admin
python manage.py createsuperuser

# Cleanup
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete
```

---

## 📚 Additional Resources

- **Hugging Face ViT Model:** https://huggingface.co/google/vit-base-patch16-224
- **TrashNet Dataset:** https://huggingface.co/datasets/garythung/trashnet
- **TACO Dataset:** https://huggingface.co/datasets/tacodataset/taco
- **PyTorch Documentation:** https://pytorch.org/docs/
- **Transformers Documentation:** https://huggingface.co/docs/transformers/

---

## 💬 Support

For issues or questions:

1. Check troubleshooting section
2. Review Django/DRF logs
3. Check GPU/memory usage
4. Verify dataset integrity

---

**Created:** March 2024  
**Version:** 1.0  
**License:** MIT
