from sentence_transformers import SentenceTransformer, CrossEncoder
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MemoryEngine:
    def __init__(self, models_path="./models"):
        logger.info("Loading Memory Engine...")
        
        # Paths
        embedder_path = os.path.join(models_path, "embedder")
        reranker_path = os.path.join(models_path, "reranker")
        
        # Load Embedder
        if os.path.exists(embedder_path):
            self.embedder = SentenceTransformer(embedder_path)
        else:
            logger.warning("Local embedder not found, downloading...")
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
            
        # Load Reranker
        if os.path.exists(reranker_path):
            self.reranker = CrossEncoder(reranker_path)
        else:
            logger.warning("Local reranker not found, downloading...")
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            
        logger.info("Memory Engine Ready.")

    def embed_text(self, text: str):
        """
        Converts text into a 384-dimensional vector.
        """
        try:
            embedding = self.embedder.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return []

    def rerank_results(self, query: str, results: list):
        """
        Re-ranks a list of results using the Cross-Encoder.
        Results should be a list of dicts with 'content' key.
        Returns the sorted list.
        """
        if not results:
            return []
            
        try:
            # Prepare pairs for Cross-Encoder: [[query, doc1], [query, doc2], ...]
            pairs = [[query, res['content']] for res in results]
            
            # Get scores
            scores = self.reranker.predict(pairs)
            
            # Attach scores to results
            for i, res in enumerate(results):
                res['rerank_score'] = float(scores[i])
                
            # Sort by score (descending)
            sorted_results = sorted(results, key=lambda x: x['rerank_score'], reverse=True)
            
            return sorted_results
        except Exception as e:
            logger.error(f"Reranking failed: {e}")
            return results

if __name__ == "__main__":
    # Test
    engine = MemoryEngine()
    
    # Test Embedding
    vec = engine.embed_text("Hello World")
    print(f"Vector length: {len(vec)}")
    
    # Test Reranking
    query = "What is the capital of France?"
    docs = [
        {"content": "Paris is the capital of France.", "id": 1},
        {"content": "London is the capital of the UK.", "id": 2},
        {"content": "France has a nice capital city.", "id": 3}
    ]
    ranked = engine.rerank_results(query, docs)
    print("Top Result:", ranked[0]['content'])
