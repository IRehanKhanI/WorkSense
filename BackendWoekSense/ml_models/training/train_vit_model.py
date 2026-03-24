"""
ViT Model Training Script
Trains google/vit-base-patch16-224 on cleaning area detection dataset
"""

import os
import json
import torch
import numpy as np
from pathlib import Path
from typing import Tuple, Dict
from tqdm import tqdm
import matplotlib.pyplot as plt

from torch.utils.data import DataLoader, Dataset
from torchvision import transforms
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForImageClassification, get_scheduler
from transformers import Trainer, TrainingArguments


class CleaningAreaDataset(Dataset):
    """Custom Dataset for cleaning area detection."""
    
    def __init__(self, image_dir: Path, processor, split: str = "train"):
        self.image_dir = image_dir
        self.processor = processor
        self.split = split
        self.images = []
        self.labels = []
        
        # Load images and labels
        label_map = {"clean": 0, "unclean": 1}
        
        for label_name, label_id in label_map.items():
            label_dir = image_dir / label_name
            if label_dir.exists():
                for img_file in label_dir.glob("*"):
                    if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png']:
                        self.images.append(img_file)
                        self.labels.append(label_id)
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            # Process image using ViT processor
            inputs = self.processor(images=image, return_tensors="pt")
            # Remove batch dimension for single image
            inputs = {k: v.squeeze(0) for k, v in inputs.items()}
            inputs['labels'] = torch.tensor(label)
            return inputs
        except Exception as e:
            print(f"Error loading image {img_path}: {e}")
            # Return a dummy black image on error
            dummy_img = Image.new('RGB', (224, 224), color='black')
            inputs = self.processor(images=dummy_img, return_tensors="pt")
            inputs = {k: v.squeeze(0) for k, v in inputs.items()}
            inputs['labels'] = torch.tensor(label)
            return inputs


