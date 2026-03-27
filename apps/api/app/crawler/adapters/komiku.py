from __future__ import annotations

from dataclasses import dataclass

from app.crawler.http import fetch_html
from app.crawler.parsing import (
    extract_links,
    find_first_image,
    find_first_text,
    normalize_url,
    parse_chapter_number,
    path_slug,
    soupify,
)


@dataclass(frozen=True)
class MangaDetail:
    slug: str
    url: str
    title: str
    thumbnail_url: str | None
    synopsis: str | None
    status: str | None
    genres: list[str] | None
    chapter_urls: list[str]


@dataclass(frozen=True)
class ChapterDetail:
    url: str
    chapter_number: float | None
    title: str | None
    page_images: list[str] | None


def crawl_list(list_url: str, base_url: str) -> list[str]:
    html = fetch_html(list_url).text
    soup = soupify(html)
    urls: list[str] = []
    for href in extract_links(soup):
        u = normalize_url(base_url, href)
        if not u:
            continue
        # komiku manga detail usually contains /manga/ or /komik/
        if ("/manga/" in u or "/komik/" in u) and u.startswith(base_url):
            urls.append(u)
    return sorted(set(urls))


def crawl_manga_detail(detail_url: str, base_url: str) -> MangaDetail:
    html = fetch_html(detail_url).text
    soup = soupify(html)

    slug = (
        path_slug(detail_url, "/manga/")
        or path_slug(detail_url, "/komik/")
        or detail_url.rstrip("/").split("/")[-1]
    )
    title = find_first_text(soup, ["h1", ".komik_info h1", ".entry-title"]) or slug
    thumbnail = find_first_image(soup, [".komik_info img", ".thumb img", "article img"])
    synopsis = find_first_text(soup, [".komik_info .desc", ".sinopsis", ".entry-content p"])
    status = find_first_text(soup, [".komik_info .status", ".komik_info .type"])

    genres: list[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        if "/genre/" in href:
            t = a.get_text(strip=True)
            if t:
                genres.append(t)
    genres_out = sorted(set(genres)) or None

    ch_urls: list[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        u = normalize_url(base_url, href)
        if not u or not u.startswith(base_url):
            continue
        text = a.get_text(" ", strip=True)
        if "chapter" in (u.lower() + " " + text.lower()):
            ch_urls.append(u)
    ch_urls = sorted(set(ch_urls))

    return MangaDetail(
        slug=slug,
        url=detail_url,
        title=title,
        thumbnail_url=thumbnail,
        synopsis=synopsis,
        status=status,
        genres=genres_out,
        chapter_urls=ch_urls,
    )


def crawl_chapter_detail(chapter_url: str, base_url: str) -> ChapterDetail:
    html = fetch_html(chapter_url).text
    soup = soupify(html)

    title = find_first_text(soup, ["h1", ".entry-title"])
    ch_no = parse_chapter_number(title or "") or parse_chapter_number(soup.get_text(" ", strip=True))

    imgs: list[str] = []
    for img in soup.select("img"):
        src = img.get("data-src") or img.get("data-lazy-src") or img.get("src")
        if not src:
            continue
        if src.startswith("data:"):
            continue
        imgs.append(src)

    uniq: list[str] = []
    seen: set[str] = set()
    for u in imgs:
        u2 = normalize_url(base_url, u) or u
        if u2 in seen:
            continue
        seen.add(u2)
        uniq.append(u2)

    return ChapterDetail(url=chapter_url, chapter_number=ch_no, title=title, page_images=uniq or None)

