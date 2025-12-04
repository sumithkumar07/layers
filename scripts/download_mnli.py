import os
from datasets import load_dataset
import json

def download_mnli():
    if os.path.exists('data/mnli_clean.json'):
        print("MNLI already downloaded.")
        return

    print("Downloading MNLI dataset (GLUE)...")
    try:
        # Load MNLI from GLUE
        dataset = load_dataset("glue", "mnli", split="train")
    except Exception as e:
        print(f"Error loading MNLI: {e}")
        return

    print("Processing MNLI dataset...")
    # MNLI has 'premise', 'hypothesis', 'label'
    # Labels: 0 (Entailment), 1 (Neutral), 2 (Contradiction)
    
    data = []
    for item in dataset:
        data.append({
            'premise': item['premise'],
            'hypothesis': item['hypothesis'],
            'label': item['label'],
            'idx': item['idx']
        })
        
    os.makedirs('data', exist_ok=True)
    output_path = 'data/mnli_clean.json'
    with open(output_path, 'w') as f:
        json.dump(data, f)
    print(f"Saved {len(data)} MNLI items to {output_path}")

if __name__ == "__main__":
    download_mnli()
