// ---------------------------------------------------------------------------
// Deepavali 2026 · Prajavani. Runs in the browser only; no backend.
// ---------------------------------------------------------------------------
const DEEPAVALI = Date.parse('2026-11-08T00:00:00+05:30'); // Lakshmi Puja, Sunday 8 November (IST)
const DAY_MS = 86400000;

// Edition settings. The Kannada CMS page sets window.DASARA_SITE / window.DASARA_STRINGS (built from
// content/i18n/kn.json); without them this is the English review page. greeting.js reads the same
// settings through window.DASARA (the name is kept from the Dasara greeting card it reuses).
const SITE = {
  lang: 'en',
  locale: 'en-IN',
  publisher: 'Prajavani',
  publisherUrl: 'https://www.prajavani.net/',
  publisherLogo: 'https://images.assettype.com/deccanherald/2026-10-08/uf85tvay/PV-White.svg',
  sponsor: 'Union Bank of India', // title sponsor, the same as on the Prajavani Dasara page
  sponsorUrl: 'https://homeloan.unionbankofindia.bank.in/',
  sponsorLogo: 'https://images.assettype.com/prajavani/2026-10-15/kzt51rx7/Unionbank.svg',
  sponsorOnLight: true, // the logo sits on a white chip
  creativeSets: [ // Union Bank's two campaigns, as on the Prajavani Dasara page; the banners rotate between them
    { id: 'home-loan', url: 'https://homeloan.unionbankofindia.bank.in/', images: {
      '970x250': 'https://images.assettype.com/prajavani/2026-11-05/rz4skjzj/Home-970x250-3.png',
      '728x90': 'https://images.assettype.com/prajavani/2026-11-05/nb02484q/Home-728x90-3.png',
      '300x600': 'https://images.assettype.com/prajavani/2026-10-21/n7hxor1c/Home-300x600.png',
      '300x250': 'https://images.assettype.com/prajavani/2026-11-05/pc58krfi/Home-300x250-3.png',
      '320x480': 'https://images.assettype.com/prajavani/2026-10-21/9gicjgpa/Home-320x480.png',
      '320x50': 'https://images.assettype.com/prajavani/2026-10-21/qsff8g3k/Home-320x50.png' } },
    { id: 'vehicle-loan', url: 'https://dbp.unionbankofindia.bank.in/assets/vehicle-loan/landing', images: {
      '970x250': 'https://images.assettype.com/prajavani/2026-11-05/e5x9wvbu/Vehicle-970x250-2.png',
      '728x90': 'https://images.assettype.com/prajavani/2026-11-05/ajk1s117/Vehicle-728x90-2.png',
      '300x600': 'https://images.assettype.com/prajavani/2026-10-21/t9zqrsg7/Vehicle-300x600.png',
      '300x250': 'https://images.assettype.com/prajavani/2026-11-05/vvkjler1/Vehicle-300x250-2.png',
      '320x480': 'https://images.assettype.com/prajavani/2026-10-21/8eq1o4ok/Vehicle-320x480.png',
      '320x50': 'https://images.assettype.com/prajavani/2026-10-21/6i0njzxo/Vehicle-320x50.png' } }
  ],
  storyTags: ['Deepavali', 'Deepawali', 'Diwali'], // Prajavani tags merged into the stories section, newest first
  storyTagPage: 'deepavali', // prajavani.net/tags/... linked from the empty state
  storyCount: 6, // on the home page
  storyFetch: 60, // per tag; the All stories view pages through them
  storyPage: 12, // stories per page in the All stories view
  // Greeting card artwork on Prajavani's image CDN (assettype), by file name. A file not listed here loads
  // from site/assets/deepavali/ next to this script (Cloudflare Pages). assettype re-encodes to AVIF/WebP for
  // browsers, keeping transparency; the skin masks come back untouched.
  artwork: {
    'bg-balipadyami.webp': 'https://images.assettype.com/prajavani/2026-11-03/1psyyh25/bg-balipadyami.webp',
    'bg-doorstep.webp': 'https://images.assettype.com/prajavani/2026-11-03/0tdk66nn/bg-doorstep.webp',
    'bg-fireworks.webp': 'https://images.assettype.com/prajavani/2026-11-03/yn91h92r/bg-fireworks.webp',
    'bg-lakshmi-puja.webp': 'https://images.assettype.com/prajavani/2026-11-03/k8d2rwga/bg-lakshmi-puja.webp',
    'bg-night-sky.webp': 'https://images.assettype.com/prajavani/2026-11-03/eokdunyd/bg-night-sky.webp',
    'kurta-diya-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/5xduinmg/kurta-diya-skin.png',
    'kurta-diya.webp': 'https://images.assettype.com/prajavani/2026-11-03/8m56wiuc/kurta-diya.webp',
    'kurta-sparkler-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/pm7dnbpc/kurta-sparkler-skin.png',
    'kurta-sparkler.webp': 'https://images.assettype.com/prajavani/2026-11-03/l4rwgdz6/kurta-sparkler.webp',
    'langa-diya-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/ssyj1pmh/langa-diya-skin.png',
    'langa-diya.webp': 'https://images.assettype.com/prajavani/2026-11-03/rtk139l6/langa-diya.webp',
    'langa-sparkler-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/6zkfej3u/langa-sparkler-skin.png',
    'langa-sparkler.webp': 'https://images.assettype.com/prajavani/2026-11-03/4yv6ecv1/langa-sparkler.webp',
    'panche-diya-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/cl9s7xc1/panche-diya-skin.png',
    'panche-diya.webp': 'https://images.assettype.com/prajavani/2026-11-03/ngu4h6xr/panche-diya.webp',
    'panche-sparkler-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/evk6jvdz/panche-sparkler-skin.png',
    'panche-sparkler.webp': 'https://images.assettype.com/prajavani/2026-11-03/58cao3ji/panche-sparkler.webp',
    'saree-diya-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/rz2phmns/saree-diya-skin.png',
    'saree-diya.webp': 'https://images.assettype.com/prajavani/2026-11-03/o7c4xus1/saree-diya.webp',
    'saree-sparkler-skin.png': 'https://images.assettype.com/prajavani/2026-11-03/jh2gdtn4/saree-sparkler-skin.png',
    'saree-sparkler.webp': 'https://images.assettype.com/prajavani/2026-11-03/dbxbi1yx/saree-sparkler.webp',
  },
  ...window.DASARA_SITE
};
const STRINGS = window.DASARA_STRINGS || {};
// t('key', 'English text with {vars}', { vars }) returns the edition's text for key, or the English.
function t(key, fallback, vars = {}) {
  const text = STRINGS[key] ?? fallback;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}
const brand = { publisher: SITE.publisher, sponsor: SITE.sponsor };
window.DASARA = { SITE, t, brand };
document.documentElement.classList.toggle('sponsor-on-light', Boolean(SITE.sponsorOnLight));
// JSON and artwork load from wherever this script is served, even when the page is on the CMS.
const ASSET_BASE = document.currentScript ? new URL('../', document.currentScript.src).href : '';
const assetUrl = path => (/^https?:/.test(path) ? path : ASSET_BASE + path);
const pageUrl = () => location.href.split('#')[0];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function track(event, detail = {}) {
  try { window.dataLayer?.push({ event, ...detail }); } catch { /* analytics must never break the page */ }
}
// Page view in the same shape as Prajavani's own pages (as on the PV Dasara page), so PV's GTM
// page_view triggers pick it up. Article and user fields are not known here and are sent as 'NA'.
const NA = 'NA';
track('page_view', {
  page_type: 'microsite',
  section_name: 'Deepavali Special',
  content_title: document.title,
  author_name: NA, author_id: NA, published_date: NA, created_date: NA, last_updated_date: NA,
  content_id: NA, article_id: NA, article_type: NA, story_tags: NA, story_words: NA,
  creator_name: NA, comment_number: NA,
  auth_status: NA, uuid: NA, premium_article: 'no', access_level_value: NA
});
document.addEventListener('click', event => {
  const tracked = event.target.closest('[data-track]');
  if (tracked) track(tracked.dataset.track);
  const sponsor = event.target.closest('a.sponsor, a.ad-creative');
  if (sponsor) track('sponsor_click', { placement: sponsor.className || 'link' });
});

// ---------------------------------------------------------------------------
// Sponsor in the header
// ---------------------------------------------------------------------------
document.querySelectorAll('.sponsor').forEach(link => {
  link.href = SITE.sponsorUrl;
  if (SITE.sponsorUrl !== '#') { link.target = '_blank'; link.rel = 'noopener noreferrer sponsored'; }
});
if (SITE.sponsorLogo) {
  document.querySelectorAll('[data-sponsor-logo]').forEach(slot => {
    const img = document.createElement('img');
    img.src = assetUrl(SITE.sponsorLogo);
    img.alt = SITE.sponsor;
    slot.replaceChildren(img);
    slot.style.border = '0';
    slot.style.padding = '0';
  });
}

