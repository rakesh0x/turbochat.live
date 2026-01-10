import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SimpleCrawler/1.0)"
}

def clean_text(html):
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()

    text = soup.get_text(separator=" ")
    return " ".join(text.split())

def normalize_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")


def crawl_site(start_url, max_pages=20):
    visited = set()
    to_visit = [normalize_url(start_url)]
    data = []

    while to_visit and len(visited) < max_pages:
        url = to_visit.pop(0)

        if url in visited:
            continue

        try:
            print(f"Crawling: {url}")
            res = requests.get(url, headers=HEADERS, timeout=10)
            res.raise_for_status()
        except Exception as e:
            print("Failed:", e)
            continue

        visited.add(url)

        html = res.text
        text = clean_text(html)

        data.append({
            "url": url,
            "content": text
        })

        soup = BeautifulSoup(html, "html.parser")
        for a in soup.find_all("a", href=True):
            link = urljoin(url, a["href"])
            link = normalize_url(link)

            if link and link not in visited and link not in to_visit:
                to_visit.append(link)

    return data

def get_data(site_to_crawl):
    pages = crawl_site(site_to_crawl, max_pages=10)

    print(f"\nCrawled {len(pages)} pages\n")
    all_text = []
    for page in pages: 
        print("URL:", page["url"])
        print(page["content"][:50])
        print("" * 10000)
        all_text.append(page["content"])

        return "\n\n".join(all_text)

if __name__ == "__main__":
    pages = get_data()
