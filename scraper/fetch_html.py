import asyncio
from crawl4ai import AsyncWebCrawler, BFSDeepCrawlStrategy, CrawlerRunConfig
from collections import deque
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


def _extract_text_and_links(url: str):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; TurbochatBot/1.0; +https://turbochat.live)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    response = requests.get(url, timeout=15, headers=headers)
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "lxml")

    # Remove non-content tags.
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    text_chunks = []
    for element in soup.find_all(["h1", "h2", "h3", "p", "li"]):
        text = element.get_text(" ", strip=True)
        if text:
            text_chunks.append(text)

    links = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith("#"):
            continue
        links.append(urljoin(url, href))

    return "\n".join(text_chunks), links


def fallback_crawl(site_to_crawl: str, limit: int = 10) -> str:
    """Fallback crawler using requests+BeautifulSoup for environments where browser crawl fails."""
    max_pages = max(1, int(limit or 1))
    origin = urlparse(site_to_crawl)
    if not origin.scheme:
        site_to_crawl = f"https://{site_to_crawl}"
        origin = urlparse(site_to_crawl)

    queue = deque([site_to_crawl])
    visited = set()
    collected = []

    while queue and len(visited) < max_pages:
        current = queue.popleft()
        normalized = current.split("#")[0]
        if normalized in visited:
            continue

        try:
            text, links = _extract_text_and_links(normalized)
        except Exception:
            visited.add(normalized)
            continue

        visited.add(normalized)

        if text:
            collected.append(f"Source: {normalized}\n\n{text}")

        for link in links:
            parsed = urlparse(link)
            if parsed.netloc != origin.netloc:
                continue
            clean_link = link.split("#")[0]
            if clean_link not in visited and clean_link not in queue:
                queue.append(clean_link)

    return "\n\n---\n\n".join(collected)


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

    if all_text:
        return "\n\n---\n\n".join(all_text)

    # Crawl4AI can return empty markdown in some hosted runtimes.
    return fallback_crawl(site_to_crawl, limit=limit)

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