// ---------------------------------------------------------------------------
// Menu panel (header button on tablets, bottom bar on phones) and the current section, which is
// marked in the header, the menu and the bottom bar as the visitor scrolls.
// ---------------------------------------------------------------------------
const siteMenu = document.querySelector('#site-menu');
const menuOpeners = [...document.querySelectorAll('[data-menu-open]')];
let menuReturnFocus = null;
function setMenu(open) {
  if (open === !siteMenu.hidden) return;
  siteMenu.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  menuOpeners.forEach(button => button.setAttribute('aria-expanded', String(open)));
  if (open) {
    menuReturnFocus = document.activeElement;
    siteMenu.querySelector('.site-menu-panel').focus();
    track('menu_open');
  } else if (menuReturnFocus?.isConnected) {
    menuReturnFocus.focus();
  }
}
menuOpeners.forEach(button => button.addEventListener('click', () => setMenu(true)));
siteMenu.querySelectorAll('[data-menu-close], .site-menu-links a, .site-menu-publisher').forEach(element => element.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (siteMenu.hidden) return;
  if (event.key === 'Escape') { setMenu(false); return; }
  if (event.key !== 'Tab') return; // keep focus inside the panel while it is open
  const focusable = [...siteMenu.querySelectorAll('button, a[href]')];
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !siteMenu.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
addEventListener('resize', () => { if (innerWidth >= 1100) setMenu(false); });

const navLinks = [...document.querySelectorAll('[data-nav]')];
const navSections = [...new Set(navLinks.map(link => link.dataset.nav))].map(id => document.getElementById(id)).filter(Boolean);
const visibleSections = new Set();
function markSection() {
  // The first section in page order that is on screen (in the band below the header) is current.
  const current = document.body.classList.contains('all-stories-open') ? 'stories' : navSections.find(section => visibleSections.has(section))?.id || 'home';
  navLinks.forEach(link => {
    const active = link.dataset.nav === current;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
  });
}
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => (entry.isIntersecting ? visibleSections.add(entry.target) : visibleSections.delete(entry.target)));
  markSection();
}, { rootMargin: '-40% 0px -55% 0px' });
navSections.forEach(section => sectionObserver.observe(section));
markSection();

// ---------------------------------------------------------------------------
// Countdown to Deepavali (days only: calm, no ticking seconds)
// ---------------------------------------------------------------------------
const countdownNum = document.querySelector('#countdown-num');
const countdownText = document.querySelector('#countdown-text');
function updateCountdown() {
  const days = Math.ceil((DEEPAVALI - Date.now()) / DAY_MS);
  if (days > 1) {
    countdownNum.textContent = days;
    countdownText.textContent = t('countdown.days', 'days to Deepavali · Sunday, 8 November');
  } else if (days === 1) {
    countdownNum.textContent = '1';
    countdownText.textContent = t('countdown.day', 'day to Deepavali · Sunday, 8 November');
  } else {
    countdownNum.hidden = true;
    countdownText.textContent = days > -5 ? t('countdown.now', 'Deepavali is here. Happy Deepavali!') : t('countdown.after', 'Thank you for celebrating Deepavali with us.');
  }
}
updateCountdown();
setInterval(updateCountdown, 60000);

// ---------------------------------------------------------------------------
// Deepavali night. The scene at the foot of the hero (children with sparklers, a flower pot, a ground
// chakri and a cracker string; ladies lighting diyas at the door) is drawn in index.html and moved by
// CSS. This canvas adds the sparks, pops the cracker string and sends up the sky shots: a rocket every
// few seconds while the hero is on screen, and one wherever the sky is tapped. Everything pauses when
// the hero scrolls away.
// ---------------------------------------------------------------------------
const hero = document.querySelector('.hero');
// The hero fills the first screen: tell the CSS where it starts (below the header and, on phones, the
// sponsor strip) and how tall the phone's bottom bar is.
const bottomBar = document.querySelector('.bottom-nav');
function fitHero() {
  const root = document.documentElement.style;
  root.setProperty('--hero-top', `${Math.round(hero.getBoundingClientRect().top + scrollY)}px`);
  root.setProperty('--bottom-bar', `${bottomBar && getComputedStyle(bottomBar).display !== 'none' ? bottomBar.offsetHeight : 0}px`);
}
fitHero();
new ResizeObserver(fitHero).observe(document.querySelector('.top'));
addEventListener('resize', fitHero);
const scene = document.querySelector('.scene');
const sparkPoints = [...document.querySelectorAll('[data-spark]')];
const ladi = [...document.querySelectorAll('.ladi-cracker')];
const fireworks = document.querySelector('#fireworks');
const fx = fireworks.getContext('2d');
const COLOURS = ['#f2c46d', '#ff9f2e', '#ffd9a0', '#ff6f61', '#c9a0ff', '#8fe3ff'];
// Traditional firework hues: red, orange, yellow, green, blue, violet, silver-white and gold.
const TAP_COLOURS = ['#f5223a', '#ff7a18', '#ffe31a', '#18d96e', '#168cff', '#b34dff', '#f3f6ff', '#ffc247'];
const GOLD = ['#ffe6a3', '#fff6d6', '#ffb347'];
// Sparks given off each frame at each [data-spark] point; speeds are scaled with the scene.
const EMITTERS = {
  sparkler: { count: 2, speed: 1.6, life: 16, size: 1.1, colours: GOLD },
  fountain: { count: 3, speed: 3.2, life: 38, size: 1.3, aim: -Math.PI / 2, colours: GOLD },
  chakri: { count: 4, speed: 2.6, life: 18, size: 1.2, colours: ['#b6ffbf', '#ffe6a3', '#fff6d6'] }
};
// The chakri lies flat, so its sparks skim out sideways along the floor, a little up from the ground.
const chakriAim = () => (Math.random() < 0.5 ? -0.25 : Math.PI + 0.25);
const GRAVITY = 0.06;
let particles = [];
let rockets = [];
let tapRings = [];
let running = false;
let frameId = 0;
let heroVisible = false;
let ratio = 1;
let sceneScale = 1;
let tapCount = 0;
function sizeCanvas() {
  ratio = Math.min(devicePixelRatio || 1, 2);
  fireworks.width = hero.clientWidth * ratio;
  fireworks.height = hero.clientHeight * ratio;
  fx.setTransform(ratio, 0, 0, ratio, 0, 0);
  // The scene is drawn 1200 x 320 and fills its box like a cropped photo; sparks scale with it.
  sceneScale = Math.min(1.4, Math.max(0.5, scene.clientWidth / 1200, scene.clientHeight / 320));
}
sizeCanvas();
new ResizeObserver(sizeCanvas).observe(hero);
Object.defineProperty(fireworks, 'logicalSize', { get: () => ({ width: fireworks.width / ratio, height: fireworks.height / ratio }) });

