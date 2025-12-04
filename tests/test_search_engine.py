import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.search_engine import SearchEngine


class TestSearchEngine(unittest.TestCase):
    """Unit tests for SearchEngine class with mocked external dependencies."""
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.engine = SearchEngine()
    
    @patch('src.search_engine.DDGS')
    def test_search_success(self, mock_ddgs_class):
        """Test successful search returns results."""
        # Mock DDGS instance and its text method
        mock_ddgs_instance = Mock()
        mock_ddgs_class.return_value = mock_ddgs_instance
        
        mock_results = [
            {'href': 'https://example.com/1', 'body': 'Result 1'},
            {'href': 'https://example.com/2', 'body': 'Result 2'},
        ]
        mock_ddgs_instance.text.return_value = mock_results
        
        # Create new engine instance with mocked DDGS
        engine = SearchEngine()
        results = engine.search("test query", max_results=2)
        
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0]['href'], 'https://example.com/1')
        mock_ddgs_instance.text.assert_called_once_with("test query", max_results=2)
    
    @patch('src.search_engine.DDGS')
    def test_search_failure(self, mock_ddgs_class):
        """Test search handles exceptions gracefully."""
        mock_ddgs_instance = Mock()
        mock_ddgs_class.return_value = mock_ddgs_instance
        mock_ddgs_instance.text.side_effect = Exception("Network error")
        
        engine = SearchEngine()
        results = engine.search("test query")
        
        self.assertEqual(results, [])
    
    @patch('src.search_engine.trafilatura')
    def test_scrape_success(self, mock_trafilatura):
        """Test successful URL scraping."""
        mock_trafilatura.fetch_url.return_value = "<html>content</html>"
        mock_trafilatura.extract.return_value = "Extracted text content"
        
        result = self.engine.scrape("https://example.com")
        
        self.assertEqual(result, "Extracted text content")
        mock_trafilatura.fetch_url.assert_called_once_with("https://example.com")
        mock_trafilatura.extract.assert_called_once_with("<html>content</html>")
    
    @patch('src.search_engine.trafilatura')
    def test_scrape_no_content(self, mock_trafilatura):
        """Test scraping when no content is fetched."""
        mock_trafilatura.fetch_url.return_value = None
        
        result = self.engine.scrape("https://example.com")
        
        self.assertEqual(result, "")
    
    @patch('src.search_engine.trafilatura')
    def test_scrape_extraction_fails(self, mock_trafilatura):
        """Test scraping when extraction returns None."""
        mock_trafilatura.fetch_url.return_value = "<html>content</html>"
        mock_trafilatura.extract.return_value = None
        
        result = self.engine.scrape("https://example.com")
        
        self.assertEqual(result, "")
    
    @patch('src.search_engine.trafilatura')
    def test_scrape_exception(self, mock_trafilatura):
        """Test scraping handles exceptions gracefully."""
        mock_trafilatura.fetch_url.side_effect = Exception("Connection timeout")
        
        result = self.engine.scrape("https://example.com")
        
        self.assertEqual(result, "")
    
    @patch.object(SearchEngine, 'scrape')
    @patch.object(SearchEngine, 'search')
    def test_get_evidence_with_scraped_content(self, mock_search, mock_scrape):
        """Test get_evidence with successful scraping."""
        mock_search.return_value = [
            {'href': 'https://example.com/1', 'body': 'Snippet 1'},
            {'href': 'https://example.com/2', 'body': 'Snippet 2'},
        ]
        mock_scrape.side_effect = [
            "This is scraped content from the first URL. " * 20,  # Long content
            "This is scraped content from the second URL. " * 20,
        ]
        
        evidence = self.engine.get_evidence("test claim")
        
        self.assertIn("[Source: https://example.com/1]", evidence)
        self.assertIn("[Source: https://example.com/2]", evidence)
        self.assertIn("This is scraped content from the first URL", evidence)
        self.assertEqual(len(self.engine.last_sources), 2)
    
    @patch.object(SearchEngine, 'scrape')
    @patch.object(SearchEngine, 'search')
    def test_get_evidence_fallback_to_snippet(self, mock_search, mock_scrape):
        """Test get_evidence falls back to snippet when scraping fails."""
        mock_search.return_value = [
            {'href': 'https://example.com/1', 'body': 'This is a snippet'},
        ]
        mock_scrape.return_value = ""  # Scraping fails
        
        evidence = self.engine.get_evidence("test claim")
        
        self.assertIn("(Snippet) This is a snippet", evidence)
        self.assertIn("[Source: https://example.com/1]", evidence)
    
    @patch.object(SearchEngine, 'search')
    def test_get_evidence_no_results(self, mock_search):
        """Test get_evidence when search returns no results."""
        mock_search.return_value = []
        
        evidence = self.engine.get_evidence("test claim")
        
        self.assertEqual(evidence, "No evidence found on the web.")
    
    @patch.object(SearchEngine, 'scrape')
    @patch.object(SearchEngine, 'search')
    def test_get_evidence_truncation(self, mock_search, mock_scrape):
        """Test get_evidence truncates long content."""
        mock_search.return_value = [
            {'href': 'https://example.com/1', 'body': 'Snippet'},
        ]
        # Create very long content
        long_content = "A" * 2000
        mock_scrape.return_value = long_content
        
        evidence = self.engine.get_evidence("test claim", max_context_length=500)
        
        self.assertLessEqual(len(evidence), 520)  # 500 + "... (truncated)"
        self.assertIn("(truncated)", evidence)
    
    @patch.object(SearchEngine, 'scrape')
    @patch.object(SearchEngine, 'search')
    def test_get_evidence_tracks_sources(self, mock_search, mock_scrape):
        """Test that get_evidence properly tracks sources."""
        mock_search.return_value = [
            {'href': 'https://example.com/1', 'body': 'Snippet 1'},
            {'href': 'https://example.com/2', 'body': 'Snippet 2'},
            {'href': 'https://example.com/3', 'body': 'Snippet 3'},
        ]
        mock_scrape.return_value = "Content"
        
        self.engine.get_evidence("test claim")
        
        self.assertEqual(len(self.engine.last_sources), 3)
        self.assertEqual(self.engine.last_sources[0], 'https://example.com/1')
        self.assertEqual(self.engine.last_sources[1], 'https://example.com/2')
        self.assertEqual(self.engine.last_sources[2], 'https://example.com/3')


if __name__ == '__main__':
    unittest.main()
