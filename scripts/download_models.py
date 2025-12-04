from sentence_transformers import SentenceTransformer, CrossEncoder
import os

def download_models():
    print("Downloading Memory Models...")
    
    # 1. Embedder (Fast)
    print("Downloading Embedder: all-MiniLM-L6-v2...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
    embedder.save("./models/embedder")
    print("Embedder saved to ./models/embedder")
    
    # 2. Reranker (Smart)
    print("Downloading Reranker: cross-encoder/ms-marco-MiniLM-L-6-v2...")
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    reranker.save("./models/reranker")
    print("Reranker saved to ./models/reranker")
    
    print("All models downloaded successfully.")

if __name__ == "__main__":
    download_models()
