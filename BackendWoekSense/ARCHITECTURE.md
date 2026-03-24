# 🏗️ WorkSense Cleaning Detection - Architecture & Workflow

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WORKSENSE APPLICATION                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌──────────────────────┐              ┌──────────────────────┐            │
│   │  React Frontend      │              │  Admin Dashboard     │            │
│   │  ──────────────      │              │  ─────────────────   │            │
│   │ • Camera capture     │              │ • Task management    │            │
│   │ • Before/After       │              │ • Metrics viewing    │            │
│   │ • Results display    │              │ • Worker analytics   │            │
│   │ WorkSense/           │              │ localhost:8000/admin │            │
│   └──────┬───────────────┘              └──────────┬───────────┘            │
│          │                                         │                        │
│          └────────────────┬────────────────────────┘                        │
│                           │                                                 │
│                    ┌──────▼──────┐                                          │
│                    │   CORS      │                                          │
│                    │  Middleware │                                          │
│                    └──────┬──────┘                                          │
│                           │                                                 │
│        ┌──────────────────┼──────────────────┐                              │
│        │                  │                  │                              │
│   ┌────▼─────────┐  ┌────▼─────────┐  ┌────▼─────────┐                    │
│   │ Auth Endpoint│  │ Operations   │  │ Status       │                    │
│   │ /api-auth/   │  │ /api/ops/    │  │ Endpoints   │                    │
│   └──────────────┘  └────┬─────────┘  └─────────────┘                    │
│                          │                                                 │
│        ┌─────────────────┼─────────────────┐                              │
│        │                 │                 │                              │
│   ┌────▼─────────┐  ┌────▼─────────┐  ┌────▼─────────┐                   │
│   │ Upload Before│  │Upload/Verify │  │Get Metrics   │                   │
│   │   POST       │  │  POST        │  │   GET        │                   │
│   └────┬─────────┘  └────┬─────────┘  └─────────────┘                   │
│        │                 │                                                │
│        └─────────────────┼────────────────┐                              │
│                          │                │                              │
│                   ┌──────▼──────┐  ┌─────▼──────┐                        │
│                   │  Django ORM │  │  ML Model  │                        │
│                   │  (Storage)  │  │  Inference │                        │
│                   └──────┬──────┘  └─────┬──────┘                        │
│                          │               │                              │
│         ┌────────────────┼───────────────┼────────────────┐              │
│         │                │               │                │              │
│    ┌────▼────┐    ┌─────▼──────┐  ┌────▼────┐    ┌─────▼──────┐        │
│    │CleaningTask│  │Verification│  │Best Model│   │Preprocessor│        │
│    │          │  │Result      │  │          │   │(ViT)       │        │
│    │• task_id │  │            │  │pytorch_  │   │·224x224    │        │
│    │• worker  │  │• status    │  │model.bin │   │·Normalized │        │
│    │• location│  │• predict   │  │(4GB)     │   │            │        │
│    │• before_ │  │• confidence│  │          │   │            │        │
│    │  image   │  │• message   │  │          │   │            │        │
│    │• after_  │  │            │  │          │   │            │        │
│    │  image   │  │            │  │          │   │            │        │
│    └─────────┘  └────────────┘  └────────┘   └────────────┘        │
│         │                │               │         │                  │
│         └────────────────┼───────────────┼─────────┘                  │
│                          │               │                           │
│             ┌────────────▼───────────────▼────────────┐              │
│             │  SQLite Database (db.sqlite3)          │              │
│             │  ─────────────────────────────────      │              │
│             │  • CleaningTask records                │              │
│             │  • VerificationResult records          │              │
│             │  • CleaningMetrics                     │              │
│             │  • User & Auth data                    │              │
│             └────────────────────────────────────────┘              │
│                                                                      │
│             ┌────────────────────────────────────┐                  │
│             │  Media Storage (media/)             │                  │
│             │  ──────────────────                 │                  │
│             │  • before/ (uploaded before photos)│                  │
│             │  • after/  (uploaded after photos) │                  │
│             └────────────────────────────────────┘                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Workflow

