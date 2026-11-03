"""Make the link-preview (Open Graph) images, 1200 x 630, from the page's own artwork.

    site/assets/og-deepavali.jpg      Kannada (the default page)
    site/assets/og-deepavali-en.jpg   English

Each image is the hero's lane scene (copied from index.en.html) under the event title, rendered by
headless Chrome so Kannada is shaped correctly with Prajavani's text font. Run after changing the
hero scene or the title:

    python tools/build-og.py

Needs Google Chrome (or Edge) and Pillow. The fonts load from the internet.
"""
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
html = (root / 'index.en.html').read_text(encoding='utf-8')
scene = re.search(r'<svg class="scene".*?</svg>', html, re.S).group(0)
assets = (root / 'site/assets').as_uri()

EDITIONS = {
    'og-deepavali.jpg': {
        'lang': 'kn', 'kicker': 'ಪ್ರಜಾವಾಣಿ ಅರ್ಪಿಸುವ', 'title': 'ದೀಪಾವಳಿ ದೀಪಮಾಲೆ <b>2026</b>',
        'lines': ['ನೀವು ಯಾವ ಪಟಾಕಿ?', 'ನಿಮ್ಮದೇ ಶುಭಾಶಯ ಪತ್ರ', 'ಹಬ್ಬದ ಬರಹಗಳು'],
    },
    'og-deepavali-en.jpg': {
        'lang': 'en', 'kicker': 'Prajavani presents', 'title': 'Deepavali Deepamale <b>2026</b>',
        'lines': ['Which cracker are you?', 'Your own greeting card', 'Festive stories'],
    },
}

TEMPLATE = """<!doctype html><html lang="{lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Playfair+Display:wght@600&display=block">
<style>
@font-face{{font-family:'Prajavani Text';font-weight:100 500;font-display:block;src:url(https://fea.assettype.com/tpml/assets/PrajavaniTextRegular.woff2) format("woff2")}}
@font-face{{font-family:'Prajavani Text';font-weight:600 900;font-display:block;src:url(https://fea.assettype.com/tpml/assets/PrajavaniTextSemibold.woff2) format("woff2")}}
html,body{{margin:0;width:1200px;height:630px;overflow:hidden}}
body{{position:relative;background:radial-gradient(ellipse at 70% 0%,#3a2560 0%,#1b1436 45%,#120f24 80%);color:#fff;
  font-family:"DM Sans","Prajavani Text",sans-serif}}
.sky{{position:absolute;inset:0}}
.scene{{position:absolute;left:0;bottom:0;width:1200px;height:320px}}
.text{{position:absolute;left:72px;top:58px;right:72px}}
.logo{{height:44px;display:block;margin-bottom:34px}}
.kicker{{margin:0 0 10px;font-size:24px;font-weight:500;color:#f2c46d;letter-spacing:{track}}}
h1{{margin:0;font:600 76px/1.1 "Playfair Display","Prajavani Text",serif;color:#fff}}
h1 b{{color:#ffd27a;font-weight:600}}
.lines{{display:flex;gap:14px;margin-top:26px;flex-wrap:wrap}}
.lines span{{padding:9px 20px;border:1.5px solid #f2c46d88;border-radius:999px;font-size:23px;font-weight:600;background:#120f2499}}
</style></head><body>
<svg class="sky" viewBox="0 0 1200 630" aria-hidden="true">
  <defs><radialGradient id="b"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
  {stars}
  {bursts}
</svg>
{scene}
<div class="text">
  <img class="logo" src="{assets}/prajavani-white.svg" alt="">
  <p class="kicker">{kicker}</p>
  <h1>{title}</h1>
  <div class="lines">{lines}</div>
</div>
</body></html>"""


def stars():
    import random
    rnd = random.Random(8)
    return ''.join(f'<circle cx="{rnd.uniform(0, 1200):.0f}" cy="{rnd.uniform(0, 330):.0f}" r="{rnd.uniform(.6, 1.8):.1f}" '
                   f'fill="#fff" opacity="{rnd.uniform(.3, .9):.2f}"/>' for _ in range(90))


def burst(x, y, radius, colour):
    rays = []
    for i in range(18):
        import math
        a = i / 18 * math.tau
        r1, r2 = radius * .25, radius
        rays.append(f'M{x + r1 * math.cos(a):.1f} {y + r1 * math.sin(a):.1f}L{x + r2 * math.cos(a):.1f} {y + r2 * math.sin(a):.1f}')
    return (f'<circle cx="{x}" cy="{y}" r="{radius * 1.3:.0f}" fill="url(#b)"/>'
            f'<path d="{"".join(rays)}" stroke="{colour}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/>'
            f'<circle cx="{x}" cy="{y}" r="4" fill="#fff"/>')


bursts = burst(1030, 120, 90, '#ffd27a') + burst(950, 330, 52, '#ff7ab8') + burst(1130, 280, 46, '#b6ffbf')

browser = next((path for path in (
    shutil.which('chrome'), shutil.which('google-chrome'),
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe') if path and Path(path).exists()), None)
if not browser:
    sys.exit('Chrome or Edge not found')

with tempfile.TemporaryDirectory() as work:
    work = Path(work)
    for name, edition in EDITIONS.items():
        page = TEMPLATE.format(
            lang=edition['lang'], kicker=edition['kicker'], title=edition['title'], assets=assets, scene=scene,
            stars=stars(), bursts=bursts, track='0' if edition['lang'] == 'kn' else '.14em',
            lines=''.join(f'<span>{line}</span>' for line in edition['lines']))
        source = work / f'{name}.html'
        source.write_text(page, encoding='utf-8')
        shot = work / f'{name}.png'
        subprocess.run([browser, '--headless=new', '--disable-gpu', '--hide-scrollbars', f'--user-data-dir={work / "profile"}',
                        '--window-size=1200,630', '--virtual-time-budget=8000', '--force-device-scale-factor=1',
                        f'--screenshot={shot}', source.as_uri()], check=True, capture_output=True, timeout=120)
        Image.open(shot).convert('RGB').save(root / 'site/assets' / name, quality=86, optimize=True, progressive=True)
        print(f'site/assets/{name} written')
