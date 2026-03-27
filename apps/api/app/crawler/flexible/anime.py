from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from bs4 import BeautifulSoup

from app.crawler.http import fetch_html
from app.crawler.parsing import (
    find_first_image,
    find_first_text,
    guess_score,
    normalize_url,
    parse_episode_number,
    path_slug,
    soupify,
)


@dataclass(frozen=True)
class AnimeDetail:
    slug: str
    url: str
    title: str
    thumbnail_url: str | None
    synopsis: str | None
    score: str | None
    status: str | None
    genres: list[str] | None
    episode_urls: list[str]


@dataclass(frozen=True)
class EpisodeDetail:
    url: str
    episode_number: float | None
    title: str | None
    video_links: list[dict] | None


def load_config(config_json: str | None) -> dict[str, Any]:
    if not config_json:
        return {}
    try:
        obj = json.loads(config_json)
        if isinstance(obj, dict):
            return obj
        return {}
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


def _first_image_from_elements(soup: BeautifulSoup, selectors: list[str], attr_priority: list[str]) -> str | None:
    for sel in selectors:
        el = soup.select_one(sel)
        if not el:
            continue
        for attr in attr_priority:
            v = _first_attr(el, attr)
            if v:
                return v
    return None


def crawl_anime_list(list_url: str, base_url: str, cfg: dict[str, Any]) -> list[str]:
    html = fetch_html(list_url).text
    soup = soupify(html)

    list_cfg = cfg.get("animeList", {}) if isinstance(cfg.get("animeList", {}), dict) else {}
    container_selector = list_cfg.get("containerSelector") or ""
    link_selector = list_cfg.get("linkSelector") or ""
    url_contains = list_cfg.get("urlContains") or []
    link_attr = list_cfg.get("linkAttr") or "href"
    url_includes_substrings = [str(x) for x in url_contains if x is not None]

    if not link_selector:
        return []

    if container_selector:
        root = soup.select_one(container_selector)
        if not root:
            return []
        els = root.select(link_selector)
    else:
        els = soup.select(link_selector)

    out: list[str] = []
    for el in els:
        href = _first_attr(el, link_attr)
        if not href:
            continue
        u = normalize_url(base_url, href)
        if not u:
            continue
        if url_includes_substrings:
            if not any(sub in u for sub in url_includes_substrings):
                continue
        out.append(u)

    return sorted(set(out))