### Scenario: Worker Completes Cleaning Task

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: BEFORE - Worker takes initial photo                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Worker App                  Backend API                    Database       │
│  ───────────────────────────────────────────────────────────────────────   │
│                                                                              │
│     📸 Camera                                                               │
│     │ │ (capture before photo)                                            │
│     │ │                                                                    │
│     ▼ ▼                                                                    │
│  ┌──────────────────┐       POST /upload-before/                          │
│  │ before_photo.jpg │ ──────────────────────────────────►                │
│  │ task_id          │       {task_id, location, image}                    │
│  │ location         │                                                     │
│  └──────────────────┘                              ┌──────────────┐       │
│                                                   │CleaningTask  │       │
│                                                   │Created:      │       │
│                                                   │·task_id      │       │
│                                                   │·worker       │       │
│                                                   │·before_image │       │
│                                                   │·status=      │       │
│                                                   │ in_progress  │       │
│                                                   └──────────────┘       │
│                                                                          │
│     Response: ✅ Image uploaded, task created                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: CLEANING - Worker does the work                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Worker cleans the area]                                                  │
│  ⏱️ Time: varies based on work                                             │
│  [No app interaction during this phase]                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: AFTER & VERIFY - Worker uploads after photo, AI verifies           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Worker App          Backend API         ML Engine          Database       │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│     📸 Camera                                                               │
│     │ │ (capture after photo)                                             │
│     │ │                                                                    │
│     ▼ ▼                                                                    │
│  ┌──────────────────┐       POST /upload-after-verify/                    │
│  │ after_photo.jpg  │ ──────────────────────────────────►                │
│  │ task_id          │       {task_id, image, threshold=0.6}              │
│  └──────────────────┘                                                    │
│                                                                           │
│                                            ┌──────────────────────┐      │
│                                            │  Load Trained Model  │      │
│                                            │  - ViT model config  │      │
│                                            │  - Preprocessor      │      │
│                                            │  - Weights           │      │
│                                            └──────┬───────────────┘      │
│                                                   │                       │
│                                            ┌──────▼───────────────┐      │
│                                            │ Get Before Image     │      │
│                                            │ from database:       │      │
│                                            │  before_photo.jpg    │      │
│                                            └──────┬───────────────┘      │
│                                                   │                       │
│                                    ┌──────────────┴─────────────────┐    │
│                                    │                                │    │
│                           ┌────────▼────────┐           ┌────────┴──────┐
│                           │  Process Before │           │ Process After │
│                           │  Image          │           │ Image         │
│                           │ - Resize 224x224│           │ - Resize 224x224
│                           │ - Normalize     │           │ - Normalize   │
│                           │ - Extract       │           │ - Extract     │
│                           │   features      │           │   features    │
│                           └────────┬────────┘           └────────┬──────┘
│                                    │                             │
│                          ┌─────────┴─────────────────────────────┴────┐
│                          │         ViT Model Inference              │
│                          │                                           │
│                          │  Input: 2 images [224x224x3]             │
│                          │  ┌────────────────────────────────┐      │
│                          │  │ Vision Transformer Layer 1     │      │
│                          │  │ └──► Patch Embedding           │      │
│                          │  │ └──► Position Embedding        │      │
│                          │  │ └──► Transformer Encoder       │      │
│                          │  │ └──► Classification Head       │      │
│                          │  └────────────────────────────────┘      │
│                          │                                           │
│                          │  Output_Before:  [0.15, 0.85]            │
│                          │                  (clean, unclean)        │
│                          │                                           │
│                          │  Output_After:   [0.92, 0.08]            │
│                          │                  (clean, unclean)        │
│                          │                                           │
│                          │  Prediction_Before: UNCLEAN (0.85)      │
│                          │  Prediction_After:  CLEAN (0.92)        │
│                          │                                           │
│                          │  Compare Results:                         │
│                          │  ✅ Before was unclean                    │
│                          │  ✅ After is clean                        │
│                          │  ✅ Confidence > 0.6 threshold           │
│                          │  ──────────────────────────────          │
│                          │  Result: ✅ CLEANING SUCCESSFUL           │
│                          └──────────────┬──────────────────────────┘
│                                         │
│                                    ┌────▼───────────────┐
│                                    │ Create Verification│
│                                    │ Result Record:     │
│                                    │                    │
│                                    │ • status: verified │
│                                    │ • before_pred:     │
│                                    │   unclean (0.85)   │
│                                    │ • after_pred:      │
│                                    │   clean (0.92)     │
│                                    │ • successful: true │
│                                    │ • confidence: 0.92 │
│                                    │ • message: ✅ OK!  │
│                                    └────┬───────────────┘
│                                         │
│                        ┌────────────────▼──────────────────┐
│                        │ Update CleaningTask               │
│                        │ • after_image: saved             │
│                        │ • status: verified_clean         │
│                        │ • completion_date: NOW           │
│                        └────────────────┬─────────────────┘
│                                         │
│                        ┌────────────────▼──────────────────┐
│                        │ Update Worker Metrics             │
│                        │ • total_tasks += 1               │
│                        │ • verified_clean += 1            │
│                        │ • success_rate recalc            │
│                        │ • average_conf update            │
│                        └────────────────────────────────────┘
│                                                              │
│                                                    ◄─────────┘
│                                                    │
│     ◄──────────────────────────────────────────────┘
│     │
│     Response: ✅ Verification successful
│     {
│       "verification_status": "verified_clean",
│       "cleanup_successful": true,
│       "cleanup_confidence": 0.92,
│       "message": "✅ Cleaning successful! (92% confidence)"
│     }
│     │
│     ▼
│   ┌──────────────────┐
│   │ Show Result to   │
│   │ Worker:          │
│   │ ────────────────│
│   │ ✅ TASK VERIFIED│
│   │ Confidence: 92% │
│   │ Great work!     │
│   └──────────────────┘
│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Model Relationships

