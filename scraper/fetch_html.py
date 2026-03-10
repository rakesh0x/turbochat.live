import os
from firecrawl import FirecrawlApp
from dotenv import load_dotenv

load_dotenv()

def get_data(site_to_crawl: str, limit: int = 10) -> str:
    """
    Crawls a website using Firecrawl and returns combined markdown content.
    
    Args:
        site_to_crawl (str): The starting URL to crawl.
        limit (int): Maximum number of pages to crawl.
        
    Returns:
        str: Combined markdown content of all crawled pages.
    """
    api_key = os.getenv("FIRECRAWL_API_KEY")
    if not api_key:
        print("Warning: FIRECRAWL_API_KEY not found in environment variables.")
        return "Error: FIRECRAWL_API_KEY is missing. Please add it to your .env file."

    app = FirecrawlApp(api_key=api_key)

    print(f"Starting Firecrawl for: {site_to_crawl} (limit: {limit})")
    
    try:
        # Firecrawl's crawl method in v4 returns a CrawlJob object.
        # It handles multi-page crawling based on the limit and scrape options.
        crawl_result = app.crawl(
            site_to_crawl,
            limit=limit,
            scrape_options={
                "formats": ["markdown"]
            }
        )

        # Each item in 'crawl_result.data' is a Document object in SDK v4.
        pages = getattr(crawl_result, 'data', [])
        
        if not pages:
            print(f"Firecrawl returned no data in results for {site_to_crawl}.")
            return ""
        
        print(f"Crawled {len(pages)} pages using Firecrawl.")

        all_text = []
        for page in pages:
            # Document objects have 'markdown' and 'metadata' attributes
            url = "Unknown URL"
            if hasattr(page, 'metadata') and isinstance(page.metadata, dict) and 'sourceURL' in page.metadata:
                url = page.metadata['sourceURL']
            elif hasattr(page, 'url'):
                url = page.url
                
            content = getattr(page, 'markdown', '')
            if content:
                all_text.append(f"Source: {url}\n\n{content}")

        return "\n\n---\n\n".join(all_text)

    except Exception as e:
        print(f"Firecrawl error: {e}")
        return f"Error during crawling: {str(e)}"

if __name__ == "__main__":
    # Test block
    test_url = "https://example.com"
    print("Testing Firecrawl scraper...")
    data = get_data(test_url, limit=1)
    print("Result preview:")
    print(data[:500])
