import argparse
import json
import re
from urllib.parse import urljoin

import requests
from lxml import html

DEFAULT_BASE_URL = "http://45.11.57.129/"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": DEFAULT_BASE_URL,
}

BLOCK_SUBSTRINGS = (
    "az-list",
    "genres",
    "jadwal",
    "bookmark",
    "surprise",
    "telegram",
    "wp-admin",
    "login",
)

DETAIL_HINTS = ("/series/", "/movie/")
WEBLINK_HINTS = ("webdl", "bluray", "download", "episode")


def fetch_html(session: requests.Session, url: str) -> str:
    resp = session.get(url, timeout=30)
    resp.raise_for_status()
    return resp.text


def normalize_internal_url(base_url: str, href: str) -> str | None:
    if not href:
        return None
    u = urljoin(base_url, href.strip())
    if not u.startswith(base_url):
        return None
    return u


def extract_detail_urls(doc: html.HtmlElement, base_url: str) -> list[str]:
    hrefs = doc.xpath("//a[@href]/@href")
    out: list[str] = []
    seen: set[str] = set()
    for href in hrefs:
        u = normalize_internal_url(base_url, href)
        if not u:
            continue
        low = u.lower()
        if any(b in low for b in BLOCK_SUBSTRINGS):
            continue
        if not any(h in low for h in DETAIL_HINTS):
            continue
        if u in seen:
            continue
        seen.add(u)
        out.append(u)
    return out


def first_text(doc: html.HtmlElement, xpath_expr: str) -> str | None:
    vals = [v.strip() for v in doc.xpath(xpath_expr) if isinstance(v, str) and v.strip()]
    return vals[0] if vals else None


def extract_metadata(doc: html.HtmlElement) -> dict:
    title = first_text(doc, "//h1[contains(@class,'entry-title')]/text() | //h1/text()") or "-"
    synopsis = first_text(
        doc,
        "//div[contains(@class,'entry-content')]//p/text()"
        " | //div[contains(@class,'sinopsis')]//text()"
        " | //meta[@name='description']/@content",
    )
    thumbnail = first_text(
        doc,
        "//meta[@property='og:image']/@content"
        " | //img[contains(@class,'wp-post-image')]/@src"
        " | //article//img/@src",
    )
    page_text = " ".join(doc.xpath("//body//text()"))
    rating_match = re.search(r"(?:rating|imdb|score)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)", page_text, flags=re.I)
    rating = rating_match.group(1) if rating_match else None
    return {
        "title": title,
        "synopsis": synopsis,
        "rating": rating,
        "thumbnail": thumbnail,
    }


def extract_webdl_links(doc: html.HtmlElement, base_url: str) -> list[str]:
    links: list[str] = []
    seen: set[str] = set()
    hrefs = doc.xpath("//a[@href]/@href")
    for href in hrefs:
        u = normalize_internal_url(base_url, href)
        if not u:
            continue
        low = u.lower()
        if not any(h in low for h in WEBLINK_HINTS):
            continue
        if u in seen:
            continue
        seen.add(u)
        links.append(u)
    return links


def extract_video_urls(doc: html.HtmlElement, base_url: str) -> list[str]:
    candidates = doc.xpath(
        "//iframe[@src]/@src"
        " | //video/source[@src]/@src"
        " | //video[@src]/@src"
        " | //a[@href]/@href"
    )
    out: list[str] = []
    seen: set[str] = set()
    for raw in candidates:
        if not isinstance(raw, str):
            continue
        u = raw.strip()
        if not u:
            continue
        if u.startswith("//"):
            u = "https:" + u
        elif u.startswith("/"):
            u = urljoin(base_url, u)
        if not (u.startswith("http://") or u.startswith("https://")):
            continue
        low = u.lower()
        if low.endswith((".mp4", ".m3u8")) or "embed" in low or "stream" in low or "player" in low:
            if u not in seen:
                seen.add(u)
                out.append(u)
    return out


def crawl(max_titles: int, base_url: str, cookie: str | None = None) -> list[dict]:
    session = requests.Session()
    session.headers.update(HEADERS)
    if cookie:
        session.headers["Cookie"] = cookie

    list_url = urljoin(base_url, "series/list-mode/")
    list_html = fetch_html(session, list_url)
    list_doc = html.fromstring(list_html)

    detail_urls = extract_detail_urls(list_doc, base_url)[:max_titles]
    results: list[dict] = []

    for detail_url in detail_urls:
        try:
            detail_html = fetch_html(session, detail_url)
        except Exception as exc:
            print(f"[skip] detail error: {detail_url} -> {exc}")
            continue

        detail_doc = html.fromstring(detail_html)
        meta = extract_metadata(detail_doc)
        webdl_links = extract_webdl_links(detail_doc, base_url)
        video_urls: list[str] = []

        for webdl in webdl_links[:10]:
            try:
                webdl_html = fetch_html(session, webdl)
                webdl_doc = html.fromstring(webdl_html)
                video_urls.extend(extract_video_urls(webdl_doc, base_url))
            except Exception as exc:
                print(f"[skip] webdl error: {webdl} -> {exc}")

        # Deduplicate preserve order
        uniq_video = list(dict.fromkeys(video_urls))
        item = {
            "detail_url": detail_url,
            **meta,
            "webdl_links": webdl_links,
            "video_urls": uniq_video,
        }
        results.append(item)
        print(json.dumps(item, ensure_ascii=False))

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="OppaDrama crawler (XPath).")
    parser.add_argument("--max", type=int, default=10, help="Maximum detail titles to crawl.")
    parser.add_argument("--out", type=str, default="oppa_data.json", help="Output JSON file.")
    parser.add_argument("--base-url", type=str, default=DEFAULT_BASE_URL, help="Base URL source (recommended official domain).")
    parser.add_argument("--cookie", type=str, default=None, help="Optional raw Cookie header from browser session.")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/") + "/"
    data = crawl(max_titles=max(1, args.max), base_url=base_url, cookie=args.cookie)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"saved: {args.out} ({len(data)} items)")


if __name__ == "__main__":
    main()