```
┌────────────────────────────┐
│      User (Django)         │
│  ──────────────────────    │
│  • id (PK)                 │
│  • username                │
│  • email                   │
│  • first_name              │
│  • last_name               │
└────────┬───────────────────┘
         │ (one-to-many)
         │ worker_id FK
         │
         ▼
┌────────────────────────────┐         ┌──────────────────────────┐
│    CleaningTask            │         │  CleaningMetrics         │
│  ──────────────────────    │         │  ─────────────────────  │
│  • id (PK)                 │         │  • id (PK)              │
│  • task_id (UNIQUE)        │         │  • worker_id FK (U)     │
│  • worker_id FK ─────────┬─┼─────────►  • total_tasks          │
│  • location                │         │  • completed_tasks      │
│  • description             │         │  • verified_clean       │
│  • status                  │         │  • verification_failed  │
│  • assigned_date           │         │  • success_rate         │
│  • completion_date         │         │  • average_confidence   │
│  • before_image (file)     │         │  • last_task_date       │
│  • after_image (file)      │         └──────────────────────────┘
└────┬───────────────────────┘
     │ (one-to-one)
     │ verification_id FK
     │
     ▼
┌────────────────────────────────┐
│   VerificationResult           │
│  ─────────────────────────────│
│  • id (PK)                     │
│  • cleaning_task_id FK (U)     │
│  • verification_status         │
│  • verified_at                 │
│  • before_prediction           │
│  • before_confidence           │
│  • before_class_scores (JSON)  │
│  • after_prediction            │
│  • after_confidence            │
│  • after_class_scores (JSON)   │
│  • cleanup_successful          │
│  • cleanup_confidence          │
│  • recommendation_message      │
│  • model_version               │
│  • confidence_threshold        │
│  • error_message               │
│  • created_at                  │
│  • updated_at                  │
└────────────────────────────────┘
```

---

## 🎯 API Request/Response Flow

### Example: Complete Cleaning Verification Flow

