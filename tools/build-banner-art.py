"""Make the lamp artwork for the Prajavani home page banner (deepawali-banner.pv.html): the row of
lit clay diyas from the night-sky card background (ChatGPT artwork), 450 x 309 (3x the 150 x 103 slot).

    python tools/build-banner-art.py

Writes site/assets/deepavali/banner-diyas.webp and prints where the flames are (in slot pixels), for
the pulsing glows in the banner.
"""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parent.parent
BOX = (1440, 2104, 1880, 2406)  # in the 2160 x 2700 master
OUT = (450, 309)

art = Image.open(root / '_artwork-masters/backgrounds/bg-night-sky.jpg').convert('RGB').crop(BOX).resize(OUT, Image.LANCZOS)
out = root / 'site/assets/deepavali/banner-diyas.webp'
art.save(out, quality=82, method=6)
print(f'{out.relative_to(root)}  {out.stat().st_size // 1024} KB')

# Flames: the brightest near-white blobs, found column by column.
px = art.load()
hot = [(x, y) for x in range(OUT[0]) for y in range(OUT[1]) if sum(px[x, y]) > 735]
blobs = []
for x, y in sorted(hot):
    for blob in blobs:
        if abs(blob[-1][0] - x) <= 6 and abs(sum(p[1] for p in blob) / len(blob) - y) < 30:
            blob.append((x, y)); break
    else:
        blobs.append([(x, y)])
scale = 150 / OUT[0]
for blob in sorted(blobs, key=len, reverse=True)[:4]:
    cx = sum(p[0] for p in blob) / len(blob) * scale
    cy = sum(p[1] for p in blob) / len(blob) * scale
    print(f'flame at {cx:.0f}, {cy:.0f}  ({len(blob)} px)')
