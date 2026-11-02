"""Make the greeting card's web artwork from the full-size masters in _artwork-masters/.

    _artwork-masters/outfits/{kurta|panche|saree|langa}-{diya|sparkler}.png   2160 x 2220, transparent
    _artwork-masters/backgrounds/bg-{scene}.jpg                                2160 x 2700

writes site/assets/deepavali/:

    {outfit}-{pose}.webp        the outfit at card size (1080 x 1110, scene coordinates)
    {outfit}-{pose}-skin.png    where its skin is (white = skin), so the card can recolour it
    bg-{scene}.webp             the background at card size (1080 x 1350)
    bg-{scene}-thumb.webp       small picture for the scene picker

and prints each outfit's neck opening, for NECKS in site/greeting.js.

The outfit masters paint skin in two flat colours, #c68a5e with creases #a66946. Skin is every
pixel close to those colours that is connected to a sizeable patch of the exact colours, so gold or
orange fabric of a similar shade is not mistaken for skin.

    python tools/build-art.py
"""
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

root = Path(__file__).resolve().parent.parent
masters = root / '_artwork-masters'
out = root / 'site/assets/deepavali'
out.mkdir(parents=True, exist_ok=True)

SKIN = np.array([198, 138, 94])
CREASE = np.array([166, 105, 70])


def skin_mask(rgba):
    rgb = rgba[..., :3].astype(float)
    alpha = rgba[..., 3]
    # Distance from the line between the crease and skin colours (a little beyond both ends).
    axis = SKIN - CREASE
    t = np.clip(((rgb - CREASE) @ axis) / (axis @ axis), -0.35, 1.25)
    nearest = CREASE + t[..., None] * axis
    near = np.linalg.norm(rgb - nearest, axis=-1) < 30
    # Some arms are shaded rather than flat: also accept warm brown skin hues, but not the bright
    # saturated oranges and golds of the fabric.
    high, low = rgb.max(-1), rgb.min(-1)
    sat = (high - low) / np.maximum(high, 1)
    hue = np.degrees(np.arctan2(np.sqrt(3) * (rgb[..., 1] - rgb[..., 2]), 2 * rgb[..., 0] - rgb[..., 1] - rgb[..., 2])) % 360
    warm = (hue > 12) & (hue < 34) & (sat > 0.28) & (sat < 0.84) & (high > 70) & (high < 212)
    near = (near | warm) & (alpha > 8)
    # Drop thin strokes (outlines and seams in a skin-like colour): skin areas are at least ~12 px thick.
    near = ndimage.binary_closing(near, iterations=2)
    thick = ndimage.binary_dilation(ndimage.binary_opening(near, iterations=6), iterations=7) & near
    exact = (np.abs(rgb - SKIN).max(-1) < 12) | (np.abs(rgb - CREASE).max(-1) < 6)  # some arms are painted a shade off
    labels, count = ndimage.label(thick)
    seeds = np.bincount(labels[exact & thick], minlength=count + 1)
    keep = seeds >= 25  # a bangle can cut a forearm off from the hand; it still has a few flat-colour pixels
    keep[0] = False
    return keep[labels]


def neck_opening(alpha):
    """Neck hole in scene coordinates: where the collar starts, its width there, where it closes."""
    solid = alpha > 128
    top = width = centre = None
    for y in range(1450, 2000, 2):
        row = solid[y]
        if row[1080]:
            return {'top': top // 2, 'width': width // 2, 'x': centre // 2, 'bottom': y // 2}
        left = 1080 - np.argmax(row[1080::-1])
        right = 1080 + np.argmax(row[1080:])
        if top is None and row[:1080].any() and row[1080:].any() and right - left < 600:
            top, width, centre = y, right - left, (left + right) // 2
    raise ValueError('collar never closes')


necks = {}
for path in sorted((masters / 'outfits').glob('*.png')):
    master = Image.open(path).convert('RGBA')
    assert master.size == (2160, 2220), f'{path.name} is {master.size}, expected 2160 x 2220'
    rgba = np.array(master)
    mask = Image.fromarray((skin_mask(rgba) * 255).astype(np.uint8))
    necks[path.stem] = {k: int(v) for k, v in neck_opening(rgba[..., 3]).items()}
    master.resize((1080, 1110), Image.LANCZOS).save(out / f'{path.stem}.webp', quality=90, method=6)
    mask.resize((1080, 1110), Image.BOX).save(out / f'{path.stem}-skin.png', optimize=True)
    print(f'{path.stem}: {necks[path.stem]}')

for path in sorted((masters / 'backgrounds').glob('bg-*.jpg')):
    image = Image.open(path).convert('RGB')
    image.resize((1080, 1350), Image.LANCZOS).save(out / f'{path.stem}.webp', quality=82, method=6)
    image.resize((144, 180), Image.LANCZOS).save(out / f'{path.stem}-thumb.webp', quality=80, method=6)
    print(f'{path.stem}: done')

print('\nNECKS for site/greeting.js:')
print('{ ' + ', '.join(f"'{k}': {{ x: {v['x']}, top: {v['top']}, width: {v['width']}, bottom: {v['bottom']} }}" for k, v in necks.items()) + ' }')
