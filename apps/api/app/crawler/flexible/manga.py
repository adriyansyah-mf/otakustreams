from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from app.crawler.http import fetch_html
from app.crawler.parsing import (
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


def load_config(config_json: str | None) -> dict[str, Any]:
    if not config_json:
        return {}
    try:
        obj = json.loads(config_json)
        return obj if isinstance(obj, dict) else {}
    except Exception:
        return {}


def _as_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(v) for v in value if v is not None]
    return [str(value)]


def _first_attr(el: Any, attr: str) -> str | None:
    try:
        if el and hasattr(el, "get"):
            v = el.get(attr)
            return v if v else None
    except Exception:
        pass
    return None


def crawl_manga_list(list_url: str, base_url: str, cfg: dict[str, Any]) -> list[str]:
    html = fetch_html(list_url).text
    soup = soupify(html)

    list_cfg = cfg.get("mangaList", {}) if isinstance(cfg.get("mangaList", {}), dict) else {}
    container_selector = list_cfg.get("containerSelector") or ""
    link_selector = list_cfg.get("linkSelector") or ""
    link_attr = list_cfg.get("linkAttr") or "href"
    url_contains = [str(x) for x in (list_cfg.get("urlContains") or []) if x is not None]

    if not link_selector:
        return []

    root = soup.select_one(container_selector) if container_selector else soup
    if not root:
        return []

    out: list[str] = []
    for a in root.select(link_selector):
        href = _first_attr(a, link_attr)
        if not href:
            continue
        u = normalize_url(base_url, href)
        if not u:
            continue
        if url_contains and not any(sub in u for sub in url_contains):
            continue
        out.append(u)
    return sorted(set(out))


def crawl_manga_detail(detail_url: str, base_url: str, cfg: dict[str, Any]) -> MangaDetail:
    html = fetch_html(detail_url).text
    soup = soupify(html)

    detail_cfg = cfg.get("mangaDetail", {}) if isinstance(cfg.get("mangaDetail", {}), dict) else {}

    slug = (
        path_slug(detail_url, "/manga/")
        or path_slug(detail_url, "/komik/")
        or detail_url.rstrip("/").split("/")[-1]
    )

    title_selectors = _as_list(detail_cfg.get("titleSelectors"))
    title = find_first_text(soup, title_selectors) or slug

    thumb_selectors = _as_list(detail_cfg.get("thumbnailSelectors"))
    thumbnail = find_first_image(soup, thumb_selectors) if thumb_selectors else None

    synopsis_selectors = _as_list(detail_cfg.get("synopsisSelectors"))
    synopsis = find_first_text(soup, synopsis_selectors) if synopsis_selectors else None

    status_selectors = _as_list(detail_cfg.get("statusSelectors"))
    status = find_first_text(soup, status_selectors) if status_selectors else None

    genres_out: list[str] | None = None
    genres_cfg = detail_cfg.get("genres", {}) if isinstance(detail_cfg.get("genres", {}), dict) else {}
    genres_item_selector = genres_cfg.get("itemSelector") or ""
    if genres_item_selector:
        genres_out = sorted({a.get_text(strip=True) for a in soup.select(genres_item_selector) if a.get_text(strip=True)}) or None

    # Chapter list
    ch_cfg = detail_cfg.get("chapterListOnDetailPage", {}) if isinstance(detail_cfg.get("chapterListOnDetailPage", {}), dict) else {}
    root_selector = ch_cfg.get("chaptersRootSelector") or ""
    link_selector = ch_cfg.get("chapterLinkSelector") or "a[href]"
    link_attr = ch_cfg.get("chapterUrlAttr") or "href"
    url_contains = [str(x) for x in (ch_cfg.get("urlContains") or []) if x is not None]

    root = soup.select_one(root_selector) if root_selector else soup
    chapter_urls: list[str] = []
    if root:
        for a in root.select(link_selector):
            href = _first_attr(a, link_attr)
            if not href:
                continue
            u = normalize_url(base_url, href)
            if not u:
                continue
            if url_contains and not any(sub in u for sub in url_contains):
                continue
            chapter_urls.append(u)

    chapter_urls = sorted(set(chapter_urls))

    return MangaDetail(
        slug=slug,
        url=detail_url,
        title=title,
        thumbnail_url=thumbnail,
        synopsis=synopsis,
        status=status,
        genres=genres_out,
        chapter_urls=chapter_urls,
    )


def crawl_chapter_detail(chapter_url: str, base_url: str, cfg: dict[str, Any]) -> ChapterDetail:
    html = fetch_html(chapter_url).text
    soup = soupify(html)

    ch_cfg = cfg.get("chapterDetail", {}) if isinstance(cfg.get("chapterDetail", {}), dict) else {}

    title_selectors = _as_list(ch_cfg.get("titleSelectors"))
    title = find_first_text(soup, title_selectors) if title_selectors else None
    if not title:
        title = find_first_text(soup, ["h1", ".entry-title"])

    ch_no = parse_chapter_number(title or "") or parse_chapter_number(soup.get_text(" ", strip=True))

    img_selector = ch_cfg.get("pageImagesSelector") or "img"
    attr_priority = [str(x) for x in (ch_cfg.get("pageImageAttrPriority") or ["data-src", "data-lazy-src", "src"]) if x is not None]

    imgs: list[str] = []
    for img in soup.select(img_selector):
        src = None
        for attr in attr_priority:
            src = _first_attr(img, attr)
            if src:
                break
        if not src or src.startswith("data:"):
            continue
        imgs.append(normalize_url(base_url, src) or src)

    uniq: list[str] = []
    seen: set[str] = set()
    for u in imgs:
        if u in seen:
            continue
        seen.add(u)
        uniq.append(u)

    return ChapterDetail(url=chapter_url, chapter_number=ch_no, title=title, page_images=uniq or None)

