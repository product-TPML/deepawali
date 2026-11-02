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
  publisherLogo: 'site/assets/prajavani-white.svg',
  sponsor: 'Sponsor',
  sponsorUrl: '#',
  sponsorLogo: '', // sponsor's logo URL once supplied; until then a labelled placeholder is shown
  sponsorOnLight: true,
  creativeSets: null, // [{ id, url, images: { '970x250': url, ... } }] once the banners arrive
  storiesFile: 'content/deepavali-stories.json', // dummy reference stories
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
document.addEventListener('click', event => {
  const tracked = event.target.closest('[data-track]');
  if (tracked) track(tracked.dataset.track);
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
  const current = navSections.find(section => visibleSections.has(section))?.id || 'home';
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
let running = false;
let heroVisible = false;
let ratio = 1;
let sceneScale = 1;
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

function startLoop() {
  if (!running) { running = true; requestAnimationFrame(step); }
}
// Without an aim the particles spread in a full circle (a burst); with one, in a narrow cone (a fountain).
function addParticles(x, y, count, { speed, life, size, aim, colours = COLOURS }) {
  const colour = colours[Math.floor(Math.random() * colours.length)];
  for (let i = 0; i < count; i++) {
    const angle = aim === undefined ? (Math.PI * 2 * i) / count + Math.random() * 0.2 : aim + (Math.random() - 0.5) * 0.7;
    const velocity = speed * (0.55 + Math.random() * 0.45);
    particles.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life, max: life, size, colour: Math.random() < 0.8 ? colour : '#fff' });
  }
  startLoop();
}
function burst(x, y) {
  const scale = Math.min(1, fireworks.logicalSize.width / 900) * 0.6 + 0.4;
  addParticles(x, y, 70, { speed: 4.6 * scale, life: 70, size: 2.2 });
}
// A rocket rises from the lane, slowing as it climbs, and bursts at the top.
function launch(x, targetY) {
  if (reducedMotion || document.hidden) return;
  const { width, height } = fireworks.logicalSize;
  const startY = height - 20;
  const top = targetY ?? height * (0.12 + Math.random() * 0.26);
  const distance = Math.max(60, startY - top);
  rockets.push({ x: x ?? width * (0.08 + Math.random() * 0.84), y: startY, vx: (Math.random() - 0.5) * 0.6, vy: -Math.sqrt(2 * 0.09 * distance) });
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
  for (; ladiPopped < popped; ladiPopped++) {
    const cracker = ladi[ladiPopped];
    const { x, y } = pointOf(cracker, box);
    cracker.classList.add('is-popped');
    addParticles(x, y, 14, { speed: 2.2 * sceneScale, life: 16, size: 1.3, colours: ['#fff', '#ffe6a3', '#ff9f2e'] });
  }
}
function step() {
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
    if (rocket.vy >= -0.4) { rocket.done = true; burst(rocket.x, rocket.y); }
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
    fx.beginPath();
    fx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fx.fill();
  }
  fx.globalAlpha = 1;
  fx.globalCompositeOperation = 'source-over';
  if (heroVisible || particles.length || rockets.length) requestAnimationFrame(step);
  else { running = false; fx.clearRect(0, 0, width, height); }
}

// Sky shots every 1.5 to 3 seconds (sometimes two together) while the hero is on screen.
let rocketTimer = 0;
function scheduleRockets() {
  clearTimeout(rocketTimer);
  rocketTimer = setTimeout(() => {
    launch();
    if (Math.random() < 0.3) setTimeout(() => launch(), 250);
    scheduleRockets();
  }, 1500 + Math.random() * 1500);
}
new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting && !reducedMotion;
  hero.classList.toggle('is-playing', entry.isIntersecting);
  if (heroVisible) { startLoop(); launch(); scheduleRockets(); } else clearTimeout(rocketTimer);
}).observe(hero);
// A tap on the sky sends a rocket up to that spot (the text above lets taps through).
hero.addEventListener('pointerdown', event => {
  if (reducedMotion || event.target.closest('a, button')) return;
  const box = fireworks.getBoundingClientRect();
  launch(event.clientX - box.left, event.clientY - box.top);
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
const crackerButtons = [...document.querySelectorAll('.cracker')];
const crackerResult = document.querySelector('#cracker-result');
function pickCracker(button) {
  const cracker = CRACKERS[button.dataset.cracker];
  crackerButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  document.querySelector('#cracker-result-art').innerHTML = button.querySelector('svg').outerHTML;
  document.querySelector('#cracker-result-name').textContent = cracker.name;
  document.querySelector('#cracker-meaning').textContent = cracker.meaning;
  document.querySelector('#cracker-personality').textContent = cracker.personality;
  crackerResult.hidden = false;
  crackerResult.classList.remove('is-new');
  void crackerResult.offsetWidth; // restart the fade-in for each pick
  crackerResult.classList.add('is-new');
  crackerResult.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
  track('cracker_pick', { cracker: button.dataset.cracker });
}
crackerButtons.forEach(button => button.addEventListener('click', () => pickCracker(button)));

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
  const category = Object.assign(document.createElement('p'), { className: 'story-category', textContent: story.category });
  const headline = Object.assign(document.createElement('h3'), { textContent: story.headline });
  const date = Object.assign(document.createElement('p'), { className: 'story-date', textContent: formatDate(story.publishedDate) });
  card.append(art, category, headline, date);
  return card;
}
fetch(assetUrl(SITE.storiesFile))
  .then(response => (response.ok ? response.json() : Promise.reject(new Error('Stories unavailable'))))
  .then(({ stories }) => storyGrid.replaceChildren(...stories.map(storyCard)))
  .catch(() => storyGrid.replaceChildren(Object.assign(document.createElement('p'), { className: 'story-status', textContent: t('stories.error', 'Stories could not be loaded.') })));

// ---------------------------------------------------------------------------
// Ad slots: a slot names its desktop (1024px and up) and phone/tablet sizes. Until the sponsor's
// creatives arrive (SITE.creativeSets), each shows a labelled placeholder at the exact size.
// ---------------------------------------------------------------------------
const DESKTOP = matchMedia('(min-width: 1024px)');
function fillAdSlot(slot) {
  const size = DESKTOP.matches ? slot.dataset.adDesktop : slot.dataset.adMobile;
  slot.hidden = !size;
  if (!size || slot.dataset.size === size) return;
  slot.dataset.size = size;
  const [width, height] = size.split('x').map(Number);
  const label = Object.assign(document.createElement('span'), { className: 'ad-label', textContent: t('ad.label', 'Advertisement') });
  const set = SITE.creativeSets?.find(item => item.images[size]);
  let unit;
  if (set) {
    unit = Object.assign(document.createElement('a'), { className: 'ad-creative', href: set.url, target: '_blank', rel: 'noopener noreferrer sponsored' });
    unit.dataset.track = `banner_${size}`;
    const img = Object.assign(document.createElement('img'), { src: set.images[size], width, height, alt: SITE.sponsor, loading: 'lazy' });
    unit.append(img);
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
