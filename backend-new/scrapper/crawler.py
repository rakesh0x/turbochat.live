from collections import deque
from multiprocessing import Value

from requests.compat import urljoin, urlparse

import os
from firecrawl import FirecrawlApp
from bs4 import BeautifulSoup

firecrawler = FirecrawlApp(
    api_keys=os.environ.get("FIRECRAWL_API_KEY")
)

def extract_text_and_links(url: str) -> tuple[str, list[str]]:
    response = firecrawler.scrape_url(url)
    # Firecrawl returns a Document/Dict, not raw HTML string
    html = getattr(response, "html", None) or getattr(response, "content", None) or response
    if isinstance(html, dict):
        html = html.get("html", "") or html.get("content", "") or str(html)
    soup = BeautifulSoup(str(html), 'html.parser')

    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    text_chunks = []
    for elements in soup(["h1", "h2", "h3", "p", "li"]):
        text = elements.get_text(" ", strip=True)
        if text:
            text_chunks.append(text)

    links: list[str] = []
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        if not href or href.startswith("#"):
            continue
        links.append(urljoin(url, href))

    return "\n".join(text_chunks), links

async def fallback_crawl(site_to_crawl: str, limit: int = 10) -> str:
    """Fallback crawler using requests+BeautifulSoup for environments where browser crawl fails."""
    max_pages = max(1, int(limit or 1))
    origin = urlparse(site_to_crawl)
    if not origin.scheme:
        site_to_crawl = f"https://{site_to_crawl}"
        origin = urlparse(site_to_crawl)

    queue = deque([site_to_crawl])
    visited = set()
    collected = []
    errors = []

    while queue and len(visited) < max_pages:
        current = queue.popleft()
        normalized = current.split("#")[0]
        if normalized in visited:
            continue

        try:
            text, links = extract_text_and_links(normalized)
        except Exception as e:
            errors.append(f"{normalized} -> {e}")
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

    if collected:
        return "\n\n---\n\n".join(collected)

    if errors:
        preview = " | ".join(errors[:5])
        raise RuntimeError(f"Fallback crawler could not extract content. Errors: {preview}")

    raise RuntimeError("Fallback crawler found no content and no crawlable links.")

async def main(site_to_crawl: str, limit: int = 10) -> str:
    "Crawl sites using firecrawl and fallback as local web scrapper"

    # firecrawl = 1st priority
    max_pages = max(1, int(limit or 1))
    try:
        scrape_result = firecrawler.scrape(
            site_to_crawl,
            limit=limit,
            scrape_website={
                "formats": ['markdown', 'html']
            }
        )
        # scrape_result is a list of Documents or dict — normalize to text
        if scrape_result:
            docs = scrape_result if isinstance(scrape_result, list) else [scrape_result]
            parts: list[str] = []
            for doc in docs:
                if isinstance(doc, dict):
                    md = doc.get("markdown") or doc.get("content") or ""
                else:
                    md = getattr(doc, "markdown", None) or getattr(doc, "content", None) or ""
                if md:
                    parts.append(str(md))
            if parts:
                return "\n\n---\n\n".join(parts)
    except Exception as e:
        print(f"Firecrawl failed, falling back to local crawler: {e}")

    # local fallback — always returns str or raises, never None
    return await fallback_crawl(site_to_crawl, max_pages)