let fireworkAudio;
let fireworkNoise;
function getFireworkAudio() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  try {
    fireworkAudio ||= new Audio();
    if (fireworkAudio.state === 'suspended') fireworkAudio.resume().catch(() => {});
    if (!fireworkNoise) {
      fireworkNoise = fireworkAudio.createBuffer(1, Math.ceil(fireworkAudio.sampleRate * 1.1), fireworkAudio.sampleRate);
      const samples = fireworkNoise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    }
    return fireworkAudio;
  } catch { return null; }
}
function playFireworkLaunchSound() {
  const audio = getFireworkAudio();
  if (!audio) return;
  try {
    const now = audio.currentTime;
    const noise = fireworkAudio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    noise.buffer = fireworkNoise;
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + 0.9);
    filter.Q.setValueAtTime(5, now);
    filter.Q.linearRampToValueAtTime(22, now + 0.9);
    gain.gain.setValueAtTime(0.008, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.3);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.78);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    noise.connect(filter).connect(gain).connect(audio.destination);
    noise.start(now);
    noise.stop(now + 0.96);
  } catch { /* Audio must never prevent a firework from launching. */ }
}
function playFireworkExplosionSound() {
  const audio = getFireworkAudio();
  if (!audio) return;
  try {
    const now = audio.currentTime;
    const body = audio.createBufferSource();
    const bodyFilter = audio.createBiquadFilter();
    const bodyGain = audio.createGain();
    body.buffer = fireworkNoise;
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(900, now);
    bodyFilter.frequency.exponentialRampToValueAtTime(65, now + 0.55);
    bodyGain.gain.setValueAtTime(0.24, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    body.connect(bodyFilter).connect(bodyGain).connect(audio.destination);
    body.start(now);
    body.stop(now + 0.66);

    const crack = audio.createBufferSource();
    const crackFilter = audio.createBiquadFilter();
    const crackGain = audio.createGain();
    crack.buffer = fireworkNoise;
    crackFilter.type = 'highpass';
    crackFilter.frequency.setValueAtTime(2200, now);
    crackGain.gain.setValueAtTime(0.2, now);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    crack.connect(crackFilter).connect(crackGain).connect(audio.destination);
    crack.start(now);
    crack.stop(now + 0.06);

    const crackles = audio.createBufferSource();
    const crackleFilter = audio.createBiquadFilter();
    const crackleGain = audio.createGain();
    crackles.buffer = fireworkNoise;
    crackleFilter.type = 'highpass';
    crackleFilter.frequency.setValueAtTime(2000, now);
    crackleGain.gain.setValueAtTime(0.001, now);
    Array.from({ length: 14 }, () => Math.random() * 0.7).sort((a, b) => a - b).forEach(offset => {
      const at = now + 0.1 + offset;
      crackleGain.gain.setValueAtTime(0.13 * (1 - offset / 0.7), at);
      crackleGain.gain.setTargetAtTime(0.001, at, 0.006);
    });
    crackles.connect(crackleFilter).connect(crackleGain).connect(audio.destination);
    crackles.start(now + 0.1);
    crackles.stop(now + 0.82);

    const tone = audio.createOscillator();
    const toneGain = audio.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(110, now);
    tone.frequency.exponentialRampToValueAtTime(38, now + 0.45);
    toneGain.gain.setValueAtTime(0.16, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    tone.connect(toneGain).connect(audio.destination);
    tone.start(now);
    tone.stop(now + 0.51);
  } catch { /* Audio must never prevent a firework from launching. */ }
}

function startLoop() {
  if (!running) { running = true; frameId = requestAnimationFrame(step); }
}
// Without an aim the particles spread in a full circle (a burst); with one, in a narrow cone (a fountain).
function addParticles(x, y, count, { speed, life, size, aim, colours = COLOURS, streak = false }) {
  const colour = colours[Math.floor(Math.random() * colours.length)];
  for (let i = 0; i < count; i++) {
    const angle = aim === undefined ? (Math.PI * 2 * i) / count + Math.random() * 0.2 : aim + (Math.random() - 0.5) * 0.7;
    const velocity = speed * (0.55 + Math.random() * 0.45);
    particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, max: life, size, colour: Math.random() < 0.8 ? colour : '#fff', streak });
  }
  startLoop();
}
function burst(x, y, look = {}) {
  const scale = Math.min(1, fireworks.logicalSize.width / 900) * 0.6 + 0.4;
  const multiplier = look.multiplier ?? 0.7;
  const count = Math.round((look.count || 70) * multiplier);
  if (look.colours) look.colours.forEach(colour => addParticles(x, y, Math.ceil(count / look.colours.length), {
    speed: 4.6 * scale * multiplier, life: 70, size: 2.2, colours: [colour], streak: look.streak
  }));
  else addParticles(x, y, count, { speed: 4.6 * scale * multiplier, life: 70, size: 2.2 });
}
// A rocket rises from the lane, slowing as it climbs, and bursts at the top.
function launch(x, targetY, look) {
  if (reducedMotion || document.hidden) return;
  const { width, height } = fireworks.logicalSize;
  const startY = height - 20;
  const top = targetY ?? height * (0.12 + Math.random() * 0.26);
  const distance = Math.max(60, startY - top);
  rockets.push({ x: x ?? width * (0.08 + Math.random() * 0.84), y: startY, vx: (Math.random() - 0.5) * 0.6, vy: -Math.sqrt(2 * 0.09 * distance), look });
  startLoop();
}
function pointOf(element, box) {
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - box.left, y: rect.top + rect.height / 2 - box.top };
}
// Each flower pot plays for six seconds, rests for a moment, then lights again; data-delay staggers them.
const anarOn = point => (performance.now() + Number(point.dataset.delay || 0)) % 8500 < 6000;
// The cracker string: the fuse burns, the crackers pop one after another, then a new string is laid.
const LADI_FUSE = 1500;
const LADI_GAP = 140;
const LADI_CYCLE = 6000;
let ladiPopped = 0;
function popLadi(box) {
  const time = performance.now() % LADI_CYCLE;
  const popped = Math.max(0, Math.min(ladi.length, Math.floor((time - LADI_FUSE) / LADI_GAP) + 1));
  if (popped < ladiPopped) { ladi.forEach(cracker => cracker.classList.remove('is-popped')); ladiPopped = 0; }
  const catchingUp = popped - ladiPopped > 1;
  for (; ladiPopped < popped; ladiPopped++) {
    const cracker = ladi[ladiPopped];
    cracker.classList.add('is-popped');
    if (!catchingUp) {
      const { x, y } = pointOf(cracker, box);
      addParticles(x, y, 14, { speed: 2.2 * sceneScale, life: 16, size: 1.3, colours: ['#fff', '#ffe6a3', '#ff9f2e'] });
    }
  }
}
function step() {
  frameId = 0;
  if (document.hidden) { running = false; return; }
  const { width, height } = fireworks.logicalSize;
  if (heroVisible) {
    const box = hero.getBoundingClientRect();
    for (const point of sparkPoints) {
      const kind = point.dataset.spark;
      if (kind === 'fountain' && !anarOn(point)) continue;
      const { x, y } = pointOf(point, box);
      const { count, speed, ...look } = EMITTERS[kind];
      if (kind === 'chakri') {
        for (let i = 0; i < count; i++) addParticles(x, y, 1, { ...look, speed: speed * sceneScale, aim: chakriAim() });
      } else {
        addParticles(x, y, count, { ...look, speed: speed * sceneScale });
      }
    }
    popLadi(box);
  }
  for (const rocket of rockets) {
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    rocket.vy += 0.09;
    particles.push({ x: rocket.x, y: rocket.y, vx: (Math.random() - 0.5) * 0.4, vy: 0.4 + Math.random() * 0.4, life: 20, max: 20, size: 1.4, colour: '#ffd9a0' });
    if (rocket.vy >= -0.4) {
      rocket.done = true;
      burst(rocket.x, rocket.y, rocket.look);
      if (rocket.look?.userTriggered) playFireworkExplosionSound();
    }
  }
  rockets = rockets.filter(rocket => !rocket.done);

  fx.clearRect(0, 0, width, height);
  fx.globalCompositeOperation = 'lighter';
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.vx *= 0.975;
    p.vy = p.vy * 0.975 + GRAVITY;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    fx.globalAlpha = Math.max(0, p.life / p.max);
    fx.fillStyle = p.colour;
    if (p.streak) {
      fx.strokeStyle = p.colour;
      fx.lineWidth = p.size;
      fx.beginPath();
      fx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
      fx.lineTo(p.x, p.y);
      fx.stroke();
    } else {
      fx.beginPath();
      fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fx.fill();
    }
  }
  tapRings = tapRings.filter(ring => ring.life > 0);
  for (const ring of tapRings) {
    fx.globalAlpha = ring.life / 24;
    fx.strokeStyle = ring.colour;
    fx.lineWidth = 2;
    fx.beginPath();
    fx.arc(ring.x, ring.y, (24 - ring.life) * 1.5 + 5, 0, Math.PI * 2);
    fx.stroke();
    ring.life -= 1;
  }
  fx.globalAlpha = 1;
  fx.globalCompositeOperation = 'source-over';
  if (heroVisible || particles.length || rockets.length || tapRings.length) frameId = requestAnimationFrame(step);
  else { running = false; fx.clearRect(0, 0, width, height); }
}

// Sky shots every 1.5 to 3 seconds (sometimes two together) while the hero is on screen.
let rocketTimer = 0;
let rocketPairTimer = 0;
let lastFireworkTap = -Infinity;
const FIREWORK_TAP_COOLDOWN = 800;
function scheduleRockets() {
  clearTimeout(rocketTimer);
  rocketTimer = setTimeout(() => {
    if (document.hidden || !heroVisible) return;
    launch();
    if (Math.random() < 0.3) rocketPairTimer = setTimeout(() => {
      if (!document.hidden && heroVisible) launch();
    }, 250);
    scheduleRockets();
  }, 1500 + Math.random() * 1500);
}
new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting && !reducedMotion;
  hero.classList.toggle('is-playing', entry.isIntersecting);
  if (heroVisible && !document.hidden) { startLoop(); launch(); scheduleRockets(); }
  else { clearTimeout(rocketTimer); clearTimeout(rocketPairTimer); }
}).observe(hero);
document.addEventListener('visibilitychange', () => {
  clearTimeout(rocketTimer);
  clearTimeout(rocketPairTimer);
  hero.classList.toggle('is-playing', heroVisible && !document.hidden);
  if (document.hidden) {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    running = false;
    particles = [];
    rockets = [];
    tapRings = [];
    const { width, height } = fireworks.logicalSize;
    fx.clearRect(0, 0, width, height);
  } else if (heroVisible) {
    startLoop();
    scheduleRockets();
  }
});
// A tap on the sky sends a rocket up to that spot (the text above lets taps through).
hero.addEventListener('pointerdown', event => {
  if (reducedMotion || event.target.closest('a, button')) return;
  const now = performance.now();
  if (now - lastFireworkTap < FIREWORK_TAP_COOLDOWN) return;
  lastFireworkTap = now;
  const box = fireworks.getBoundingClientRect();
  const x = event.clientX - box.left;
  const y = event.clientY - box.top;
  const colours = Array.from({ length: 3 }, (_, i) => TAP_COLOURS[(tapCount + i) % TAP_COLOURS.length]);
  launch(x, y, { colours, count: 70 + (tapCount % 3) * 12, multiplier: 1.3, streak: true, userTriggered: true });
  playFireworkLaunchSound();
  tapRings.push({ x, y, life: 24, colour: colours[0] });
  tapCount += 1;
  startLoop();
  track('firework_tap');
});

