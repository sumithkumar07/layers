import json
import pandas as pd
import os
import numpy as np

def process_data():
    print("Loading datasets...")
    
    mnli_path = 'data/mnli_clean.json'
    anli_path = 'data/anli_clean.json'
    
    data = []
    
    # Load MNLI
    if os.path.exists(mnli_path):
        with open(mnli_path, 'r') as f:
            mnli_data = json.load(f)
            print(f"Loaded {len(mnli_data)} MNLI items")
            data.extend(mnli_data)
    else:
        print(f"Warning: {mnli_path} not found")

    # Load ANLI
    if os.path.exists(anli_path):
        with open(anli_path, 'r') as f:
            anli_data = json.load(f)
            print(f"Loaded {len(anli_data)} ANLI items")
            data.extend(anli_data)
    else:
        print(f"Warning: {anli_path} not found")
        
    if not data:
        print("No data found!")
        return

    print("Filtering and Formatting...")
    processed = []
    
    # MNLI/ANLI Labels: 0=Entailment, 1=Neutral, 2=Contradiction
    # Target: Entailment -> 1 (True), Contradiction -> 0 (False)
    
    for item in data:
        label = item.get('label')
        if label == 1: # Skip Neutral
            continue
            
        # Map labels
        if label == 0:
            new_label = 1 # True
        elif label == 2:
            new_label = 0 # False
        else:
            continue
            
        # Format: Claim [SEP] Evidence
        # Hypothesis is the Claim, Premise is the Evidence
        claim = item.get('hypothesis', '')
        evidence = item.get('premise', '')
        
        text = f"{claim} [SEP] {evidence}"
        
        processed.append({
            'text': text,
            'label': new_label
        })
        
    df = pd.DataFrame(processed)
    print(f"Filtered data size: {len(df)}")
    print(df['label'].value_counts())
    
    print("Balancing classes...")
    # Undersample majority class
    true_df = df[df['label'] == 1]
    false_df = df[df['label'] == 0]
    
    min_len = min(len(true_df), len(false_df))
    
    true_sampled = true_df.sample(n=min_len, random_state=42)
    false_sampled = false_df.sample(n=min_len, random_state=42)
    
    balanced_df = pd.concat([true_sampled, false_sampled])
    balanced_df = balanced_df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    print(f"Balanced data size: {len(balanced_df)}")
    print(balanced_df['label'].value_counts())
    
    output_path = 'data/train_dataset_ready.csv'
    balanced_df.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    process_data()