class ViTTrainer:
    """Trainer for ViT model on cleaning area detection."""
    
    def __init__(self, 
                 dataset_dir: str = "./ml_models/datasets/processed",
                 model_name: str = "google/vit-base-patch16-224",
                 output_dir: str = "./ml_models/models/vit_cleaning_detector",
                 num_epochs: int = 10,
                 batch_size: int = 32,
                 learning_rate: float = 2e-5):
        
        self.dataset_dir = Path(dataset_dir)
        self.model_name = model_name
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.num_epochs = num_epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        
        # Device setup
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        # Load processor and model
        print(f"Loading model: {model_name}")
        self.processor = AutoImageProcessor.from_pretrained(model_name)
        self.model = AutoModelForImageClassification.from_pretrained(
            model_name,
            num_labels=2,
            problem_type="single_label_classification"
        )
        self.model.to(self.device)
        
        # Freeze backbone layers (optional - for faster training)
        # Uncomment if you want to only train the classification head
        # for param in self.model.vit.parameters():
        #     param.requires_grad = False
        
        self.training_history = {
            'train_loss': [],
            'val_loss': [],
            'val_accuracy': [],
            'learning_rate': []
        }
    
    def load_datasets(self) -> Tuple[DataLoader, DataLoader, DataLoader]:
        """Load train, val, and test datasets."""
        print("\n📂 Loading datasets...")
        
        train_dir = self.dataset_dir / "train"
        val_dir = self.dataset_dir / "val"
        test_dir = self.dataset_dir / "test"
        
        train_dataset = CleaningAreaDataset(train_dir, self.processor, "train")
        val_dataset = CleaningAreaDataset(val_dir, self.processor, "val")
        test_dataset = CleaningAreaDataset(test_dir, self.processor, "test")
        
        print(f"Train samples: {len(train_dataset)}")
        print(f"Val samples: {len(val_dataset)}")
        print(f"Test samples: {len(test_dataset)}")
        
        train_loader = DataLoader(train_dataset, batch_size=self.batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=self.batch_size, shuffle=False)
        test_loader = DataLoader(test_dataset, batch_size=self.batch_size, shuffle=False)
        
        return train_loader, val_loader, test_loader
    
    def train(self):
        """Train the model."""
        print("\n🎓 Starting training...\n")
        
        # Load datasets
        train_loader, val_loader, test_loader = self.load_datasets()
        
        # Setup optimizer and scheduler
        optimizer = torch.optim.AdamW(self.model.parameters(), lr=self.learning_rate)
        total_steps = len(train_loader) * self.num_epochs
        scheduler = get_scheduler(
            "linear",
            optimizer=optimizer,
            num_warmup_steps=0,
            num_training_steps=total_steps
        )
        
        best_val_accuracy = 0.0
        patience = 3
        patience_counter = 0
        
        for epoch in range(self.num_epochs):
            print(f"\n{'='*60}")
            print(f"Epoch {epoch+1}/{self.num_epochs}")
            print(f"{'='*60}")
            
            # Training phase
            self.model.train()
            train_loss = 0.0
            
            progress_bar = tqdm(train_loader, desc="Training")
            for batch in progress_bar:
                # Move batch to device
                batch = {k: v.to(self.device) for k, v in batch.items()}
                
                # Forward pass
                outputs = self.model(**batch)
                loss = outputs.loss
                
                # Backward pass
                loss.backward()
                optimizer.step()
                scheduler.step()
                optimizer.zero_grad()
                
                train_loss += loss.item()
                progress_bar.set_postfix({'loss': loss.item()})
            
            avg_train_loss = train_loss / len(train_loader)
            self.training_history['train_loss'].append(avg_train_loss)
            
            print(f"\nTrain Loss: {avg_train_loss:.4f}")
            
            # Validation phase
            val_loss, val_accuracy = self._validate(val_loader)
            self.training_history['val_loss'].append(val_loss)
            self.training_history['val_accuracy'].append(val_accuracy)
            self.training_history['learning_rate'].append(scheduler.get_last_lr()[0])
            
            print(f"Val Loss: {val_loss:.4f} | Val Accuracy: {val_accuracy:.4f}")
            
            # Early stopping
            if val_accuracy > best_val_accuracy:
                best_val_accuracy = val_accuracy
                patience_counter = 0
                self._save_model(f"best_model")
                print(f"✅ Best model saved! Accuracy: {val_accuracy:.4f}")
            else:
                patience_counter += 1
                if patience_counter >= patience:
                    print(f"\n⚠️  Patience exhausted. Stopping training.")
                    break
        
        # Test phase
        print(f"\n{'='*60}")
        print("Testing on test set...")
        print(f"{'='*60}")
        test_loss, test_accuracy = self._validate(test_loader)
        print(f"Test Loss: {test_loss:.4f} | Test Accuracy: {test_accuracy:.4f}")
        
        # Save final model
        self._save_model("final_model")
        self._plot_training_history()
        
        print("\n✨ Training complete!")
    
    def _validate(self, data_loader: DataLoader) -> Tuple[float, float]:
        """Validate the model."""
        self.model.eval()
        total_loss = 0.0
        correct = 0
        total = 0
        
        with torch.no_grad():
            for batch in tqdm(data_loader, desc="Validating", leave=False):
                batch = {k: v.to(self.device) for k, v in batch.items()}
                
                outputs = self.model(**batch)
                loss = outputs.loss
                logits = outputs.logits
                
                total_loss += loss.item()
                
                predictions = torch.argmax(logits, dim=-1)
                correct += (predictions == batch['labels']).sum().item()
                total += batch['labels'].size(0)
        
        avg_loss = total_loss / len(data_loader)
        accuracy = correct / total
        
        return avg_loss, accuracy
    
    def _save_model(self, model_name: str):
        """Save model and processor."""
        save_dir = self.output_dir / model_name
        save_dir.mkdir(parents=True, exist_ok=True)
        
        self.model.save_pretrained(str(save_dir))
        self.processor.save_pretrained(str(save_dir))
        
        # Save training config
        config = {
            "model_name": self.model_name,
            "num_epochs": self.num_epochs,
            "batch_size": self.batch_size,
            "learning_rate": self.learning_rate,
            "labels": {0: "clean", 1: "unclean"}
        }
        with open(save_dir / "training_config.json", 'w') as f:
            json.dump(config, f, indent=2)
    
    def _plot_training_history(self):
        """Plot and save training history."""
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        
        # Loss plot
        axes[0].plot(self.training_history['train_loss'], label='Train Loss', marker='o')
        axes[0].plot(self.training_history['val_loss'], label='Val Loss', marker='s')
        axes[0].set_xlabel('Epoch')
        axes[0].set_ylabel('Loss')
        axes[0].set_title('Training and Validation Loss')
        axes[0].legend()
        axes[0].grid(True, alpha=0.3)
        
        # Accuracy plot
        axes[1].plot(self.training_history['val_accuracy'], label='Val Accuracy', marker='o', color='green')
        axes[1].set_xlabel('Epoch')
        axes[1].set_ylabel('Accuracy')
        axes[1].set_title('Validation Accuracy')
        axes[1].legend()
        axes[1].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plot_path = self.output_dir / "training_history.png"
        plt.savefig(plot_path)
        print(f"Training history saved: {plot_path}")
        plt.close()
        
        # Save history as JSON
        history_path = self.output_dir / "training_history.json"
        with open(history_path, 'w') as f:
            json.dump(self.training_history, f, indent=2)


def main():
    """Main training function."""
    trainer = ViTTrainer(
        dataset_dir="./ml_models/datasets/processed",
        model_name="google/vit-base-patch16-224",
        output_dir="./ml_models/models/vit_cleaning_detector",
        num_epochs=15,
        batch_size=16,  # Reduced for better memory management
        learning_rate=2e-5
    )
    
    trainer.train()


if __name__ == "__main__":
    main()
