from __future__ import annotations

import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup


def soupify(html: str) -> BeautifulSoup:
    return BeautifulSoup(html, "lxml")


def normalize_url(base_url: str, href: str | None) -> str | None:
    if not href:
        return None
    return urljoin(base_url, href)


def path_slug(url: str, prefix: str) -> str | None:
    p = urlparse(url).path.strip("/")
    if not p.startswith(prefix.strip("/")):
        return None
    rest = p[len(prefix.strip("/")) :].strip("/")
    if not rest:
        return None
    return rest.split("/")[0]


_episode_num_re = re.compile(r"episode\s*([0-9]+(?:\.[0-9]+)?)", re.IGNORECASE)
_chapter_num_re = re.compile(r"chapter\s*([0-9]+(?:\.[0-9]+)?)", re.IGNORECASE)


def parse_episode_number(text: str) -> float | None:
    m = _episode_num_re.search(text)
    if not m:
        return None
    return float(m.group(1))


def parse_chapter_number(text: str) -> float | None:
    m = _chapter_num_re.search(text)
    if not m:
        return None
    return float(m.group(1))


def extract_links(soup: BeautifulSoup) -> list[str]:
    out: list[str] = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if href:
            out.append(href)
    return out


def find_first_text(soup: BeautifulSoup, selectors: list[str]) -> str | None:
    for sel in selectors:
        el = soup.select_one(sel)
        if el:
            t = el.get_text(" ", strip=True)
            if t:
                return t
    return None


def find_first_image(soup: BeautifulSoup, selectors: list[str]) -> str | None:
    for sel in selectors:
        el = soup.select_one(sel)
        if not el:
            continue
        src = el.get("data-src") or el.get("src")
        if src:
            return src
    return None


def guess_score(soup: BeautifulSoup) -> str | None:
    text = soup.get_text(" ", strip=True)
    m = re.search(r"\bskor\b\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)", text, flags=re.IGNORECASE)
    if m:
        return m.group(1)
    return None





