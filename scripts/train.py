import pandas as pd
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset
import os

def train_model():
    print("Loading data...")
    df = pd.read_csv('data/train_dataset_ready.csv')
    
    # Split Train/Val (99% Train, 1% Val for speed/check)
    # Or just use all for training as per user request? 
    # User said "Validation: Test the model on 100 unseen examples".
    # I will hold out 1000 examples for validation/test.
    
    # Split Train/Val (99% Train, 1% Val for speed/check)
    # User said "Validation: Test the model on 100 unseen examples".
    # I will hold out 1000 examples for validation/test.
    
    train_df = df.iloc[:-1000]
    val_df = df.iloc[-1000:]
    
    print(f"Train size: {len(train_df)}, Val size: {len(val_df)}")
    
    # Convert to HuggingFace Dataset
    train_dataset = Dataset.from_pandas(train_df)
    val_dataset = Dataset.from_pandas(val_df)
    
    print("Initializing Model and Tokenizer...")
    model_name = "distilbert-base-uncased"
    tokenizer = DistilBertTokenizer.from_pretrained(model_name)
    model = DistilBertForSequenceClassification.from_pretrained(model_name, num_labels=2)
    
    # Tokenization function
    def tokenize_function(examples):
        return tokenizer(examples['text'], padding="max_length", truncation=True, max_length=128)
    
    print("Tokenizing...")
    train_dataset = train_dataset.map(tokenize_function, batched=True)
    val_dataset = val_dataset.map(tokenize_function, batched=True)
    
    # Set format for PyTorch
    train_dataset.set_format(type='torch', columns=['input_ids', 'attention_mask', 'label'])
    val_dataset.set_format(type='torch', columns=['input_ids', 'attention_mask', 'label'])
    
    print("Configuring Training...")
    training_args = TrainingArguments(
        output_dir='./checkpoints',
        num_train_epochs=1,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=8, # Effective BS = 32
        fp16=True, # RTX 3050 optimization
        logging_steps=100,
        save_strategy="epoch",
        eval_strategy="steps",
        eval_steps=500,
        learning_rate=2e-5,
        weight_decay=0.01,
        push_to_hub=False,
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
    )
    
    print("Starting Training...")
    trainer.train()
    
    print("Saving final model...")
    trainer.save_model("./final_judge_model")
    tokenizer.save_pretrained("./final_judge_model")
    print("Training Complete. Model saved to ./final_judge_model")

if __name__ == "__main__":
    train_model()
