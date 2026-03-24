"""
Dataset preparation script for cleaning area detection model.
Downloads and prepares TrashNet and TACO datasets for ViT training.
"""

import os
import json
import shutil
from pathlib import Path
from typing import Tuple, List
import requests
from datasets import load_dataset
from PIL import Image
import numpy as np
from sklearn.model_selection import train_test_split
from tqdm import tqdm

class DatasetPreparator:
    """Prepare datasets for ViT model training."""
    
    def __init__(self, base_dir: str = "./ml_models/datasets"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Directories for different datasets
        self.raw_dir = self.base_dir / "raw"
        self.processed_dir = self.base_dir / "processed"
        self.raw_dir.mkdir(exist_ok=True)
        self.processed_dir.mkdir(exist_ok=True)
        
        self.train_dir = self.processed_dir / "train"
        self.val_dir = self.processed_dir / "val"
        self.test_dir = self.processed_dir / "test"
        
        for d in [self.train_dir, self.val_dir, self.test_dir]:
            (d / "clean").mkdir(parents=True, exist_ok=True)
            (d / "unclean").mkdir(parents=True, exist_ok=True)
    
    def download_trashnet(self) -> bool:
        """Download TrashNet dataset from Hugging Face."""
        print("📥 Downloading TrashNet dataset...")
        try:
            dataset = load_dataset("garythung/trashnet")
            trashnet_dir = self.raw_dir / "trashnet"
            trashnet_dir.mkdir(exist_ok=True)
            
            # Save images
            for split in dataset.keys():
                split_dir = trashnet_dir / split
                split_dir.mkdir(exist_ok=True)
                
                images_dir = split_dir / "images"
                images_dir.mkdir(exist_ok=True)
                
                for idx, example in enumerate(tqdm(dataset[split], desc=f"Processing {split}")):
                    img = example['image']
                    # Save image
                    img_path = images_dir / f"image_{idx}.jpg"
                    img.save(img_path)
            
            print("✅ TrashNet downloaded successfully!")
            return True
        except Exception as e:
            print(f"❌ Error downloading TrashNet: {e}")
            return False
    
    def download_taco(self) -> bool:
        """Download TACO dataset from Hugging Face."""
        print("📥 Downloading TACO dataset...")
        try:
            dataset = load_dataset("tacodataset/taco")
            taco_dir = self.raw_dir / "taco"
            taco_dir.mkdir(exist_ok=True)
            
            # Save images
            split_dir = taco_dir / "litter"
            split_dir.mkdir(exist_ok=True)
            
            for idx, example in enumerate(tqdm(dataset['train'], desc="Processing TACO")):
                if 'image' in example:
                    img = example['image']
                    img_path = split_dir / f"litter_{idx}.jpg"
                    img.save(img_path)
            
            print("✅ TACO downloaded successfully!")
            return True
        except Exception as e:
            print(f"❌ Error downloading TACO: {e}")
            return False
    
    def download_coco_clean_images(self) -> bool:
        """
        Download clean environment images from COCO dataset.
        These will be labeled as 'clean'.
        """
        print("📥 Preparing clean environment dataset...")
        try:
            # For now, we'll create a placeholder if you have local clean images
            # You can manually add clean images to: ml_models/datasets/raw/clean_images/
            clean_dir = self.raw_dir / "clean_images"
            clean_dir.mkdir(exist_ok=True)
            
            # Instructions for manual clean images
            instructions_file = clean_dir / "README.txt"
            instructions = """
MANUAL STEP REQUIRED:
====================

Add clean environment images to this directory for training.

Recommended sources for clean images:
1. Your municipal database/existing photos of clean areas
2. COCO dataset (specific categories: beach, street, park when clean)
3. Collect from successfully completed cleaning operations
4. Open Images Dataset v7 (search for 'clean street', 'clean area')

Directory structure:
- ml_models/datasets/raw/clean_images/
  - clean_1.jpg
  - clean_2.jpg
  - ...

Tips:
- Use at least 500-1000 images for best results
- Ensure good variety (different times, weather, locations)
- Resize images to consistent dimensions during preprocessing
            """
            with open(instructions_file, 'w') as f:
                f.write(instructions)
            
            print("✅ Clean image directory prepared (see README.txt)")
            return True
        except Exception as e:
            print(f"❌ Error preparing clean images: {e}")
            return False
    
    def prepare_dataset_splits(self, test_size: float = 0.1, val_size: float = 0.15) -> bool:
        """
        Organize raw datasets into train/val/test splits with labels.
        
        Label mapping:
        - 'unclean': TrashNet images + TACO litter images
        - 'clean': Clean environment images
        """
        print("\n🔄 Organizing dataset into train/val/test splits...")
        
        unclean_images = []
        clean_images = []
        
        # Collect unclean images from TrashNet
        trashnet_dir = self.raw_dir / "trashnet"
        if trashnet_dir.exists():
            for split in trashnet_dir.iterdir():
                if split.is_dir():
                    images_dir = split / "images"
                    if images_dir.exists():
                        for img_file in images_dir.glob("*.jpg"):
                            unclean_images.append(img_file)
            print(f"Found {len(unclean_images)} TrashNet images")
        
        # Collect unclean images from TACO
        taco_dir = self.raw_dir / "taco"
        if taco_dir.exists():
            litter_dir = taco_dir / "litter"
            if litter_dir.exists():
                for img_file in litter_dir.glob("*.jpg"):
                    unclean_images.append(img_file)
            print(f"Found {len(unclean_images)} total unclean images (TACO + TrashNet)")
        
        # Collect clean images
        clean_dir = self.raw_dir / "clean_images"
        if clean_dir.exists():
            for img_file in clean_dir.glob("*.*"):
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                    clean_images.append(img_file)
        print(f"Found {len(clean_images)} clean images")
        
        # Create train/val/test splits
        unclean_train, unclean_temp = train_test_split(
            unclean_images, test_size=(test_size + val_size), random_state=42
        )
        unclean_val, unclean_test = train_test_split(
            unclean_temp, test_size=test_size / (test_size + val_size), random_state=42
        )
        
        clean_train, clean_temp = train_test_split(
            clean_images, test_size=(test_size + val_size), random_state=42
        )
        clean_val, clean_test = train_test_split(
            clean_temp, test_size=test_size / (test_size + val_size), random_state=42
        )
        
        # Copy images to organized directories
        print("\n📂 Copying images to organized directories...")
        
        splits = {
            'train': (unclean_train, clean_train),
            'val': (unclean_val, clean_val),
            'test': (unclean_test, clean_test)
        }
        
        for split_name, (unclean_list, clean_list) in splits.items():
            split_path = getattr(self, f"{split_name}_dir")
            
            # Copy unclean images
            for idx, img_path in enumerate(tqdm(unclean_list, desc=f"Copying {split_name} unclean")):
                try:
                    dst = split_path / "unclean" / f"unclean_{idx:06d}{img_path.suffix}"
                    shutil.copy2(img_path, dst)
                except Exception as e:
                    print(f"Error copying {img_path}: {e}")
            
            # Copy clean images
            for idx, img_path in enumerate(tqdm(clean_list, desc=f"Copying {split_name} clean")):
                try:
                    dst = split_path / "clean" / f"clean_{idx:06d}{img_path.suffix}"
                    shutil.copy2(img_path, dst)
                except Exception as e:
                    print(f"Error copying {img_path}: {e}")
        
        # Create dataset info
        self._create_dataset_info(len(unclean_train) + len(clean_train),
                                 len(unclean_val) + len(clean_val),
                                 len(unclean_test) + len(clean_test))
        
        print("\n✅ Dataset preparation complete!")
        return True
    
    def _create_dataset_info(self, train_count: int, val_count: int, test_count: int):
        """Create a dataset info file."""
        info = {
            "name": "CleaningAreaDetection",
            "description": "Combined TrashNet + TACO dataset for detecting clean vs unclean areas",
            "labels": {
                "0": "clean",
                "1": "unclean"
            },
            "splits": {
                "train": train_count,
                "val": val_count,
                "test": test_count
            },
            "total": train_count + val_count + test_count
        }
        
        with open(self.processed_dir / "dataset_info.json", 'w') as f:
            json.dump(info, f, indent=2)
        
        print(f"\n📊 Dataset Statistics:")
        print(f"   Train: {train_count}")
        print(f"   Val:   {val_count}")
        print(f"   Test:  {test_count}")
        print(f"   Total: {info['total']}")


def main():
    """Main function to prepare dataset."""
    prep = DatasetPreparator()
    
    print("🚀 Starting dataset preparation...\n")
    
    # Download datasets
    prep.download_trashnet()
    prep.download_taco()
    prep.download_coco_clean_images()
    
    # Prepare organized splits
    prep.prepare_dataset_splits()
    
    print("\n✨ Dataset preparation complete!")
    print(f"Datasets available at: {prep.processed_dir}")


if __name__ == "__main__":
    main()
