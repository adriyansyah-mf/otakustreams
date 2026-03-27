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
    # Match user's proven scraper:
    # - list container: div#abtext
    # - links: a.hodebgst[href]
    urls: list[str] = []
    abtext = soup.select_one("div#abtext")
    if abtext:
        for a in abtext.select("a.hodebgst[href]"):
            u = normalize_url(base_url, a.get("href"))
            if u and "/anime/" in u:
                urls.append(u)
        return sorted(set(urls))

    # Fallback: best-effort link harvesting
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

    slug = path_slug(detail_url, "/anime/") or detail_url.rstrip("/").split("/")[-1]
    title = find_first_text(soup, ["h1", ".entry-title", ".jdlrx"]) or slug
    thumbnail = find_first_image(
        soup,
        [
            "img.attachment-post-thumbnail",
            ".fotoanime img",
            ".thumb img",
            "article img",
        ],
    )
    synopsis = find_first_text(soup, [".sinopc", ".sinopsis", ".entry-content p", ".content p"])
    score = guess_score(soup)
    status = find_first_text(soup, [".infozingle p", ".infozingle li"])

    genres: list[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href") or ""
        if "/genre/" in href:
            t = a.get_text(strip=True)
            if t:
                genres.append(t)
    genres_out = sorted(set(genres)) or None

    # Match user's proven scraper:
    # episode list usually is the 2nd .episodelist block.
    ep_urls: list[str] = []
    episode_lists = soup.select("div.episodelist")
    if len(episode_lists) > 1:
        for a in episode_lists[1].select("li a[href]"):
            u = normalize_url(base_url, a.get("href"))
            if u:
                ep_urls.append(u)
    else:
        # fallback: generic heuristic
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
    # Match user's proven scraper:
    # - title: div.venser h1
    # - video: first iframe src (soup.find('iframe'))
    title = None
    venser = soup.select_one("div.venser")
    if venser:
        h1 = venser.select_one("h1")
        if h1:
            title = h1.get_text(" ", strip=True)
    if not title:
        title = find_first_text(soup, ["h1", ".entry-title"])

    ep_no = parse_episode_number(title or "") or parse_episode_number(soup.get_text(" ", strip=True))

    links: list[dict] = []

    # Prefer iframe(s) regardless of wrapper div.
    iframes = soup.select("iframe[src]")
    if iframes:
        for iframe in iframes[:4]:
            src = iframe.get("src")
            if src:
                links.append(
                    {"provider": "iframe", "quality": None, "url": src, "is_embed": True}
                )

    # If there are no iframes found, fallback to anchor links.
    if not links:
        for a in soup.select("a[href]"):
            href = a.get("href")
            if not href:
                continue
            if href.startswith("http"):
                text = a.get_text(" ", strip=True)[:120] or "external"
                links.append(
                    {"provider": text, "quality": None, "url": href, "is_embed": False}
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

