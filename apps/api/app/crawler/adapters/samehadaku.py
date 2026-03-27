from __future__ import annotations

from dataclasses import dataclass

from app.crawler.http import fetch_html
from app.crawler.parsing import (
    extract_links,
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


def crawl_list(list_url: str, base_url: str) -> list[str]:
    html = fetch_html(list_url).text
    soup = soupify(html)
    urls: list[str] = []
    for href in extract_links(soup):
        u = normalize_url(base_url, href)
        if not u:
            continue
        if "/anime/" in u and u.startswith(base_url):
            urls.append(u)
    return sorted(set(urls))


def crawl_anime_detail(detail_url: str, base_url: str) -> AnimeDetail:
    html = fetch_html(detail_url).text
    soup = soupify(html)

    slug = path_slug(detail_url, "/anime/") or path_slug(detail_url, "anime/") or detail_url.rstrip("/").split("/")[-1]
    title = find_first_text(soup, ["h1", ".entry-title", ".post-title"]) or slug
    thumbnail = find_first_image(soup, [".thumb img", ".post-thumbnail img", "article img"])
    synopsis = find_first_text(soup, [".synopsis", ".sinopsis", ".entry-content p", ".content p"])
    score = guess_score(soup)
    status = find_first_text(soup, [".status", ".info .status"])

    genres: list[str] = []
    for a in soup.select("a[rel='tag']"):
        t = a.get_text(strip=True)
        if t:
            genres.append(t)
    genres_out = sorted(set(genres)) or None

    ep_urls: list[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        u = normalize_url(base_url, href)
        if not u:
            continue
        text = a.get_text(" ", strip=True)
        if u.startswith(base_url) and ("episode" in (u.lower() + " " + text.lower())):
            ep_urls.append(u)
    ep_urls = sorted(set(ep_urls))

    return AnimeDetail(
        slug=slug,
        url=detail_url,
        title=title,
        thumbnail_url=thumbnail,
        synopsis=synopsis,
        score=score,
        status=status,
        genres=genres_out,
        episode_urls=ep_urls,
    )


def crawl_episode_detail(episode_url: str, base_url: str) -> EpisodeDetail:
    html = fetch_html(episode_url).text
    soup = soupify(html)

    title = find_first_text(soup, ["h1", ".entry-title", ".post-title"])
    ep_no = parse_episode_number(title or "") or parse_episode_number(soup.get_text(" ", strip=True))

    links: list[dict] = []
    for iframe in soup.select("iframe[src]"):
        src = iframe.get("src")
        if src:
            links.append({"provider": "iframe", "quality": None, "url": src, "is_embed": True})
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        if href.startswith("http") and not href.startswith(base_url):
            text = a.get_text(" ", strip=True)[:120] or "external"
            links.append({"provider": text, "quality": None, "url": href, "is_embed": False})

    uniq: list[dict] = []
    seen: set[str] = set()
    for l in links:
        u = l.get("url")
        if not u or u in seen:
            continue
        seen.add(u)
        uniq.append(l)

    return EpisodeDetail(url=episode_url, episode_number=ep_no, title=title, video_links=uniq[:12] or None)

