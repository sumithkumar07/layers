import os
from datasets import load_dataset
import json

def download_anli():
    if os.path.exists('data/anli_clean.json'):
        print("ANLI already downloaded.")
        return

    print("Downloading ANLI dataset...")
    try:
        # Load ANLI Round 1
        dataset = load_dataset("anli", split="train_r1", trust_remote_code=True)
    except Exception as e:
        print(f"Error loading ANLI: {e}")
        return

    print("Processing ANLI dataset...")
    # ANLI has 'premise', 'hypothesis', 'label'
    # Labels: 0 (Entailment), 1 (Neutral), 2 (Contradiction)
    
    data = []
    for item in dataset:
        data.append({
            'premise': item['premise'],
            'hypothesis': item['hypothesis'],
            'label': item['label'],
            'uid': str(item['uid'])
        })
        
    os.makedirs('data', exist_ok=True)
    output_path = 'data/anli_clean.json'
    with open(output_path, 'w') as f:
        json.dump(data, f)
    print(f"Saved {len(data)} ANLI items to {output_path}")

if __name__ == "__main__":
    download_anli()
