import logging
from duckduckgo_search import DDGS
import trafilatura

logger = logging.getLogger(__name__)
class SearchEngine:
    def __init__(self):
        self.ddgs = DDGS()
        self.last_sources = []

    def search(self, query: str, max_results: int = 3):
        """
        Searches DuckDuckGo for the query and returns a list of result objects.
        """
        try:
            logger.info(f"Searching web for: {query}")
            results = self.ddgs.text(query, max_results=max_results)
            logger.info(f"Found {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def scrape(self, url: str):
        """
        Downloads and extracts text from a URL using Trafilatura.
        """
        try:
            logger.info(f"Scraping URL: {url}")
            downloaded = trafilatura.fetch_url(url)
            if downloaded:
                text = trafilatura.extract(downloaded)
                if text:
                    return text
            return ""
        except Exception as e:
            logger.error(f"Scraping failed for {url}: {e}")
            return ""

    def get_evidence(self, claim: str, max_context_length: int = 1000) -> str:
        """
        Orchestrates the search and scrape process to find evidence for a claim.
        Returns a single string of concatenated evidence.
        """
        logger.info(f"Gathering evidence for claim: {claim}")
        
        # 1. Search
        self.last_sources = []
        results = self.search(claim, max_results=3)
        if not results:
            return "No evidence found on the web."

        # 2. Scrape & Aggregate
        evidence_parts = []

        for res in results:
            url = res.get('href')
            snippet = res.get('body', '')
            
            if url:
                self.last_sources.append(url)
                
                # Try scraping first
                text = self.scrape(url)
                
                if text:
                    # Take the first 500 chars of scraped text
                    content = text[:500].replace('\n', ' ')
                    evidence_parts.append(f"[Source: {url}] {content}...")
                elif snippet:
                    # Fallback to DDG snippet
                    logger.warning(f"Scraping failed for {url}, using snippet.")
                    evidence_parts.append(f"[Source: {url}] (Snippet) {snippet}")        # 3. Combine
        full_evidence = "\n\n".join(evidence_parts)
        
        # 4. Truncate (Safety)
        if len(full_evidence) > max_context_length:
            full_evidence = full_evidence[:max_context_length] + "... (truncated)"
            
        return full_evidence

    def get_last_sources(self):
        """
        Returns the list of source URLs from the last evidence gathering operation.
        
        Returns:
            list: List of source URLs, or empty list if no sources available.
        """
        return self.last_sources if hasattr(self, 'last_sources') else []


if __name__ == "__main__":
    # Test
    engine = SearchEngine()
    print(engine.get_evidence("The moon is made of cheese"))
