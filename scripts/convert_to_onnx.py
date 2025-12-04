import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification
import os
from pathlib import Path

# Install required packages if not present
# pip install onnx onnxruntime

def convert_to_onnx():
    model_path = "./final_judge_model"
    output_dir = Path("models")
    output_dir.mkdir(exist_ok=True)
    
    onnx_path = output_dir / "model.onnx"
    quant_path = output_dir / "model_quant.onnx"
    
    print(f"Loading model from {model_path}...")
    tokenizer = DistilBertTokenizer.from_pretrained(model_path)
    model = DistilBertForSequenceClassification.from_pretrained(model_path)
    model.eval()
    
    # Create dummy input for export
    dummy_text = "This is a claim [SEP] This is evidence"
    inputs = tokenizer(dummy_text, return_tensors="pt")
    
    print("Exporting to ONNX...")
    torch.onnx.export(
        model, 
        (inputs['input_ids'], inputs['attention_mask']), 
        onnx_path, 
        input_names=['input_ids', 'attention_mask'], 
        output_names=['logits'], 
        dynamic_axes={
            'input_ids': {0: 'batch_size', 1: 'sequence_length'}, 
            'attention_mask': {0: 'batch_size', 1: 'sequence_length'}, 
            'logits': {0: 'batch_size'}
        },
        opset_version=14
    )
    print(f"ONNX model saved to {onnx_path}")
    
    print("Quantizing to INT8...")
    from onnxruntime.quantization import quantize_dynamic, QuantType
    
    quantize_dynamic(
        model_input=onnx_path,
        model_output=quant_path,
        weight_type=QuantType.QUInt8
    )
    
    print(f"Quantized model saved to {quant_path}")
    
    # Compare sizes
    orig_size = os.path.getsize(onnx_path) / (1024 * 1024)
    quant_size = os.path.getsize(quant_path) / (1024 * 1024)
    
    print(f"Original Size: {orig_size:.2f} MB")
    print(f"Quantized Size: {quant_size:.2f} MB")
    print(f"Reduction: {(1 - quant_size/orig_size)*100:.2f}%")

if __name__ == "__main__":
    convert_to_onnx()
