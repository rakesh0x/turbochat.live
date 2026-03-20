import asyncio
from crawl4ai import AsyncWebCrawler, BFSDeepCrawlStrategy, CrawlerRunConfig


async def main(site_to_crawl: str, limit: int = 10) -> str:
    """Crawl a site using Crawl4AI and return combined markdown content."""
    max_pages = max(1, int(limit or 1))
    config = CrawlerRunConfig(
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=3,
            max_pages=max_pages,
            include_external=False,
        ),
        stream=False,
        verbose=False,
    )

    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun(url=site_to_crawl, config=config)

    pages = results if isinstance(results, list) else [results]
    all_text = []

    for page in pages:
        content = getattr(page, "markdown", "")
        if not content:
            continue
        url = getattr(page, "url", "Unknown URL")
        all_text.append(f"Source: {url}\n\n{content}")

    return "\n\n---\n\n".join(all_text)

def get_data(site_to_crawl: str, limit: int = 10) -> str:
    """
    Crawls a website using Crawl4AI and returns combined markdown content.
    
    Args:
        site_to_crawl (str): The starting URL to crawl.
        limit (int): Maximum number of pages to crawl.
        
    Returns:
        str: Combined markdown content of crawled pages.
    """
    print(f"Starting Crawl4AI for: {site_to_crawl} (limit: {limit})")

    try:
        return asyncio.run(main(site_to_crawl, limit=limit))

    except Exception as e:
        print(f"Crawl4AI error: {e}")
        return ""

if __name__ == "__main__":
    # Test block
    test_url = "https://example.com"
    print("Testing Crawl4AI scraper...")
    data = get_data(test_url, limit=1)
    print("Result preview:")
    print(data[:500])
