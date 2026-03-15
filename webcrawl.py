import asyncio
from crawl4ai import AsyncWebCrawler, BFSDeepCrawlStrategy, CrawlerRunConfig

async def main(url: str = "https://rakesh.codes", limit: int = 10):
    config = CrawlerRunConfig(
        deep_crawl_strategy=BFSDeepCrawlStrategy(
            max_depth=3,
            max_pages=max(1, limit),
            include_external=False,
        ),
        stream=False,
        verbose=False,
    )

    async with AsyncWebCrawler() as crawler:
        results = await crawler.arun(url=url, config=config)

    pages = results if isinstance(results, list) else [results]
    print(f"Crawled {len(pages)} page(s) from {url}")
    for page in pages:
        markdown = getattr(page, "markdown", "")
        if not markdown:
            continue
        page_url = getattr(page, "url", "Unknown URL")
        print(f"\nSource: {page_url}\n")
        print(markdown)

# Run the async main function
asyncio.run(main())
