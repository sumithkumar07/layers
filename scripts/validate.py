import pandas as pd
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import numpy as np

def validate_model():
    print("Loading validation data...")
    df = pd.read_csv('data/train_dataset_ready.csv')
    
    # Use last 100 examples as "unseen" (consistent with train.py split)
    val_df = df.iloc[-100:]
    
    print(f"Validation set size: {len(val_df)}")
    
    model_path = "./final_judge_model"
    print(f"Loading model from {model_path}...")
    
    try:
        tokenizer = DistilBertTokenizer.from_pretrained(model_path)
        model = DistilBertForSequenceClassification.from_pretrained(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Ensure training has completed and saved the model.")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    model.to(device)
    model.eval()
    
    correct = 0
    total = 0
    
    print("Running inference...")
    for index, row in val_df.iterrows():
        text = row['text']
        label = row['label']
        
        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128).to(device)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            predicted_class = torch.argmax(logits, dim=1).item()
            
        if predicted_class == label:
            correct += 1
        total += 1
        
    accuracy = correct / total
    print(f"Validation Accuracy: {accuracy:.2%} ({correct}/{total})")
    
    if accuracy > 0.85:
        print("SUCCESS: Accuracy > 85%")
    else:
        print("FAILURE: Accuracy < 85%")

if __name__ == "__main__":
    validate_model()