```
─────────────────────────────────────────────────────────────────────

REQUEST 1: Upload Before Image
POST /api/operations/upload-before/

Request Body (multipart/form-data):
├─ task_id: "CLEANUP_MAIN_ST_001"
├─ location: "Main Street - Storm Drain"
├─ description: "Clean the storm drain on Main St"
└─ image: <before_photo.jpg binary data>

Response (201 Created):
{
  "success": true,
  "message": "Before image uploaded successfully",
  "task_id": "CLEANUP_MAIN_ST_001",
  "task": {
    "id": 42,
    "task_id": "CLEANUP_MAIN_ST_001",
    "worker": 7,
    "worker_name": "John Smith",
    "location": "Main Street - Storm Drain",
    "description": "Clean the storm drain on Main St",
    "status": "in_progress",
    "assigned_date": "2024-03-24T10:30:00Z",
    "before_image": "/media/cleaning_tasks/before/before_photo_abc123.jpg",
    "after_image": null,
    "verification": null
  }
}

─────────────────────────────────────────────────────────────────────

[Worker cleans for ~20 minutes]

─────────────────────────────────────────────────────────────────────

REQUEST 2: Upload After Image & Verify
POST /api/operations/upload-after-verify/

Request Body (multipart/form-data):
├─ task_id: "CLEANUP_MAIN_ST_001"
├─ image: <after_photo.jpg binary data>
└─ confidence_threshold: 0.65

Response (200 OK):
{
  "success": true,
  "message": "After image uploaded and verification complete",
  "task": {
    "id": 42,
    "task_id": "CLEANUP_MAIN_ST_001",
    "worker": 7,
    "worker_name": "John Smith",
    "location": "Main Street - Storm Drain",
    "status": "verified_clean",
    "assigned_date": "2024-03-24T10:30:00Z",
    "completion_date": "2024-03-24T10:52:00Z",
    "before_image": "/media/cleaning_tasks/before/before_photo_abc123.jpg",
    "after_image": "/media/cleaning_tasks/after/after_photo_def456.jpg"
  },
  "verification": {
    "id": 15,
    "verification_status": "verified_clean",
    "verified_at": "2024-03-24T10:52:00Z",
    "before_prediction": "unclean",
    "before_confidence": 0.87,
    "before_class_scores": {
      "clean": 0.13,
      "unclean": 0.87
    },
    "after_prediction": "clean",
    "after_confidence": 0.91,
    "after_class_scores": {
      "clean": 0.91,
      "unclean": 0.09
    },
    "cleanup_successful": true,
    "cleanup_confidence": 0.91,
    "recommendation_message": "✅ Cleaning successful! Area is now clean (confidence: 91.0%)",
    "model_version": "vit-base-patch16-224",
    "confidence_threshold": 0.65,
    "error_message": ""
  }
}

─────────────────────────────────────────────────────────────────────

REQUEST 3: Get Worker Metrics
GET /api/operations/my-metrics/

Response (200 OK):
{
  "success": true,
  "metrics": {
    "total_tasks": 48,
    "completed_tasks": 47,
    "verified_clean": 45,
    "verification_failed": 2,
    "success_rate": 95.74,
    "average_confidence": 0.88,
    "last_task_date": "2024-03-24T10:52:00Z"
  }
}

─────────────────────────────────────────────────────────────────────
```

---

## 🔄 Training Pipeline Architecture

```
1. DATA PREPARATION
   │
   ├─ TrashNet Dataset
   │  └─► ~2,500 trash images (garythung/trashnet)
   │
   ├─ TACO Dataset
   │  └─► ~2,000+ litter images (tacodataset/taco)
   │
   ├─ Clean Images (User Provided)
   │  └─► ~500-1000 clean area images
   │
   └─► Combined Dataset
       ├─ 80% Train Split
       ├─ 10% Validation Split
       └─ 10% Test Split

2. MODEL SELECTION
   │
   └─ Vision Transformer (ViT-base)
      ├─ google/vit-base-patch16-224 (pretrained)
      ├─ Input: 224×224×3 RGB images
      ├─ Patch Embedding: 16×16 = 196 patches
      ├─ Transformer Encoder: 12 layers
      ├─ Hidden Size: 768 dimensions
      └─ Output: 2 classes (clean, unclean)

3. TRAINING LOOP
   │
   ├─ Initialize Model
   ├─ Load Training Data
   ├─ For each epoch (1-15):
   │  ├─ For each batch:
   │  │  ├─ Forward pass
   │  │  ├─ Compute loss
   │  │  ├─ Backward pass
   │  │  └─ Update weights
   │  ├─ Validate on Validation set
   │  ├─ Check early stopping criteria
   │  └─ Save best model if improved
   │
   └─ Final Evaluation on Test Set

4. OUTPUT ARTIFACTS
   │
   ├─ best_model/
   │  ├─ pytorch_model.bin (weights: 4GB)
   │  ├─ config.json (model config)
   │  ├─ preprocessor_config.json (ViT processor)
   │  └─ training_config.json (hyperparameters)
   │
   ├─ training_history.json
   │  ├─ train_loss
   │  ├─ val_loss
   │  ├─ val_accuracy
   │  └─ learning_rate
   │
   └─ training_history.png (charts)
      ├─ Loss curves
      └─ Accuracy curves
```

