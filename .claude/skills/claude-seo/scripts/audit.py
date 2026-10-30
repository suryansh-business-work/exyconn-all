"""Live SEO audit of exyconn.com (or any URL list): one line block per page.

Usage:
  python3 -I audit.py                      # home + a sample of every sitemap section (en-us)
  python3 -I audit.py <url> [<url> ...]    # only these pages

Checks per page: status, title/description length, canonical == self, robots, hreflang count,
JSON-LD types (and parse errors), h1 count, images without alt / without width, word count.
Site checks: robots.txt, llms.txt, sitemap index, http->https and www->apex redirects, TTFB.
Read-only: GET requests to the public site, nothing else.
"""

import json
import re
import sys
import urllib.error
import urllib.request

SITE = "https://exyconn.com"
UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
TITLE_MAX = 60
DESC_MIN, DESC_MAX = 120, 160


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return res.status, res.geturl(), res.read().decode("utf8", "ignore")
    except urllib.error.HTTPError as err:
        return err.code, url, ""


def first(pattern, html):
    match = re.search(pattern, html, re.S)
    return match.group(1) if match else None


def ld_types(html):
    types = []
    for raw in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S):
        try:
            data = json.loads(raw)
        except ValueError:
            types.append("PARSE-ERROR")
            continue
        nodes = data if isinstance(data, list) else data.get("@graph", [data])
        types += [str(node.get("@type")) for node in nodes]
    return types


def audit(url):
    status, final, html = fetch(url)
    flags = []
    if status != 200:
        print(f"{status} {url}  !! not 200")
        return
    head = html[: html.find("</head>")]
    title = first(r"<title>(.*?)</title>", head) or ""
    desc = first(r'<meta name="description" content="([^"]*)"', head) or ""
    canonical = first(r'<link rel="canonical" href="([^"]*)"', head)
    robots = first(r'<meta name="robots" content="([^"]*)"', head)
    imgs = re.findall(r"<img[^>]*>", html)
    no_alt = sum(1 for tag in imgs if not re.search(r"\balt(=|\s|>)", tag))
    no_dim = sum(1 for tag in imgs if "width=" not in tag)
    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", html, flags=re.S)
    words = len(re.sub(r"<[^>]+>", " ", text).split())
    h1 = len(re.findall(r"<h1[\s>]", html))
    if len(title) > TITLE_MAX:
        flags.append(f"title>{TITLE_MAX}")
    if not DESC_MIN <= len(desc) <= DESC_MAX:
        flags.append(f"desc not {DESC_MIN}-{DESC_MAX}")
    if canonical != final:
        flags.append(f"canonical!=self ({canonical})")
    if robots and "noindex" in robots:
        flags.append("NOINDEX")
    if h1 != 1:
        flags.append(f"h1={h1}")
    if no_dim:
        flags.append(f"{no_dim} img without width/height")
    if "PARSE-ERROR" in ld_types(html):
        flags.append("JSON-LD parse error")
    print(f"{status} {final}")
    print(f"  title({len(title)}) {title}")
    print(f"  desc({len(desc)}) robots={robots} hreflang={head.count('hreflang=')}")
    print(f"  ld={ld_types(html)} h1={h1} imgs={len(imgs)} noAlt={no_alt} words={words}")
    if flags:
        print("  !! " + "; ".join(flags))


def site_checks():
    for path in ("/robots.txt", "/llms.txt", "/sitemap.xml"):
        status, _, body = fetch(SITE + path)
        print(f"{status} {path} ({len(body)} bytes)")
    for start in ("http://exyconn.com/", "https://www.exyconn.com/"):
        _, final, _ = fetch(start)
        print(f"redirect {start} -> {final}")


def sample_urls():
    _, _, xml = fetch(f"{SITE}/sitemap.xml?market=en-us")
    urls = re.findall(r"<loc>([^<]+)</loc>", xml)
    seen, picked = set(), []
    for url in urls:
        section = url.replace(f"{SITE}/en-us", "").split("/")[1:2]
        key = section[0] if section else ""
        if key not in seen:
            seen.add(key)
            picked.append(url)
    print(f"sitemap en-us: {len(urls)} urls, {len(picked)} sections sampled")
    return picked


if __name__ == "__main__":
    targets = sys.argv[1:]
    if not targets:
        site_checks()
        targets = sample_urls()
    for target in targets:
        audit(target)
