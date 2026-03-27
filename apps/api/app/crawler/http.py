from __future__ import annotations

from dataclasses import dataclass

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential


@dataclass(frozen=True)
class FetchResult:
    url: str
    status_code: int
    text: str


DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OtakuStreamBot/0.1; +https://localhost)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=0.8, min=0.8, max=6))
def fetch_html(url: str, timeout_s: float = 20) -> FetchResult:
    with httpx.Client(follow_redirects=True, headers=DEFAULT_HEADERS, timeout=timeout_s) as client:
        res = client.get(url)
        res.raise_for_status()
        return FetchResult(url=str(res.url), status_code=res.status_code, text=res.text)