---

## 📦 Directory Structure (Complete)

```
BackendWoekSense/
│
├── 📄 README.md (Project overview)
├── 📄 QUICK_START_CHECKLIST.md (Quick start guide)
├── 📄 IMPLEMENTATION_SUMMARY.md (What was built)
├── 📄 requirements.txt (Python packages)
├── 📄 .env.example (Configuration template)
├── 📄 manage.py (Django CLI)
├── 📄 db.sqlite3 (Database)
├── 📄 quick_start.py (Setup wizard)
├── 📄 test_system_health.py (System validator)
│
├── 🗂️ BackendWoekSense/
│   ├── settings.py (Django config + ML paths)
│   ├── urls.py (Main URL routing)
│   ├── asgi.py
│   └── wsgi.py
│
├── 🗂️ operations/ ⭐ Core Cleaning Detection App
│   ├── models.py (CleaningTask, VerificationResult, CleaningMetrics)
│   ├── views.py (5 API endpoints)
│   ├── serializers.py (DRF serializers)
│   ├── urls.py (operations routes)
│   ├── admin.py (Django admin config)
│   ├── apps.py
│   ├── tests.py
│   └── migrations/
│
├── 🗂️ ml_models/ ⭐ Machine Learning Core
│   │
│   ├── 📄 SETUP_GUIDE.md (500+ line setup doc)
│   │
│   ├── 🗂️ datasets/
│   │   ├── prepare_datasets.py (Download & organize)
│   │   ├── raw/ (Downloaded datasets)
│   │   │   ├── trashnet/ (Auto-downloaded)
│   │   │   ├── taco/ (Auto-downloaded)
│   │   │   └── clean_images/ (User adds here)
│   │   └── processed/ (Organized data)
│   │       ├── train/
│   │       │   ├── clean/
│   │       │   └── unclean/
│   │       ├── val/
│   │       │   ├── clean/
│   │       │   └── unclean/
│   │       ├── test/
│   │       │   ├── clean/
│   │       │   └── unclean/
│   │       └── dataset_info.json
│   │
│   ├── 🗂️ training/
│   │   └── train_vit_model.py (Training pipeline)
│   │
│   ├── 🗂️ models/
│   │   ├── inference.py (Model loading + prediction)
│   │   └── vit_cleaning_detector/ (Trained model)
│   │       ├── best_model/ ⭐ Best trained model
│   │       │   ├── config.json
│   │       │   ├── pytorch_model.bin
│   │       │   ├── preprocessor_config.json
│   │       │   └── training_config.json
│   │       ├── final_model/ (Final checkpoint)
│   │       ├── training_history.json
│   │       └── training_history.png
│   │
│   └── (standard dirs)
│       ├── __init__.py
│       ├── datasets/__init__.py
│       ├── training/__init__.py
│       └── models/__init__.py
│
├── 🗂️ media/ (Uploaded images)
│   └── cleaning_tasks/
│       ├── before/ (Before photos)
│       └── after/ (After photos)
│
├── 🗂️ accounts/ (User management)
├── 🗂️ attendance/ (Attendance tracking)
├── 🗂️ fleet/ (Fleet management)
├── 🗂️ iot_assets/ (IoT asset tracking)
├── 🗂️ reports/ (Reporting system)
│
└── 🗂️ WorkSense/ (React Frontend)
    ├── app/(worker)/
    │   ├── camera.jsx (Image capture)
    │   └── dashboard.jsx (Task dashboard)
    └── src/constants/
        └── api.js (API endpoints)
```

---

**This architecture ensures**:
✅ Clean separation of concerns
✅ Scalable ML pipeline
✅ RESTful API design
✅ Mobile-first frontend integration
✅ Production-ready infrastructure
