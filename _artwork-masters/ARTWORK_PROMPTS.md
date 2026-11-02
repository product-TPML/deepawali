# Deepavali greeting card: artwork prompts and delivery formats

The greeting card is a 1080 x 1350 (4:5) canvas. Each card is built from these layers, back to front:

1. **Background scene**: fills the whole card.
2. **Outfit**: a headless body with arms and hands, posed.
3. **Visitor's photo**: a cut-out head, placed by the code over the neckline.
4. **Head accessory**: the mallige for the saree, drawn in code.
5. **Title, frame and logo band**: added by the code. Never put text or logos in any artwork.

Generate the artwork in this order:
- Set A: the style reference.
- Set B: the outfits.
- Set C: the backgrounds.
- Set D: the props and overlay.

Use one ChatGPT conversation for everything, so the style stays consistent. Paste the **style block** at the start, and refer back to it in every later prompt.

---

## 0. Style block (paste once, at the start of the conversation)

```
You are illustrating a set of matching assets for a Deepavali greeting-card maker made for
Prajavani, a Kannada newspaper from Karnataka, India. Every image in this conversation must share
ONE consistent style:

- Flat vector illustration, editorial and premium, like a modern Indian festival poster.
- Clean shapes, soft two-tone shading (one highlight and one shadow per colour), no photorealism,
  no 3D render look, no heavy outlines (thin darker-shade edges only), no grain or texture noise.
- Gold zari details drawn as thin gold lines and small motifs (lotus, mango/paisley, dots).
- Palette: deep night indigo #120f24 and #2b1d48, plum #5a2a45, warm gold #e2b55a and #f2c46d,
  flame orange #ff9f2e, marigold saffron #e58a2a, magenta #b02a62, emerald #22735f, cream #f4e7c8.
- Warm lamp light is the main light source: glows are soft radial gradients in orange and gold.
- Culturally specific to Karnataka (Mysuru/Bengaluru), not generic North Indian Diwali.
- No text, letters, numbers, logos or watermarks anywhere in any image.
Confirm you understand. Do not draw anything yet.
```

---

## Set A: style reference (1 image)

```
Using the style block, draw a single lit clay diya on a dark indigo background, centred, about
40% of the frame wide: terracotta bowl with a thin gold rim and a row of five small gold dots, a
cotton wick, and a teardrop flame (white core, yellow, orange tip) with a soft gold glow.
Square, 1024 x 1024.
```

If you like the result, reply "Use exactly this style for everything that follows." If not, iterate here before going further: this image anchors the rest of the set.

---

## Set B: outfits (the most important set)

### What the code needs from every outfit image

- **Canvas:** 2160 x 2220 px, a **transparent PNG**. This is 2x the scene size of 1080 x 1110.
- **Placement:** the figure sits in the **bottom third**. Everything above it is transparent, except the raised arm in "sparkler" poses.
- **Headless:** no head and no neck. The garment's neckline is an open, empty collar.
  - The neckline centre is at about (1080, 1590) in the 2160-px canvas, i.e. horizontally centred and about 72% down.
  - The shoulders span roughly x = 440 to 1720.
  - The body runs off the **bottom edge**, cropped at mid-torso or waist.
- **Front-facing**, centred and symmetrical apart from the pose.
- **Skin:** all visible skin (hands, forearms, bare arms) must be **one flat colour, exactly #c68a5e**, with skin creases in **#a66946**. The code swaps these for the visitor's skin tone, so there must be no skin gradients and no other skin shades.
- **Optional:** an SVG version of the same figure is even better, because the skin swap is then exact. ChatGPT's SVGs are often rough, so PNG is fine.

> If ChatGPT keeps drawing a head, accept it. I will erase the head and neck myself. Don't burn
> credits fighting it. Just make sure the clothes and hands are right.

### Shared outfit wording (paste before each outfit prompt)

```
Transparent background PNG, 2160 x 2220 pixels. A HEADLESS festive figure for a greeting-card
template: the body is cropped at the neckline (no head, no neck, the collar opening is empty) and
runs off the bottom edge at the waist. The figure is front-facing, centred, and occupies only the
bottom third of the canvas; the area above is fully transparent. The shoulders are broad and span
about 60% of the canvas width. All visible skin is one flat colour #c68a5e with crease lines in
#a66946 (no skin gradients). Follow the style block exactly.
```