// ---------------------------------------------------------------------------
// Which cracker are you? Picking a cracker shows what it is and the personality it stands for.
// ---------------------------------------------------------------------------
const CRACKERS = {
  sparkler: {
    name: t('cracker.sparkler.name', 'The Sparkler'),
    meaning: t('cracker.sparkler.meaning', 'The hand-held wire that showers soft golden sparks: the first cracker almost every child holds.'),
    personality: t('cracker.sparkler.personality', "You're the warm one. You light up whoever stands next to you, quietly and steadily, and everyone wants you close by.")
  },
  flowerpot: {
    name: t('cracker.flowerpot.name', 'The Flower Pot'),
    meaning: t('cracker.flowerpot.meaning', 'The hoovina kunda: a little clay pot that sends up a fountain of sparks like a flower in bloom.'),
    personality: t('cracker.flowerpot.personality', 'Cheerful and generous. You rise to every occasion and leave people smiling, without ever needing to make a bang.')
  },
  chakri: {
    name: t('cracker.chakri.name', 'The Ground Chakri'),
    meaning: t('cracker.chakri.meaning', 'The spinning wheel that whirls on the floor in a circle of colour and light.'),
    personality: t('cracker.chakri.personality', 'Full of energy and always on the move. You turn any gathering into a party and keep everyone on their toes.')
  },
  rocket: {
    name: t('cracker.rocket.name', 'The Rocket'),
    meaning: t('cracker.rocket.meaning', 'Launched from a bottle, it shoots high into the night and bursts into stars.'),
    personality: t('cracker.rocket.personality', 'A big dreamer who aims high. You take off with confidence and love the view from the top.')
  },
  ladi: {
    name: t('cracker.ladi.name', 'The Cracker String'),
    meaning: t('cracker.ladi.meaning', 'The ladi: a long string of small crackers that pop one after another, on and on.'),
    personality: t('cracker.ladi.personality', "The life of the party. Once you get going there's no stopping you: lively, loud and impossible to ignore.")
  },
  snake: {
    name: t('cracker.snake.name', 'The Snake Tablet'),
    meaning: t('cracker.snake.meaning', 'A tiny black tablet that, once lit, slowly grows into a long curling snake of ash.'),
    personality: t('cracker.snake.personality', 'Calm, curious and a little mysterious. You take your time, and you always surprise people in the end.')
  }
};
// The cracker art. Each card's SVG (index.html) draws its cracker; a canvas laid over it adds the sparks,
// and the step functions below move the SVG's parts: the chakri spins, the rocket flies and bursts, the
// string pops, the snake grows. One animation loop runs them all, only while the quiz is on screen.
// With reduced motion nothing is mounted and the static sparks drawn in the SVGs (.ck-static) show.
const crackerArt = (() => {
  const SIZE = 120; // the SVGs' viewBox is 120 x 120 and the canvases draw in the same units
  const BLEED = 30; // the canvas reaches this far past the art on every side (style.css: inset -25%)
  const TAU = Math.PI * 2;
  const live = new Set();
  let playing = false, frameId = 0, lastTime = 0;
  const rand = (low, high) => low + Math.random() * (high - low);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const part = (art, selector) => art.svg.querySelector(selector);

  // Soft round glows, drawn once per colour and stamped with drawImage.
  const glowSprites = new Map();
  function glowSprite(hue) {
    hue = Math.round(hue / 10) * 10;
    if (!glowSprites.has(hue)) {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 64;
      const g = sprite.getContext('2d');
      const fill = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      fill.addColorStop(0, `hsla(${hue},100%,97%,1)`);
      fill.addColorStop(0.22, `hsla(${hue},100%,72%,.6)`);
      fill.addColorStop(1, `hsla(${hue},100%,50%,0)`);
      g.fillStyle = fill;
      g.fillRect(0, 0, 64, 64);
      glowSprites.set(hue, sprite);
    }
    return glowSprites.get(hue);
  }

  // A particle. Kinds: streak (a spark drawn along its velocity, white-hot when young), glitter (a
  // twinkling dot), smoke and bit (a scrap of paper or ash). crackle: a streak that ends as glitter;
  // split: a streak that breaks into three smaller sparks halfway, like a real sparkler's.
  function add(art, x, y, vx, vy, life, options) {
    art.parts.push({ x, y, vx, vy, life, age: 0, kind: 'streak', gravity: 0, drag: 0, width: 1, hue: 45, light: 62, tail: 0.04, ...options });
  }
  // Makes rate particles a second; make(f) gets where in this frame (0..1) the particle is born.
  function emit(art, key, rate, dt, make) {
    const due = (art.carry[key] || 0) + rate * dt;
    const count = Math.floor(due);
    art.carry[key] = due - count;
    for (let i = 0; i < count; i++) make((i + Math.random()) / count);
  }
  function burst(art, x, y) {
    const hue = pick([48, 330, 190, 120, 285]);
    art.burstHue = hue;
    for (let i = 0; i < 120; i++) {
      const angle = TAU * i / 120 + rand(-0.03, 0.03), speed = rand(58, 70) * (i % 2 ? 1 : 0.65);
      add(art, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, rand(1.3, 1.9),
        { gravity: 14, drag: 1.5, width: 1.3, hue: i % 5 ? hue : 45, tail: 0.08, crackle: Math.random() < 0.35 });
    }
  }

  const TYPES = {
    sparkler: {
      setup(art) { art.halo = part(art, '.ck-halo'); art.flicker = 1; },
      step(art, dt) {
        emit(art, 'spark', 340, dt, () => {
          const angle = rand(0, TAU), speed = rand(60, 190);
          add(art, 78, 38, Math.cos(angle) * speed, Math.sin(angle) * speed, rand(0.16, 0.42),
            { gravity: 50, width: rand(0.7, 1.5), hue: rand(38, 50), tail: 0.05, split: Math.random() < 0.45 });
        });
        art.flicker += (rand(0.55, 1) - art.flicker) * 0.35;
        art.halo.style.opacity = art.flicker;
        art.glows.push([78, 38, 14 + art.flicker * 7, 45, 0.95]);
      }
    },
    flowerpot: {
      setup(art) { art.halo = part(art, '.ck-halo'); art.floorGlow = part(art, '.ck-floor'); art.floor = 108; art.flicker = 1; },
      step(art, dt) {
        emit(art, 'jet', 320, dt, () => {
          const angle = rand(-0.42, 0.42), speed = rand(90, 158);
          add(art, 60 + rand(-1, 1), 83, Math.sin(angle) * speed, -Math.cos(angle) * speed, rand(1.1, 1.7),
            { gravity: 135, drag: 0.5, width: rand(0.7, 1.3), hue: rand(34, 48), light: 58, tail: 0.03, crackle: Math.random() < 0.15 });
        });
        art.flicker += (rand(0.6, 1) - art.flicker) * 0.3;
        art.halo.style.opacity = 0.55 + 0.45 * art.flicker;
        art.floorGlow.style.opacity = 0.3 + 0.45 * art.flicker;
        art.glows.push([60, 82, 12 + 4 * art.flicker, 42, 0.9]);
      }
    },
    chakri: {
      setup(art) { art.wheel = part(art, '.ck-wheel'); art.angle = rand(0, TAU); art.floor = 140; },
      step(art, dt) {
        const before = art.angle;
        art.angle -= 17 * dt; // the jet pushes the wheel round anticlockwise
        art.wheel.setAttribute('transform', `rotate(${(art.angle * 180 / Math.PI).toFixed(1)} 60 62)`);
        // The nozzle at the end of the coil (41.4, 75.5 from the centre 60, 62) and the way it fires.
        const nozzle = (angle) => {
          const c = Math.cos(angle), s = Math.sin(angle);
          return [60 - 18.6 * c - 13.5 * s, 62 - 18.6 * s + 13.5 * c, -0.588 * c + 0.809 * s, -0.588 * s - 0.809 * c];
        };
        emit(art, 'spray', 700, dt, f => {
          const [x, y, dx, dy] = nozzle(before + (art.angle - before) * f);
          const speed = rand(40, 105), spread = rand(-0.8, 0.8);
          add(art, x, y, (dx - dy * spread) * speed, (dy + dx * spread) * speed, rand(0.3, 0.7),
            { gravity: 30, drag: 1.4, width: rand(0.7, 1.3), hue: Math.random() < 0.6 ? rand(105, 140) : rand(40, 52), light: 60, tail: 0.05, crackle: Math.random() < 0.1 });
        });
        const [x, y] = nozzle(art.angle);
        art.glows.push([x, y, 11, 110, 0.9], [60, 62, 40, 120, 0.22]);
      }
    },
    rocket: {
      setup(art) { art.rocket = part(art, '.ck-rk'); art.t = rand(0, 0.6); art.floor = 112; art.round = -1; },
      step(art, dt) {
        const ROUND = 3.3, time = art.t % ROUND, round = Math.floor(art.t / ROUND);
        let lift = 0, shown = 1;
        if (time < 0.8) { // the fuse fizzes at the foot of the rocket
          emit(art, 'fuse', 50, dt, () => add(art, 60 + rand(-1, 1), 90, rand(-15, 15), rand(-25, 5), rand(0.1, 0.25), { gravity: 60, width: 0.7, hue: 40, light: 70 }));
          art.glows.push([60, 90, 4, 35, 0.8]);
        } else if (time < 1.35) { // lift-off
          const p = (time - 0.8) / 0.55;
          lift = -40 * p * p;
          emit(art, 'trail', 240, dt, () => add(art, 60 + rand(-0.6, 0.6), 90 + lift + rand(0, 2), rand(-7, 7), rand(15, 45), rand(0.25, 0.55),
            { gravity: 50, drag: 1, width: rand(0.7, 1.2), hue: rand(28, 42), light: 60, tail: 0.03 }));
          art.glows.push([60, 90 + lift, 6, 32, 0.9]);
        } else { // burst, then a new rocket stands in the bottle
          if (art.round !== round) { art.round = round; burst(art, 60, 34); }
          if (time < 1.6) art.glows.push([60, 34, 56 * (1 - (time - 1.35) / 0.25), art.burstHue, 0.9]);
          shown = time > 2.7 ? (time - 2.7) / 0.6 : 0;
        }
        art.rocket.setAttribute('transform', `translate(0 ${lift.toFixed(2)})`);
        art.rocket.style.opacity = shown;
      }
    },
    ladi: {
      setup(art) {
        art.string = part(art, '.ck-string');
        art.crackers = [...art.svg.querySelectorAll('.ck-lc')].reverse(); // they go off from the bottom up
        art.crackers.forEach(cracker => cracker.classList.remove('is-popped'));
        art.spots = art.crackers.map(cracker => { const m = cracker.transform.baseVal.consolidate().matrix; return [m.e, m.f]; });
        art.popped = 0; art.wait = 0.6; art.flashes = []; art.floor = 125;
      },
      step(art, dt) {
        const sway = 0.07 * Math.sin(art.t * 1.7), c = Math.cos(sway), s = Math.sin(sway);
        art.string.setAttribute('transform', `rotate(${(sway * 180 / Math.PI).toFixed(2)} 60 0)`);
        const at = ([x, y]) => [60 + (x - 60) * c - y * s, (x - 60) * s + y * c];
        art.wait -= dt;
        if (art.wait <= 0) {
          if (art.popped === art.crackers.length) { // a fresh string
            art.crackers.forEach(cracker => cracker.classList.remove('is-popped'));
            art.popped = 0; art.wait = 1;
          } else {
            const [x, y] = at(art.spots[art.popped]);
            art.crackers[art.popped++].classList.add('is-popped');
            art.flashes.push({ x, y, age: 0 });
            for (let i = 0; i < 12; i++) {
              const angle = rand(0, TAU), speed = rand(35, 80);
              add(art, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, rand(0.08, 0.2), { hue: 48, light: 75, tail: 0.03 });
            }
            for (let i = 0; i < 5; i++) add(art, x, y, rand(-30, 30), rand(-35, 5), rand(0.6, 1.1), { kind: 'bit', gravity: 90, drag: 1, spin: rand(-14, 14), color: pick(['#d8343c', '#a8182a', '#ffe08a', '#f4ead2']) });
            add(art, x, y, rand(-4, 4), rand(-14, -8), rand(0.8, 1.3), { kind: 'smoke', size: 2.5, alpha: 0.22 });
            art.wait = art.popped === art.crackers.length ? 0.9 : rand(0.05, 0.12);
          }
        }
        if (art.popped && art.popped < art.crackers.length) { const [x, y] = at(art.spots[art.popped]); art.glows.push([x, y, 4, 30, 0.9]); }
        art.flashes = art.flashes.filter(flash => (flash.age += dt) < 0.14);
        art.flashes.forEach(flash => art.glows.push([flash.x, flash.y, 4 + 16 * (1 - flash.age / 0.14), 45, 1]));
      }
    },
    snake: {
      setup(art) {
        const path = part(art, '.ck-snake-path'), length = path.getTotalLength();
        art.trail = [];
        for (let at = 0; at <= length; at += 1.1) { const point = path.getPointAtLength(at); art.trail.push([point.x, point.y]); }
        art.ember = part(art, '.ck-ember'); art.t = rand(0, 1.5); art.floor = 103;
      },
      step(art, dt) {
        const time = art.t % 6.4, burning = time < 3.8;
        art.grown = 1 - (1 - Math.min(1, time / 3.8)) ** 2;
        art.ash = time < 5 ? 1 : Math.max(0, 1 - (time - 5));
        if (burning) {
          emit(art, 'ember', 22, dt, () => add(art, 60 + rand(-4, 4), 98, rand(-6, 6), rand(-25, -10), rand(0.3, 0.6), { gravity: 10, width: 0.8, hue: 25, light: 55, tail: 0.05 }));
          emit(art, 'smoke', 7, dt, () => add(art, 60 + rand(-3, 3), 94, rand(-3, 3), rand(-16, -10), rand(1.6, 2.4), { kind: 'smoke', size: rand(2, 3), alpha: 0.16 }));
          art.glows.push([60, 98, 9, 25, 0.8]);
        } else if (time > 5 && time < 5.8) { // it crumbles away
          emit(art, 'crumb', 30, dt, () => { const [x, y] = pick(art.trail); add(art, x, y, rand(-8, 8), rand(-5, 5), rand(0.5, 0.8), { kind: 'bit', gravity: 80, spin: rand(-8, 8), color: '#7d7588' }); });
        }
        art.ember.style.opacity = burning ? rand(0.7, 1) : 0.25;
      },
      // The ash snake: overlapping discs along the path, outlined, ridged and lit from the top left.
      under(art, ctx) {
        const count = Math.floor(art.trail.length * art.grown);
        if (count < 2 || art.ash <= 0) return;
        const radius = i => 5.2 - 1.4 * i / art.trail.length;
        const pass = (fill, grow, keep = () => true, dx = 0, scale = 1) => {
          ctx.fillStyle = fill;
          ctx.beginPath();
          for (let i = 0; i < count; i++) {
            if (!keep(i)) continue;
            const [x, y] = art.trail[i], r = radius(i) * scale + grow;
            ctx.moveTo(x + dx + r, y + dx);
            ctx.arc(x + dx, y + dx, r, 0, TAU);
          }
          ctx.fill();
        };
        ctx.globalAlpha = art.ash;
        pass('#2f2a38', 0.9);
        pass('#8f879c', 0);
        pass('#5a5368', 0, i => i % 3 === 0, 0, 0.96);
        pass('#a59db2', 0, i => i % 3 === 1, -0.5, 0.7);
        pass('rgba(255,255,255,.13)', 0, () => true, -1.3, 0.45);
        ctx.globalAlpha = 1;
      }
    }
  };

  function move(art, dt) {
    const kept = [];
    for (const p of art.parts) { // particles added by a split are visited in this same loop
      p.age += dt;
      if (p.age >= p.life) continue;
      const slow = Math.max(0, 1 - p.drag * dt);
      p.vx *= slow;
      p.vy = p.vy * slow + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind !== 'smoke' && p.y > art.floor) continue;
      if (p.split && p.age > p.life * 0.5) {
        p.split = false;
        for (let i = 0; i < 3; i++) {
          const angle = rand(0, TAU), speed = rand(25, 60);
          add(art, p.x, p.y, p.vx * 0.3 + Math.cos(angle) * speed, p.vy * 0.3 + Math.sin(angle) * speed, rand(0.1, 0.2), { hue: p.hue, width: 0.7, light: 80, gravity: 30 });
        }
      }
      kept.push(p);
    }
    art.parts = kept;
  }

  function draw(art) {
    const { canvas, ctx } = art;
    const px = Math.round(canvas.clientWidth * devicePixelRatio);
    if (!px) return;
    if (canvas.width !== px) canvas.width = canvas.height = px;
    else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, px, px); }
    const scale = px / (SIZE + 2 * BLEED);
    ctx.setTransform(scale, 0, 0, scale, BLEED * scale, BLEED * scale);
    art.type.under?.(art, ctx);
    for (const p of art.parts) {
      const fade = 1 - p.age / p.life;
      if (p.kind === 'smoke') {
        ctx.globalAlpha = p.alpha * fade;
        ctx.fillStyle = '#c4bccf';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + 2.2 * p.age / p.life), 0, TAU);
        ctx.fill();
      } else if (p.kind === 'bit') {
        ctx.globalAlpha = Math.min(1, fade * 3);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.spin * p.age);
        ctx.fillRect(-1.1, -0.6, 2.2, 1.2);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r, hue, alpha] of art.glows) {
      ctx.globalAlpha = alpha;
      ctx.drawImage(glowSprite(hue), x - r, y - r, r * 2, r * 2);
    }
    ctx.lineCap = 'round';
    for (const p of art.parts) {
      if (p.kind === 'smoke' || p.kind === 'bit') continue;
      const fade = 1 - p.age / p.life;
      if (p.kind === 'glitter' || (p.crackle && fade < 0.35)) {
        ctx.globalAlpha = Math.random() < 0.4 ? 0.15 : 1;
        ctx.fillStyle = `hsl(${p.hue},100%,85%)`;
        ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
        continue;
      }
      ctx.globalAlpha = Math.min(1, fade * 1.6);
      ctx.strokeStyle = `hsl(${p.hue},100%,${(p.light + (100 - p.light) * fade * fade).toFixed(0)}%)`;
      ctx.lineWidth = p.width;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * p.tail, p.y - p.vy * p.tail);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    live.forEach(art => {
      if (!art.stage.isConnected) { live.delete(art); return; }
      art.t += dt;
      art.glows = [];
      art.type.step(art, dt);
      move(art, dt);
      draw(art);
    });
    frameId = playing ? requestAnimationFrame(loop) : 0;
  }

  return {
    mount(stage) {
      const svg = stage.querySelector('svg'), type = TYPES[svg?.dataset.ck];
      if (reducedMotion || !type) return null;
      const canvas = document.createElement('canvas');
      canvas.setAttribute('aria-hidden', 'true');
      stage.append(canvas);
      stage.classList.add('ck-live');
      const art = { stage, svg, canvas, ctx: canvas.getContext('2d'), type, parts: [], glows: [], carry: {}, t: 0, floor: SIZE };
      type.setup(art);
      live.add(art);
      return art;
    },
    unmount(art) { if (art) live.delete(art); },
    play(on) {
      playing = on && !reducedMotion;
      if (playing && !frameId) { lastTime = performance.now(); frameId = requestAnimationFrame(loop); }
    }
  };
})();

