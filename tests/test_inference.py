import sys
import os
import time
import numpy as np
from unittest.mock import patch

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from inference_engine import InferenceEngine

def test_inference():
    print("Initializing Inference Engine...")
    engine = InferenceEngine()
    
    # 1. Test Entailment
    print("\n[Test 1] Entailment")
    res = engine.predict("The sky is blue.", "The sky appears blue to the human eye.")
    print(f"Result: {res}")
    assert res['result'] == 'TRUE', "Should be TRUE"
    
    # 2. Test Contradiction
    print("\n[Test 2] Contradiction")
    res = engine.predict("The earth is flat.", "The earth is an oblate spheroid.")
    print(f"Result: {res}")
    assert res['result'] == 'FALSE', "Should be FALSE"
    
    # 3. Test Logic Gate (Force Low Confidence)
    print("\n[Test 3] Logic Gate (Uncertainty)")
    # Mocking the session run to return ambiguous logits
    # Logits [0.5, 0.5] -> Softmax [0.5, 0.5] -> Confidence 0.5 < 0.75
    with patch.object(engine.session, 'run', return_value=[[np.array([0.1, 0.1])]]):
        res = engine.predict("Ambiguous claim", "Ambiguous evidence")
        print(f"Result: {res}")
        assert res['result'] == 'UNCERTAIN', "Should be UNCERTAIN"
        
    # 4. Performance Test
    print("\n[Test 4] Performance (100 runs)")
    start_time = time.time()
    for _ in range(100):
        engine.predict("The sky is blue.", "The sky appears blue.")
    end_time = time.time()
    avg_time = (end_time - start_time) / 100
    print(f"Average Inference Time: {avg_time*1000:.2f} ms")
    
    print("\nALL TESTS PASSED")

if __name__ == "__main__":
    test_inference()