### B1. Men: saffron silk kurta with angavastram
```
Outfit: a marigold-saffron raw-silk kurta (#e58a2a, shaded #b45a15) with a mandarin collar
trimmed in gold, a gold placket with three small gold buttons, and fine gold butta motifs
scattered across the fabric. A cream silk angavastram (#f4e7c8) with a broad gold zari border
and small lotus motifs is draped diagonally from the viewer's left shoulder to the right hip.
```
Make two poses, each a separate image:
- **`kurta-diya`:** *"Both hands are held together in front of the chest, cupped palms facing up, holding a lit clay diya (terracotta, gold rim, bright flame with soft glow). The diya's flame sits at about 60% down the canvas, centred. The warm glow lights the hands and the front of the kurta."*
- **`kurta-sparkler`:** *"The viewer's-left arm hangs relaxed at the side, its hand out of frame at the bottom. The viewer's-right arm is raised high beside the head area, elbow bent, hand at about 25% down the canvas and 85% across. The hand grips a lit sparkler (phuljhadi): a thin grey wire with a starburst of white and gold sparks at the top. The sparks must stay inside the canvas."*

### B2. Men: white panche with silk shirt (traditional Karnataka)
```
Outfit: a crisp off-white silk shirt with a subtle sheen and a thin gold-bordered cream shawl
(angavastram) folded over both shoulders and hanging straight down the front on each side, with a
broad gold zari border at its ends. Understated and elegant: Mysuru-style festive.
```
Make the same two poses: **`panche-diya`** and **`panche-sparkler`**.

### B3. Women: Mysore silk saree
```
Outfit: a deep magenta Mysore silk saree (#b02a62, shaded #7c1745) with a broad gold zari border
and small gold lotus buttas, the pleated pallu draped over the WEARER'S LEFT shoulder (VIEWER'S
RIGHT), falling diagonally across the body. An emerald silk blouse (#22735f) with elbow-length
sleeves with gold borders. A gold temple necklace with a small round pendant, and gold bangles on
both wrists. No jewellery on the head (the jasmine is added separately).
```
Make the same two poses: **`saree-diya`** and **`saree-sparkler`**. Keep the bangles visible.

### B4. Women: langa-davani half-saree (for younger users)
```
Outfit: a langa-davani (half-saree): a purple silk skirt top edge visible at the bottom, a
mustard-gold blouse, and a parrot-green davani (half-saree drape) with a magenta and gold border
draped from the viewer's right shoulder across the body. A small gold necklace and bangles.
```
Make the same two poses: **`langa-diya`** and **`langa-sparkler`**.

> Minimum for launch: B1 and B3, in both poses, which is **4 images**. B2 and B4 add variety.

---

## Set C: background scenes

### What the code needs from every background

- **Size and format:** 2160 x 2700 px, **JPG or WebP, fully opaque**, under about 500 KB after compression. I can compress them.
- **No text, logos or people.**
- **Zones** (percentages of height). Keep these calm, because things are drawn over them:
  - **Top 0–17%: the title area.** The headline sits at the left, so keep the top-left dark and plain. Hanging decorations may enter from the top edge on the far left or right.
  - **Centre, 28–68% down and 28–72% across: the head area.** Keep it a calm, softly lit, slightly brighter halo, so a face reads clearly against it.
  - **Bottom-centre, from 70% down, 20–80% across: covered by the body.** Detail here won't be seen.
  - **Bottom 8%: covered by the logo band.** Leave it plain.
- **Where the interest goes:** the **left and right edges** and the **lower corners**. Put diyas, lanterns, rangoli and fireworks there.

### Shared background wording (paste before each scene)

```
Opaque background illustration, portrait 4:5, 2160 x 2700 pixels, for a greeting-card template.
There are NO people and NO text. Composition rules: keep the top-left area dark and empty (a
headline goes there); keep the centre (from 28% to 68% down, 28% to 72% across) calm and softly
glowing with a warm halo (a portrait head goes there); keep the bottom-centre simple (a figure
covers it) and the bottom 8% plain (a logo band covers it). Put all decorative detail along the
left and right edges and in the lower corners. Follow the style block exactly.
```

### C1. `bg-night-sky`: Deepavali night
```
Scene: a deep indigo night sky fading to plum near the bottom, with scattered stars. A string of
warm fairy lights swags along the very top edge. Two hexagonal paper akash buttis (sky lanterns,
gold and orange with tassels) hang on long threads, one on the far left, one on the far right.
Rows of small lit clay diyas glow along the bottom-left and bottom-right edges, with warm light
pooling on the ground.
```