const crackerButtons = [...document.querySelectorAll('.cracker')];
const crackerResult = document.querySelector('#cracker-result');
crackerButtons.forEach(button => crackerArt.mount(button.querySelector('.ck-stage')));
let resultArt = null;
let pickedCracker = null;
// friend: the visitor opened a friend's shared result (?cracker=rocket), so the result reads "Your friend is".
function pickCracker(button, { friend = false } = {}) {
  const id = button.dataset.cracker;
  const cracker = CRACKERS[id];
  pickedCracker = id;
  crackerButtons.forEach(other => other.setAttribute('aria-pressed', String(!friend && other === button)));
  document.querySelector('#cracker-result-eyebrow').textContent = friend ? t('cracker.result.friend', 'Your friend is') : t('cracker.result.you', 'You are');
  document.querySelector('#cracker-friend').hidden = !friend;
  document.querySelector('#cracker-share').hidden = friend;
  document.querySelector('#cracker-result-name').textContent = cracker.name;
  document.querySelector('#cracker-meaning').textContent = cracker.meaning;
  document.querySelector('#cracker-personality').textContent = cracker.personality;
  crackerResult.hidden = false;
  // The result shows its own running copy of the picked cracker.
  const stage = button.querySelector('.ck-stage').cloneNode(true);
  stage.querySelector('canvas')?.remove();
  stage.classList.remove('ck-live');
  document.querySelector('#cracker-result-art').replaceChildren(stage);
  crackerArt.unmount(resultArt);
  resultArt = crackerArt.mount(stage);
  crackerResult.classList.remove('is-new');
  void crackerResult.offsetWidth; // restart the fade-in for each pick
  crackerResult.classList.add('is-new');
  if (friend) return;
  crackerResult.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  track('cracker_pick', { cracker: id });
  prepareResultImage(id);
}
crackerButtons.forEach(button => button.addEventListener('click', () => pickCracker(button)));

