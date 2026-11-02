"""Build the pages to paste into the publishers' CMS from index.html.

    index.cms.html     Deccan Herald (English), pasted into the DH CMS (www.deccanherald.com)
    index.pv.cms.html  Prajavani (Kannada), pasted into the PV CMS (www.prajavani.net)

Both load the same CSS, JS, outfit artwork and JSON from Cloudflare Pages, so the relative site/ links
are rewritten to the Pages URL; logos, favicons and card artwork come from the CMS image CDN (CMS_ASSETS). The Prajavani page is translated from content/i18n/kn.json:
"page" replaces exact text of index.html, "site" (publisher, sponsor, language) and "strings"
(text shown by the scripts) are written into the page as window.DASARA_SITE / DASARA_STRINGS.
Run from anywhere after changing index.html or kn.json:

    python tools/build-cms-index.py [https://dasara-85a.pages.dev/]
"""
import json
import re
import sys
from pathlib import Path

PAGES_URL = (sys.argv[1] if len(sys.argv) > 1 else 'https://dasara-85a.pages.dev/').rstrip('/') + '/'
root = Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')

DH_DEFAULTS = {
    'gtmId': 'GTM-T46PRBZ',
    'publisherUrl': 'https://www.deccanherald.com/',
    'publisherLogo': 'site/assets/deccan-herald.svg',
    'sponsorUrl': 'https://digileads.bankofmaharashtra.bank.in/homeloan?DigitalAd&sec=DeccanHerald_GM&utm_source=DigitalAd&utm_medium=DeccanHerald&utm_campaign=DeccanHerald_GM',
    'sponsorLogo': 'site/assets/bank-of-maharashtra.svg',
}


# Logos, favicons and card artwork are hosted on the CMS image CDN (CORS enabled), not on Pages.
CMS_IMAGES = 'https://images.assettype.com/deccanherald/'
CMS_ASSETS = {
    'bank-of-maharashtra.svg': '2026-10-09/wczwbf1m/BOM.svg',
    'deccan-herald.svg': '2026-10-08/pxdtubqa/deccan-herald.svg',
    'prajavani-white.svg': '2026-10-08/uf85tvay/PV-White.svg',
    'favicon.svg': '2026-10-08/kug01qjj/favicon.svg',
    'favicon-pv.svg': '2026-10-08/by28kjz8/favicon-pv.svg',
    'union-bank-of-india.png': '2026-10-08/6m4wek2j/union-bank-of-india.png',
    'mysore-peta.svg': '2026-10-08/bzuoqz90/mysore-peta.svg',
    'mysuru-dasara-background.svg': '2026-10-08/tptooqcf/mysuru-dasara-background.svg',
}


def to_pages(page):
    page = page.replace('href="site/', f'href="{PAGES_URL}site/').replace('src="site/', f'src="{PAGES_URL}site/')
    for name, path in CMS_ASSETS.items():  # also covers the bare paths inside window.DASARA_SITE
        page = page.replace(f'{PAGES_URL}site/assets/{name}', CMS_IMAGES + path).replace(f'site/assets/{name}', CMS_IMAGES + path)
    return page


def replace(page, old, new, what):
    if old not in page:
        sys.exit(f'{what}: text not found in index.html (was it edited?):\n  {old[:120]}')
    return page.replace(old, new)


def translated(page, edition):
    site = edition['site']
    for item in edition['page']:
        page = replace(page, item['en'], item['kn'], 'kn.json page')
    # The player's first video is the first one in the edition's own video list (main.js plays it on load anyway).
    first = json.loads((root / site['videosFile']).read_text(encoding='utf-8'))['videos'][0]['youtubeId']
    page = replace(page, 'embed/wV3TQZfZDD4?rel=0', f'embed/{first}?rel=0', 'player video')
    # Links and logos of the edition's publisher and sponsor
    for key, old in DH_DEFAULTS.items():
        page = page.replace(old, site[key]).replace(old.replace('&', '&amp;'), site[key].replace('&', '&amp;'))  # also the HTML-escaped form
    classes = ' '.join(name for name, on in (('sponsor-on-light', site.get('sponsorOnLight')), ('publisher-wordmark', True)) if on)
    page = replace(page, '<html lang="en">', f'<html lang="{site["lang"]}" class="{classes}">', 'html tag')
    # Kannada text uses Prajavani's own text font (declared in site/style.css); warm up its CDN.
    page = replace(page, '  <link rel="preconnect" href="https://fonts.googleapis.com">', '  <link rel="preconnect" href="https://fea.assettype.com" crossorigin>\n  <link rel="preconnect" href="https://fonts.googleapis.com">', 'preconnect')
    # The DH favicon is swapped for the Prajavani one (the first letter of its logo).
    page = replace(page, 'site/assets/favicon.svg', 'site/assets/favicon-pv.svg', 'favicon')
    strings = {key: value['kn'] for key, value in edition['strings'].items()}
    settings = (f'  <!-- Edition settings, generated from content/i18n/{site["lang"]}.json. Edit that file and rebuild. -->\n'
                f'  <script>window.DASARA_SITE = {json.dumps(site, ensure_ascii=False)};\n'
                f'  window.DASARA_STRINGS = {json.dumps(strings, ensure_ascii=False)};</script>\n')
    page = replace(page, '  <!-- LIVE STREAM SWITCH', settings + '  <!-- LIVE STREAM SWITCH', 'live switch')
    # Nothing of the DH edition may be left on the page (scripts excluded: they hold the settings).
    visible = re.sub(r'<script\b.*?</script>', '', page, flags=re.S)
    leftovers = [word for word in ('Deccan Herald', 'DECCAN HERALD', 'deccanherald', 'Bank of Maharashtra', 'bankofmaharashtra', 'bank-of-maharashtra', 'deccan-herald.svg') if word in visible]
    if leftovers:
        sys.exit(f'DH edition text left in the translated page: {leftovers}')
    english = sorted({m.strip() for m in re.findall(r'>([^<>]*[A-Za-z]{4,}[^<>]*)<', re.sub(r'<(script|style|svg)\b.*?</\1>', '', visible, flags=re.S))
                      if not re.search('[ಀ-೿]', m)  # brand names inside Kannada text are fine
                      and not re.fullmatch(r'\s*(WhatsApp|Facebook|X|Open-Meteo)\s*', m)})
    if english:
        print('  English text still on the page (check kn.json):\n   ' + '\n   '.join(english))
    return page


(root / 'index.cms.html').write_text(to_pages(html), encoding='utf-8')
print(f'index.cms.html (Deccan Herald) written with assets from {PAGES_URL}')

kn = json.loads((root / 'content/i18n/kn.json').read_text(encoding='utf-8'))
(root / 'index.pv.cms.html').write_text(to_pages(translated(html, kn)), encoding='utf-8')
print(f'index.pv.cms.html (Prajavani, Kannada) written with assets from {PAGES_URL}')