### C2. `bg-doorstep`: home entrance with rangoli
```
Scene: the front doorstep of a traditional Karnataka home at night. A carved wooden door frame
forms the left and right edges of the image; a toran of marigolds and mango leaves hangs across
the very top. In the lower corners, colourful rangoli (white rice-flour lines filled with
magenta, yellow and green) on a stone floor, with lit diyas placed on the rangoli and on the
steps. The open doorway in the centre glows warm gold from inside (this is the calm halo).
```

### C3. `bg-fireworks`: city skyline
```
Scene: a night skyline of Bengaluru/Mysuru rooftops and a distant temple gopura silhouetted in
deep indigo along the bottom-left and bottom-right. Fireworks burst in gold, magenta and teal in
the upper-left and upper-right sky, leaving the centre clear and softly lit. A few lanterns glow
on the rooftop parapets.
```

### C4. `bg-lakshmi-puja`: puja corner
```
Scene: a warm indoor puja corner. Tall brass kuthu deepa (oil lamps) with several lit wicks
stand at the far left and far right edges; marigold and jasmine garlands hang down both sides; a
brass kalasha with mango leaves and a coconut, and plates of flowers and sweets, sit in the lower
corners. A warm golden wall behind, softly lit, with a subtle kolam pattern. The centre is a calm
golden glow.
```

### C5. `bg-balipadyami`: village courtyard (Karnataka flavour)
```
Scene: a village courtyard at dusk on Balipadyami. A tiled-roof house edge on the left, a
tulasi katte (raised tulsi planter) with a diya on the right, a cow-dung-wash floor with a white
rangoli in the lower corners, and rows of oil lamps along the low walls. A distant temple gopura
is faintly visible on the horizon through the centre, under a twilight indigo-to-orange sky.
```

> Minimum for launch: **C1**. Add C2 and C3 if you want a scene picker.

---

## Set D: props and overlay (optional)

These are only needed if the outfits come without props, or if you want draggable extras.

| File | Size | Prompt |
|---|---|---|
| `prop-diya.png` | 1024 x 1024, transparent | *"A single lit clay diya, three-quarter view, flame and soft glow, centred, transparent background. Style block."* |
| `prop-sparkler.png` | 1024 x 1024, transparent | *"A single lit sparkler (phuljhadi), wire diagonal from bottom-left to top-right, a starburst of white-gold sparks at the top-right, transparent background. Style block."* |
| `prop-sweets.png` | 1024 x 1024, transparent | *"A small brass plate of Deepavali sweets: mysore pak, laddoos and kaju katli, with a marigold, transparent background. Style block."* |
| `overlay-toran.png` | 2160 x 2700, transparent | *"A transparent overlay frame: a marigold and mango-leaf toran across the very top edge (no taller than 8% of the height), and a thin gold border inset slightly from all four edges, with small rangoli-dot corner ornaments. Everything else fully transparent. Style block."* |

---

## Delivery checklist (what to send me)

| Asset | Format | Size | Naming |
|---|---|---|---|
| Outfits | transparent PNG (SVG if you have it) | 2160 x 2220 | `{outfit}-{pose}.png`, e.g. `kurta-diya.png`, `saree-sparkler.png` |
| Backgrounds | JPG or WebP, opaque | 2160 x 2700 | `bg-{scene}.jpg` |
| Props | transparent PNG | 1024 x 1024 | `prop-{name}.png` |
| Overlay | transparent PNG | 2160 x 2700 | `overlay-{name}.png` |

Drop them into `site/assets/deepavali/`. Then I will:
- align and scale each outfit to the neckline and hands;
- turn the skin colour into a mask, so it follows the visitor's tone;
- erase any head ChatGPT drew;
- compress everything;
- add Scene and Outfit pickers to the card maker.

**Notes**
- ChatGPT won't hit exact pixel positions. That's fine: I'll fit them. What matters is that the outfits are consistent with each other: the same scale, the same neckline height, and the same shoulder width. Ask it to keep them consistent: *"same framing and scale as the previous outfit image"*.
- Check that the saree pallu is on the **viewer's right**, and that the sparkler hand is the **viewer's right** hand.
- If the skin comes out in several shades, tell me. I'll make a skin mask by hand.
