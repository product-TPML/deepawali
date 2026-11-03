Full-size artwork masters for the Deepavali greeting card (not loaded by the site; the source for
the web versions in site/assets/deepavali/).

outfits/       {kurta|panche|saree|langa}-{diya|sparkler}.png, 2160 x 2220, transparent. Skin painted in
               #c68a5e with creases #a66946. Layout: neckline centred at x 1080, y 1600; shoulders at
               about y 1680; nothing inside the head oval (x 640-1520, y 480-1520).
backgrounds/   bg-{scene}.jpg, 2160 x 2700.

After changing anything here, run:  python tools/build-art.py
It writes the web versions to site/assets/deepavali/ and prints the NECKS and LIGHTS lines for
site/greeting.js.