def crawl_anime_detail(detail_url: str, base_url: str, cfg: dict[str, Any]) -> AnimeDetail:
    html = fetch_html(detail_url).text
    soup = soupify(html)

    detail_cfg = cfg.get("animeDetail", {}) if isinstance(cfg.get("animeDetail", {}), dict) else {}

    slug = path_slug(detail_url, "/anime/") or detail_url.rstrip("/").split("/")[-1]

    title_selectors = _as_list(detail_cfg.get("titleSelectors"))
    title = find_first_text(soup, title_selectors) or slug

    thumb_selectors = _as_list(detail_cfg.get("thumbnailSelectors"))
    thumbnail = _first_image_from_elements(soup, thumb_selectors, ["data-src", "src"])
    if not thumbnail:
        thumbnail = find_first_image(soup, thumb_selectors)

    synopsis_selectors = _as_list(detail_cfg.get("synopsisSelectors"))
    synopsis = find_first_text(soup, synopsis_selectors) if synopsis_selectors else None
    if not synopsis:
        synopsis = None

    status_selectors = _as_list(detail_cfg.get("statusSelectors"))
    status = find_first_text(soup, status_selectors) if status_selectors else None

    # Score: use regex on full text or fallback to guess_score.
    score_regex = detail_cfg.get("scoreRegex")
    score = None
    if isinstance(score_regex, str) and score_regex.strip():
        import re

        m = re.search(score_regex, soup.get_text(" ", strip=True), flags=re.IGNORECASE)
        if m:
            # capture first group if present, else whole match
            score = m.group(1) if m.groups() else m.group(0)
    if not score:
        score_selectors = _as_list(detail_cfg.get("scoreSelectors"))
        score = find_first_text(soup, score_selectors) if score_selectors else None
    if not score:
        score = guess_score(soup)

    # Genres
    genres_out: list[str] | None = None
    genres_cfg = detail_cfg.get("genres", {}) if isinstance(detail_cfg.get("genres", {}), dict) else {}
    genres_item_selector = genres_cfg.get("itemSelector") or ""
    if genres_item_selector:
        genres_out = sorted({a.get_text(strip=True) for a in soup.select(genres_item_selector) if a.get_text(strip=True)}) or None

    # Episodes on detail page
    ep_list_cfg = detail_cfg.get("episodeListOnDetailPage", {}) if isinstance(detail_cfg.get("episodeListOnDetailPage", {}), dict) else {}
    episode_list_selector = ep_list_cfg.get("episodeListSelector") or "div.episodelist"
    episode_list_index = int(ep_list_cfg.get("episodeListIndex") or 1)
    episode_link_selector = ep_list_cfg.get("episodeLinkSelector") or "li a[href]"
    url_contains = ep_list_cfg.get("urlContains") or []
    url_includes_substrings = [str(x) for x in url_contains if x is not None]

    episode_urls: list[str] = []
    episode_roots = soup.select(episode_list_selector)
    if episode_roots and len(episode_roots) > episode_list_index:
        root = episode_roots[episode_list_index]
        for a in root.select(episode_link_selector):
            href = _first_attr(a, ep_list_cfg.get("episodeUrlAttr") or "href")
            if not href:
                continue
            u = normalize_url(base_url, href)
            if not u:
                continue
            if url_includes_substrings and not any(sub in u for sub in url_includes_substrings):
                continue
            episode_urls.append(u)

    episode_urls = sorted(set(episode_urls))

    return AnimeDetail(
        slug=slug,
        url=detail_url,
        title=title,
        thumbnail_url=thumbnail,
        synopsis=synopsis,
        score=score,
        status=status,
        genres=genres_out,
        episode_urls=episode_urls,
    )


def crawl_episode_detail(episode_url: str, base_url: str, cfg: dict[str, Any]) -> EpisodeDetail:
    html = fetch_html(episode_url).text
    soup = soupify(html)

    ep_cfg = cfg.get("episodeDetail", {}) if isinstance(cfg.get("episodeDetail", {}), dict) else {}

    title_selectors = _as_list(ep_cfg.get("titleSelectors"))
    title = find_first_text(soup, title_selectors) if title_selectors else None
    if not title:
        title = find_first_text(soup, ["div.venser h1", "h1", ".entry-title", ".post-title"])

    ep_no = parse_episode_number(title or "") or parse_episode_number(soup.get_text(" ", strip=True))

    iframe_selector = ep_cfg.get("iframeSelector") or "iframe[src]"
    iframe_attr = ep_cfg.get("iframeAttr") or "src"

    links: list[dict] = []
    for iframe in soup.select(iframe_selector):
        src = _first_attr(iframe, iframe_attr)
        if not src:
            continue
        links.append({"provider": "iframe", "quality": None, "url": src, "is_embed": True})

    # Optional external fallback
    if not links and ep_cfg.get("externalFallback", True):
        external_selector = ep_cfg.get("externalLinkSelector") or "a[href]"
        for a in soup.select(external_selector):
            href = _first_attr(a, "href")
            if not href or not href.startswith("http"):
                continue
            links.append(
                {
                    "provider": "external",
                    "quality": None,
                    "url": href,
                    "is_embed": False,
                }
            )

    uniq: list[dict] = []
    seen: set[str] = set()
    for l in links:
        u = l.get("url")
        if not u or u in seen:
            continue
        seen.add(u)
        uniq.append(l)

    return EpisodeDetail(url=episode_url, episode_number=ep_no, title=title, video_links=uniq[:12] or None)


