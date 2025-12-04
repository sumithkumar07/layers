import onnxruntime as ort
from transformers import DistilBertTokenizer
import numpy as np
import os
from src.search_engine import SearchEngine

class InferenceEngine:
    def __init__(self, model_path="models/model_quant.onnx", tokenizer_path="./final_judge_model", confidence_threshold=0.75):
        print(f"Loading Inference Engine...")
        print(f"Model: {model_path}")
        print(f"Tokenizer: {tokenizer_path}")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")

        try:
            self.session = ort.InferenceSession(model_path)
            self.tokenizer = DistilBertTokenizer.from_pretrained(tokenizer_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load model or tokenizer: {e}")

        self.labels = {0: "FALSE", 1: "TRUE"} # 0=Contradiction, 1=Entailment
        self.confidence_threshold = confidence_threshold
        
        # Initialize Search Engine
        try:
            self.search_engine = SearchEngine()
        except Exception as e:
            raise RuntimeError(f"Failed to initialize SearchEngine: {e}")
        
    def softmax(self, x):
        e_x = np.exp(x - np.max(x))
        return e_x / e_x.sum()

    def verify_claim(self, claim, evidence=None):
        """
        Verifies a claim. If evidence is missing, searches the web.
        """
        sources = []
        # Auto-Search Logic
        if not evidence:
            print(f"No evidence provided. Auto-searching for: {claim}")
            evidence = self.search_engine.get_evidence(claim)
            sources = self.search_engine.get_last_sources()
            if not evidence:
                return {
                    "claim": claim,
                    "evidence": "",
                    "result": "UNCERTAIN",
                    "confidence": 0.0,
                    "raw_probs": [0.5, 0.5],
                    "sources": sources
                }
            try:
                print(f"Found evidence: {evidence[:100].encode('utf-8', 'ignore').decode('utf-8')}...")
            except:
                pass
        # Format input
        text = f"{claim} [SEP] {evidence}"
        
        try:
            # Tokenize
            inputs = self.tokenizer(text, return_tensors="np", padding="max_length", truncation=True, max_length=128)
            
            # ONNX Inference
            ort_inputs = {
                'input_ids': inputs['input_ids'].astype(np.int64),
                'attention_mask': inputs['attention_mask'].astype(np.int64)
            }
            
            logits = self.session.run(None, ort_inputs)[0][0]
            probs = self.softmax(logits)
            
            pred_idx = np.argmax(probs)
            confidence = probs[pred_idx]
            
            # Logic Gate
            result = self.labels[pred_idx]
            if confidence < self.confidence_threshold:
                result = "UNCERTAIN"
            
            return {
                "claim": claim,
                "evidence": evidence[:200] + "..." if len(evidence) > 200 else evidence,
                "result": result,
                "confidence": float(confidence),
                "raw_probs": probs.tolist(),
                "sources": sources
            }
        except Exception as e:
            # Handle tokenization or inference errors gracefully
            return {
                "claim": claim,
                "evidence": evidence[:200] + "..." if len(evidence) > 200 else evidence,
                "result": "ERROR",
                "confidence": 0.0,
                "raw_probs": [],
                "sources": sources,
                "error": str(e)
            }

if __name__ == "__main__":
    # Simple test
    engine = InferenceEngine()
    
    # Test Case 1: Obvious True
    c1 = "The sky is blue."
    e1 = "The sky appears blue to the human eye."
    print(f"\nTest 1: {c1} | {e1}")
    print(engine.verify_claim(c1, e1))
    
    # Test Case 2: Auto-Search
    c2 = "The capital of France is Paris."
    print(f"\nTest 2 (Auto-Search): {c2}")
    print(engine.verify_claim(c2))