// ---------------------------------------------------------------------------
// Sharing a quiz result: a picture of the result (1080 x 1350) plus a link that opens the page on the
// same result (?cracker=rocket#crackers). Phones open the share sheet only straight after a tap, so
// the picture is made when the cracker is picked and is ready by the time Share is tapped. Without
// picture sharing the link goes out on its own (share sheet, or WhatsApp on desktops).
// ---------------------------------------------------------------------------
const crackerShareButton = document.querySelector('#cracker-share');
const crackerShareStatus = document.querySelector('#cracker-share-status');
const resultLink = id => {
  const url = new URL(pageUrl());
  url.search = ''; // drop campaign tags and any earlier result
  url.searchParams.set('cracker', id);
  url.hash = 'crackers';
  return url.href;
};
const KANNADA = SITE.lang === 'kn';
const CARD_SERIF = '"Playfair Display", "Prajavani Text", Georgia, serif';
const CARD_SANS = '"DM Sans", "Prajavani Text", Arial, sans-serif';
let resultImage = { id: null, promise: null };
const loadPicture = src => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});
// The picked cracker's SVG as a stand-alone picture (with the shared gradients and parts), so its
// still sparks show.
function crackerPicture(id) {
  const art = document.querySelector(`.cracker[data-cracker="${id}"] svg.ck`);
  const defs = document.querySelector('.ck-defs')?.innerHTML || '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 120 120" width="600" height="600">${defs}${art.innerHTML}</svg>`;
  return loadPicture(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })));
}
function wrapLines(g, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
// The published address (the canonical link), printed on the picture.
const pageAddress = () => { const url = new URL(document.querySelector('link[rel="canonical"]')?.href || pageUrl()); return url.host.replace(/^www\./, '') + url.pathname; };
async function drawResultImage(id) {
  const cracker = CRACKERS[id];
  const W = 1080, H = 1350;
  const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = canvas.getContext('2d');
  const fonts = KANNADA ? ['600 60px "Prajavani Text"', '400 30px "Prajavani Text"'] : ['600 80px "Playfair Display"', '500 30px "DM Sans"', '600 30px "DM Sans"'];
  await Promise.all(fonts.map(font => document.fonts.load(font, KANNADA ? 'ಪಟಾಕಿ' : 'Cracker'))).catch(() => {});
  const [art, logo, sponsor] = await Promise.allSettled([crackerPicture(id), loadPicture(assetUrl(SITE.publisherLogo)), SITE.sponsorLogo ? loadPicture(assetUrl(SITE.sponsorLogo)) : Promise.reject(new Error('No sponsor'))]);
  // Night sky with a warm glow behind the cracker, and a few stars
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2a1d4d'); sky.addColorStop(0.55, '#171230'); sky.addColorStop(1, '#0d0a1c');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 470, 20, W / 2, 470, 420);
  glow.addColorStop(0, 'rgba(255, 196, 90, .38)'); glow.addColorStop(1, 'rgba(255, 159, 46, 0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  let seed = id.length * 97 + 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.fillStyle = '#fff';
  for (let i = 0; i < 70; i++) { g.globalAlpha = 0.25 + rand() * 0.6; g.beginPath(); g.arc(rand() * W, rand() * 760, 0.8 + rand() * 1.8, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  // Gold frame
  g.strokeStyle = '#e2b55a'; g.lineWidth = 6; g.strokeRect(28, 28, W - 56, H - 56);
  g.globalAlpha = 0.45; g.lineWidth = 2; g.strokeRect(44, 44, W - 88, H - 88); g.globalAlpha = 1;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  if (logo.value) { const h = 56, w = h * (logo.value.naturalWidth / logo.value.naturalHeight || 4); g.drawImage(logo.value, (W - w) / 2, 92, w, h); }
  g.fillStyle = '#f2c46d';
  g.font = `600 30px ${CARD_SANS}`;
  g.fillText(t('greeting.card.kicker', 'DEEPAVALI DEEPAMALE 2026'), W / 2, 210);
  if (art.value) { g.drawImage(art.value, W / 2 - 260, 230, 520, 520); URL.revokeObjectURL(art.value.src); }
  g.fillStyle = '#fff';
  g.font = `500 40px ${CARD_SANS}`;
  g.fillText(t('cracker.card.iam', 'This Deepavali I am'), W / 2, 820);
  g.fillStyle = '#ffd27a';
  let size = 92;
  do { g.font = `600 ${size}px ${CARD_SERIF}`; size -= 4; } while (g.measureText(cracker.name).width > W - 180 && size > 40);
  g.fillText(cracker.name, W / 2, 920);
  g.fillStyle = '#efe8ff';
  g.font = `400 ${KANNADA ? 34 : 36}px ${CARD_SANS}`;
  wrapLines(g, cracker.personality, W - 220).slice(0, 4).forEach((line, i) => g.fillText(line, W / 2, 1000 + i * 52));
  // Footer: the question and the page, with the sponsor's logo on a white chip
  const footerX = sponsor.value ? 92 : W / 2;
  g.textAlign = sponsor.value ? 'left' : 'center';
  g.fillStyle = '#f2c46d';
  g.font = `600 34px ${CARD_SANS}`;
  g.fillText(t('cracker.card.ask', 'Which cracker are you?'), footerX, 1222);
  g.fillStyle = '#c9bfe0';
  g.font = `500 26px ${CARD_SANS}`;
  g.fillText(pageAddress(), footerX, 1264);
  if (sponsor.value) {
    const h = 44, w = Math.min(200, h * (sponsor.value.naturalWidth / sponsor.value.naturalHeight || 4));
    g.fillStyle = '#fff';
    g.beginPath(); g.roundRect(W - 92 - w - 24, 1196, w + 24, h + 20, 10); g.fill();
    g.drawImage(sponsor.value, W - 92 - w - 12, 1206, w, h);
  }
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  return new File([blob], `deepavali-${id}.jpg`, { type: 'image/jpeg' });
}
function prepareResultImage(id) {
  if (resultImage.id === id) return resultImage.promise;
  const promise = drawResultImage(id).catch(() => null); // no picture: the link is shared alone
  resultImage = { id, promise };
  return promise;
}
window.DEEPAVALI_RESULT_IMAGE = prepareResultImage; // for checking the picture from the console
const canShareFiles = files => { try { return Boolean(navigator.canShare?.({ files })); } catch { return false; } };
crackerShareButton.addEventListener('click', async () => {
  const id = pickedCracker;
  if (!id) return;
  const url = resultLink(id);
  const text = t('cracker.share.text', 'This Deepavali I am {cracker}! Which cracker are you? Find out with {publisher}:', { cracker: CRACKERS[id].name, publisher: SITE.publisher });
  const title = t('cracker.share.title', 'Which Deepavali cracker are you?');
  // Use the picture only if it is already made, so the tap still counts for the share sheet.
  let file = null;
  await Promise.race([resultImage.promise?.then(made => { file = made; }), new Promise(resolve => setTimeout(resolve, 60))]);
  try {
    if (file && canShareFiles([file])) { await navigator.share({ files: [file], title, text: `${text} ${url}` }); return; }
    if (navigator.share) { await navigator.share({ title, text, url }); return; }
  } catch (error) {
    if (error.name === 'AbortError') return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener,noreferrer');
  crackerShareStatus.textContent = t('cracker.share.opened', 'WhatsApp opened in a new tab.');
});
// A shared result link (?cracker=rocket) opens the page on the friend's result.
const sharedCracker = new URLSearchParams(location.search).get('cracker');
const sharedButton = sharedCracker && crackerButtons.find(button => button.dataset.cracker === sharedCracker);
if (sharedButton) {
  pickCracker(sharedButton, { friend: true });
  track('cracker_shared_open', { cracker: sharedCracker });
}
// The crackers are animated only while the quiz is on screen.
const crackersSection = document.querySelector('.crackers');
new IntersectionObserver(([entry]) => crackerArt.play(entry.isIntersecting)).observe(crackersSection);

// ---------------------------------------------------------------------------
// Stories (dummy reference content until the editors' collection is ready)
// ---------------------------------------------------------------------------
const STORY_ICONS = {
  diya: '<svg viewBox="0 0 120 104" aria-hidden="true"><path d="M60 14C70 30 73 41 60 52 47 41 50 30 60 14Z" fill="#ffd27a"/><path d="M12 58Q60 63 108 58 103 92 60 94 17 92 12 58Z" fill="#f2c46d" opacity=".9"/></svg>',
  rangoli: '<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#f2c46d" stroke-width="3"><circle cx="50" cy="50" r="10"/><circle cx="50" cy="50" r="24"/><path d="M50 10l8 16H42zM50 90l-8-16h16zM10 50l16-8v16zM90 50l-16 8V42z" fill="#f2c46d" stroke="none"/></svg>',
  lantern: '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4v14" stroke="#f2c46d" stroke-width="3"/><path d="M50 18l26 30-26 30-26-30z" fill="#f2c46d"/><path d="M42 80h16l-3 14h-10z" fill="#ffd27a"/></svg>',
  sweets: '<svg viewBox="0 0 100 100" aria-hidden="true" fill="#f2c46d"><circle cx="32" cy="58" r="16"/><circle cx="68" cy="58" r="16"/><circle cx="50" cy="34" r="16" fill="#ffd27a"/></svg>',
  sparkle: '<svg viewBox="0 0 100 100" aria-hidden="true" fill="#f2c46d"><path d="M50 6l9 35 35 9-35 9-9 35-9-35-35-9 35-9z"/></svg>'
};
const storyGrid = document.querySelector('#story-grid');
function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat(SITE.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(`${iso}T12:00:00+05:30`));
}
function storyCard(story) {
  const card = document.createElement('a');
  card.className = 'story-card';
  card.href = story.url || '#';
  if (story.url && story.url !== '#') { card.target = '_blank'; card.rel = 'noopener noreferrer'; }
  const art = document.createElement('div');
  art.className = 'story-art';
  art.style.setProperty('--art', story.colour || '#2a2140');
  art.innerHTML = STORY_ICONS[story.icon] || STORY_ICONS.diya;
  if (story.heroImageKey) {
    const img = Object.assign(document.createElement('img'), { alt: '', loading: 'lazy', decoding: 'async', width: 640, height: 427 });
    const src = width => `https://cf-images.assettype.com/${story.heroImageKey}?w=${width}&ar=3:2&auto=format`;
    img.src = src(640);
    img.srcset = `${src(400)} 400w, ${src(640)} 640w, ${src(960)} 960w`;
    img.sizes = '(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw';
    img.addEventListener('error', () => img.remove()); // the diya icon underneath shows instead
    art.append(img);
  }
  const category = Object.assign(document.createElement('p'), { className: 'story-category', textContent: story.category });
  const headline = Object.assign(document.createElement('h3'), { textContent: story.headline });
  const date = Object.assign(document.createElement('p'), { className: 'story-date', textContent: formatDate(story.publishedDate) });
  card.append(art, category, headline, date);
  return card;
}
// Stories come live from Prajavani's Quintype API: one tag search per SITE.storyTags (up to
// SITE.storyFetch each), merged, without duplicates, newest first. The API has no CORS, so this works
// only when the page is served from prajavani.net (same-site /api/v1, as on the Dasara page). Anywhere
// else, or if nothing comes back, the section shows an empty state that links to Prajavani's tag page.
// The home page shows the first SITE.storyCount; "See all" opens the All stories view with pages.
const PUBLISHER_HOST = new URL(SITE.publisherUrl).hostname;
const publisherLink = href => {
  try {
    const url = new URL(href, SITE.publisherUrl);
    return url.protocol === 'https:' && url.hostname === PUBLISHER_HOST ? url.href : null;
  } catch { return null; }
};
const fromSearch = story => ({
  id: story.id,
  headline: story.headline,
  url: publisherLink(story.url || story.slug),
  category: story.sections?.[0]?.['display-name'] || story.sections?.[0]?.name || '',
  publishedDate: story['published-at'] ? new Date(story['published-at'] + 5.5 * 3600000).toISOString().slice(0, 10) : '',
  published: story['published-at'] || 0,
  heroImageKey: story['hero-image-s3-key']
});
function loadTaggedStories() {
  const fields = 'id,headline,url,slug,sections,hero-image-s3-key,published-at';
  const search = tag => fetch(`/api/v1/search?tag-name=${encodeURIComponent(tag)}&sort=latest-published&limit=${SITE.storyFetch}&fields=${fields}`, { signal: AbortSignal.timeout(8000) })
    .then(response => (response.ok ? response.json() : Promise.reject(new Error(`Tag ${tag} unavailable`))))
    .then(data => (data.results?.stories || []).map(fromSearch));
  return Promise.allSettled(SITE.storyTags.map(search)).then(results => {
    const seen = new Set();
    return results.flatMap(result => (result.status === 'fulfilled' ? result.value : []))
      .filter(story => story.url && story.headline && !seen.has(story.id) && seen.add(story.id))
      .sort((a, b) => b.published - a.published);
  });
}
// Shown when there are no stories (off the publisher's site, the API failed, or no tagged stories yet).
function storiesEmptyState() {
  const box = Object.assign(document.createElement('div'), { className: 'story-empty' });
  box.innerHTML = STORY_ICONS.diya;
  const title = Object.assign(document.createElement('h3'), { textContent: t('stories.empty.title', 'Deepavali stories are on their way') });
  const text = Object.assign(document.createElement('p'), { textContent: t('stories.empty.text', 'Festive reads from {publisher} will appear here soon. Until then, catch up on the latest Deepavali news.', brand) });
  const link = Object.assign(document.createElement('a'), {
    className: 'button button-dark', href: `${SITE.publisherUrl}tags/${SITE.storyTagPage}`, target: '_blank', rel: 'noopener noreferrer',
    innerHTML: `${t('stories.empty.link', 'Read Deepavali news')} <span aria-hidden="true">↗</span>`
  });
  link.dataset.track = 'stories_empty_tag_page';
  box.append(title, text, link);
  return box;
}

let allStories = [];
const storiesMore = document.querySelector('#stories-more');
loadTaggedStories()
  .catch(() => [])
  .then(stories => {
    allStories = stories;
    storyGrid.dataset.source = stories.length ? 'api' : 'empty';
    storyGrid.replaceChildren(...(stories.length ? stories.slice(0, SITE.storyCount).map(storyCard) : [storiesEmptyState()]));
    storiesMore.hidden = stories.length <= SITE.storyCount;
    if (location.hash === '#all-stories' && stories.length) openAllStories(false);
  });

// ---------------------------------------------------------------------------
// All stories view: a page mode under the same header, with numbered pages of SITE.storyPage
// stories. It has its own address (#all-stories) and closes with Back; header and menu links close it
// and go to their section.
// ---------------------------------------------------------------------------
const allView = document.querySelector('#all-stories');
const allGrid = document.querySelector('#all-stories-grid');
const allPager = document.querySelector('#all-stories-pager');
const allTitle = document.querySelector('#all-stories-title');
const allOpenButton = document.querySelector('#stories-all');
let allPage = 1;
let homeScroll = 0;
const pageCount = () => Math.max(1, Math.ceil(allStories.length / SITE.storyPage));
// Page numbers to show: the first, the last and two either side of the current one, with gaps as null.
function pageList(current, total) {
  const pages = [];
  for (let n = 1; n <= total; n++) {
    if (n === 1 || n === total || Math.abs(n - current) <= 2) pages.push(n);
    else if (pages[pages.length - 1] !== null) pages.push(null);
  }
  return pages;
}
function pagerButton(label, page, { current = false, disabled = false, aria } = {}) {
  const button = Object.assign(document.createElement('button'), { type: 'button', className: 'pager-btn', innerHTML: label, disabled });
  if (aria) button.setAttribute('aria-label', aria);
  if (current) { button.setAttribute('aria-current', 'page'); button.classList.add('is-current'); }
  button.addEventListener('click', () => showAllPage(page, true));
  return button;
}
function renderAllPage() {
  const total = pageCount();
  const start = (allPage - 1) * SITE.storyPage;
  allGrid.replaceChildren(...allStories.slice(start, start + SITE.storyPage).map(storyCard));
  document.querySelector('#all-stories-count').textContent = t('stories.pageOf', 'Page {page} of {total} · {count} stories', { page: allPage, total, count: allStories.length });
  allPager.hidden = total < 2;
  const items = [pagerButton(`<span aria-hidden="true">←</span> ${t('stories.prev', 'Previous')}`, allPage - 1, { disabled: allPage === 1 })];
  pageList(allPage, total).forEach(page => items.push(page === null
    ? Object.assign(document.createElement('span'), { className: 'pager-gap', textContent: '…' })
    : pagerButton(String(page), page, { current: page === allPage, aria: t('stories.pageLabel', 'Page {page}', { page }) })));
  items.push(pagerButton(`${t('stories.next', 'Next')} <span aria-hidden="true">→</span>`, allPage + 1, { disabled: allPage === total }));
  allPager.replaceChildren(...items);
}
function showAllPage(page, fromPager = false) {
  allPage = Math.min(Math.max(1, page), pageCount());
  renderAllPage();
  if (history.state?.allStories) history.replaceState({ ...history.state, page: allPage }, '');
  if (fromPager) {
    allView.scrollIntoView({ behavior: 'instant' });
    allTitle.focus({ preventScroll: true });
    track('stories_page', { page: allPage });
  }
}
function openAllStories(push = true) {
  if (!allView.hidden || !allStories.length) return;
  homeScroll = scrollY;
  allView.hidden = false;
  document.body.classList.add('all-stories-open');
  markSection();
  if (push) history.pushState({ allStories: true, page: 1 }, '', '#all-stories');
  showAllPage(history.state?.page || 1);
  scrollTo({ top: 0, behavior: 'instant' });
  allTitle.focus({ preventScroll: true });
  track('stories_view_all');
}
function closeAllStories(target = null) {
  if (allView.hidden) return;
  allView.hidden = true;
  document.body.classList.remove('all-stories-open');
  markSection();
  if (target) target.scrollIntoView({ behavior: 'instant' }); // after the home sections reappear
  else { scrollTo({ top: homeScroll, behavior: 'instant' }); allOpenButton.focus({ preventScroll: true }); }
}
allOpenButton.addEventListener('click', () => openAllStories());
document.querySelector('#all-stories-close').addEventListener('click', () => {
  if (history.state?.allStories) { history.back(); return; } // popstate closes the view
  history.replaceState(null, '', location.pathname + location.search);
  closeAllStories();
});
// Back and Forward, and header or menu links (which change the hash) while the view is open.
const followHash = () => {
  if (location.hash === '#all-stories') { openAllStories(false); return; }
  closeAllStories(location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null);
};
addEventListener('popstate', followHash);
addEventListener('hashchange', followHash);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !allView.hidden && siteMenu.hidden) document.querySelector('#all-stories-close').click(); });

// ---------------------------------------------------------------------------
// Ad slots: a slot names its desktop (1024px and up) and phone/tablet sizes and shows the sponsor's
// creatives (SITE.creativeSets), or a labelled placeholder at the exact size if a size has none.
// As on the Dasara page, every banner shows one campaign set and they all swap together every
// SET_SECONDS; neighbouring banners start on different sets, and each links to its set's page.
// ---------------------------------------------------------------------------
const DESKTOP = matchMedia('(min-width: 1024px)');
const SET_SECONDS = 10;
let setTick = 0;
function showSet(unit, size, offset) {
  const sets = SITE.creativeSets.filter(item => item.images[size]);
  const set = sets[(setTick + offset) % sets.length];
  unit.href = set.url;
  unit.dataset.track = `banner_${size}_${set.id}`;
  const img = unit.querySelector('img');
  if (img.getAttribute('src') !== set.images[size]) img.src = set.images[size];
}
function fillAdSlot(slot, index) {
  const size = DESKTOP.matches ? slot.dataset.adDesktop : slot.dataset.adMobile;
  slot.hidden = !size;
  if (!size || slot.dataset.size === size) return;
  slot.dataset.size = size;
  const [width, height] = size.split('x').map(Number);
  const label = Object.assign(document.createElement('span'), { className: 'ad-label', textContent: t('ad.label', 'Advertisement') });
  let unit;
  if (SITE.creativeSets?.some(item => item.images[size])) {
    unit = Object.assign(document.createElement('a'), { className: 'ad-creative', target: '_blank', rel: 'noopener noreferrer sponsored' });
    unit.append(Object.assign(document.createElement('img'), { width, height, alt: SITE.sponsor, loading: 'lazy' }));
    showSet(unit, size, index);
  } else {
    unit = Object.assign(document.createElement('div'), { className: 'ad-box', textContent: `${width} × ${height}` });
    unit.style.width = `${width}px`;
    unit.style.height = `${height}px`;
  }
  slot.replaceChildren(label, unit);
}
const fillAdSlots = () => document.querySelectorAll('.ad-slot').forEach(fillAdSlot);
fillAdSlots();
DESKTOP.addEventListener('change', fillAdSlots);
setInterval(() => {
  if (document.hidden) return;
  setTick += 1;
  document.querySelectorAll('.ad-slot').forEach((slot, index) => {
    const unit = slot.querySelector('.ad-creative');
    if (unit) showSet(unit, slot.dataset.size, index);
  });
}, SET_SECONDS * 1000);

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------
const shareText = t('share.text', 'Which Deepavali cracker are you? Find out and make your own greeting card with {publisher}.', brand);
document.querySelector('#share-whatsapp').href = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl()}`)}`;
document.querySelector('#share-facebook').href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`;
document.querySelector('#share-x').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl())}`;
const nativeShare = document.querySelector('#share-native');
if (navigator.share) {
  nativeShare.hidden = false;
  nativeShare.addEventListener('click', () => navigator.share({ title: document.title, text: shareText, url: pageUrl() }).catch(() => {}));
}
const copyButton = document.querySelector('#share-copy');
const shareStatus = document.querySelector('#share-status');
copyButton.addEventListener('click', async () => {
  let copied = false;
  try { await navigator.clipboard.writeText(pageUrl()); copied = true; } catch { /* clipboard blocked */ }
  copyButton.textContent = copied ? t('share.copied', 'Link copied ✓') : t('share.copyFailed', 'Copy failed');
  shareStatus.textContent = copied ? t('share.copiedStatus', 'Link copied to clipboard') : t('share.copyFailedStatus', 'Could not copy the link');
  setTimeout(() => { copyButton.textContent = t('share.copy', 'Copy link'); }, 2000);
});

// ---------------------------------------------------------------------------
// Sections fade in as they scroll into view
// ---------------------------------------------------------------------------
const revealer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('is-visible');
  revealer.unobserve(entry.target);
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(section => revealer.observe(section));
