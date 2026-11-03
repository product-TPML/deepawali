// Deepavali greeting card, reused from the Dasara greeting card (see Dasara/GREETING_PLAN.md).
// Runs entirely in the browser: the photo is never uploaded or stored.

// Artwork is loaded from wherever this module is served (Cloudflare Pages), with CORS, so the card
// canvas can still be exported when the page itself is on deccanherald.com.
const ASSET_BASE = new URL('../', import.meta.url).href;
// Edition settings and strings from main.js (it runs first: deferred scripts and modules run in
// document order). The English fallbacks below are the Deccan Herald edition.
const { SITE, t, brand } = window.DASARA;
const KANNADA = SITE.lang === 'kn';
// Canvas fonts: Prajavani's text font fills in Kannada letters (used only on the Kannada edition).
const SERIF = '"Playfair Display", "Prajavani Text", Georgia, serif';
const SANS = '"DM Sans", "Prajavani Text", Arial, sans-serif';
const ITALIC = KANNADA ? '' : 'italic '; // Kannada has no italic; a slanted fallback looks broken
const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1';
const FACE_MODEL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
// Labels each pixel: 0 background, 1 hair, 2 body skin, 3 face skin, 4 clothes, 5 other. About 16 MB, loaded on demand.
// Pinned to version 1 (not 'latest') so a new model can't change the cut-out without a code change.
const SEGMENT_MODEL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/1/selfie_multiclass_256x256.tflite';
const STICKER_SCALE = 1.5; // sticker heads get extra room around the face for hair
const STICKER_FACE_BOOST = 1.25; // a cut-out head reads smaller than an oval photo, so enlarge the face
const STICKER_BORDER = 18; // white border, in head-canvas pixels (2x card pixels)
const SIZE = 1080; // card width
const CARD_H = 1350; // card height: 4:5 portrait, a standard feed size and bigger on phones
const SCENE_Y = 150; // the character scene is drawn this far down the card
const BODY_BOTTOM = 1110; // bodies extend below the band, in scene coordinates
const HEAD = { x: 540, y: 500, w: 440, h: 520 }; // the "big head" oval on the card
const BAND_TOP = CARD_H - 112; // bottom band with greeting and logos
const MAROON = '#741e27';
const GOLD = '#e2b55a';

const canvas = document.querySelector('#greeting-canvas');
let ctx = canvas.getContext('2d'); // switched to a layer's context while that layer is drawn
const photoInput = document.querySelector('#greeting-photo');
const nameInput = document.querySelector('#greeting-name');
const statusLine = document.querySelector('#greeting-status');
const shareButton = document.querySelector('#greeting-share');
const downloadButton = document.querySelector('#greeting-download');
const outfitInputs = [...document.querySelectorAll('input[name="greeting-outfit"]')];
const poseInputs = [...document.querySelectorAll('input[name="greeting-pose"]')];
const sceneInputs = [...document.querySelectorAll('input[name="greeting-scene"]')];

// Outfits (artwork in site/assets/deepavali/, made by tools/build-art.py) and card backgrounds.
const OUTFITS = ['kurta', 'panche', 'saree', 'langa'];
const POSES = ['namaste', 'wave'];
const SCENES = ['doorstep', 'night-sky', 'fireworks', 'lakshmi-puja', 'balipadyami'];
const perOutfit = value => Object.fromEntries(OUTFITS.map(outfit => [outfit, typeof value === 'function' ? value() : value]));
const freshOffsets = () => perOutfit(() => ({ x: 0, y: 0 }));
const freshPhoto = () => ({ x: 0, y: 0, zoom: 1, angle: 0 });
const freshScales = () => perOutfit(1);
const freshAngles = () => perOutfit(0);
// work/box: the downscaled photo and detected face box; photo: pan (card px) and zoom inside the head oval.
const state = { logos: {}, outfit: 'kurta', pose: 'namaste', scene: 'doorstep', name: '', head: null, skin: '#c68a5e', background: null, work: null, cutout: null, box: null, photo: freshPhoto(), offsets: freshOffsets(), scales: freshScales(), angles: freshAngles(), selected: null };
// Draggable areas of the head accessories, in card pixels before any offset. The saree and langa
// davani come with mallige (jasmine) in the hair; the Dasara peta is not part of the Deepavali card.
const MALLIGE_BOUNDS = { left: 590, top: 225, right: 800, bottom: 565 };
const ACCESSORY_BOUNDS = { saree: MALLIGE_BOUNDS, langa: MALLIGE_BOUNDS };
// Accessories resize around these points so they grow in place.
const ACCESSORY_ANCHOR = { saree: { x: 695, y: 395 }, langa: { x: 695, y: 395 } };
const hasAccessory = () => state.outfit in ACCESSORY_BOUNDS;
let photoToken = 0;
const useSticker = () => Boolean(state.cutout);

function setStatus(message, busy = false) {
  statusLine.textContent = message;
  statusLine.classList.toggle('is-busy', busy);
}

// ---------------------------------------------------------------------------
// Face detection (MediaPipe, loaded only after a photo is chosen)
// ---------------------------------------------------------------------------
let visionPromise;
let detectorPromise;
let segmenterPromise;
function getVision() {
  if (!visionPromise) {
    visionPromise = (async () => {
      const vision = await import(`${MEDIAPIPE}/vision_bundle.mjs`);
      const files = await vision.FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);
      return { vision, files };
    })();
    visionPromise.catch(() => { visionPromise = undefined; }); // allow a retry on the next photo
  }
  return visionPromise;
}
function getDetector() {
  if (!detectorPromise) {
    detectorPromise = getVision().then(({ vision, files }) => vision.FaceDetector.createFromOptions(files, { baseOptions: { modelAssetPath: FACE_MODEL }, runningMode: 'IMAGE', minDetectionConfidence: 0.3 })); // low, to also find neighbours in group photos
    detectorPromise.catch(() => { detectorPromise = undefined; });
  }
  return detectorPromise;
}
function getSegmenter() {
  if (!segmenterPromise) {
    segmenterPromise = getVision().then(({ vision, files }) => vision.ImageSegmenter.createFromOptions(files, { baseOptions: { modelAssetPath: SEGMENT_MODEL }, runningMode: 'IMAGE', outputCategoryMask: true, outputConfidenceMasks: true }));
    segmenterPromise.catch(() => { segmenterPromise = undefined; });
  }
  return segmenterPromise;
}

// Cut out the head (hair + face) that contains the detected face. Other people in the photo
// are dropped, and enclosed gaps such as glasses or eyes are filled. Returns null when the cut
// is unreliable, so the card falls back to the oval frame.
// Touching heads in group photos are separated two ways: the cut stays inside a head-shaped
// region around the chosen face, and pixels nearer another detected face are left out.
function cutHead(work, box, result, otherFaces = []) {
  const category = result.categoryMask;
  const confidences = result.confidenceMasks;
  if (!category || !confidences || confidences.length < 4) return null;
  const w = category.width;
  const h = category.height;
  const labels = category.getAsUint8Array();
  const hair = confidences[1].getAsFloat32Array();
  const face = confidences[3].getAsFloat32Array();
  const sx = w / work.width;
  const sy = h / work.height;
  const centreOf = face => ({ x: (face.originX + face.width / 2) * sx, y: (face.originY + face.height * 0.35) * sy, w: face.width * sx, h: face.height * sy });
  const own = centreOf(box);
  const others = otherFaces.map(centreOf);
  const reach = (point, face) => ((point.x - face.x) / face.w) ** 2 + ((point.y - face.y) / face.h) ** 2;
  const faceLeft = box.originX * sx;
  const faceTop = box.originY * sy;
  const faceWidth = box.width * sx;
  const faceHeight = box.height * sy;
  const isHead = i => {
    const label = labels[i];
    if (label !== 1 && label !== 3) return false;
    const point = { x: i % w, y: Math.floor(i / w) };
    // Face skin stays near the detected face (ears, chin), so touching neighbours' faces are cut off.
    if (label === 3 && (point.x < faceLeft - 0.2 * faceWidth || point.x > faceLeft + 1.2 * faceWidth
      || point.y < faceTop - 0.35 * faceHeight || point.y > faceTop + 1.15 * faceHeight)) return false;
    // Hair stays near the face: a little wider above the eyes, hugging the sides below them.
    const below = point.y >= faceTop + 0.3 * faceHeight;
    const spread = below ? 0.3 : 0.45;
    if (label === 1 && (point.x < faceLeft - spread * faceWidth || point.x > faceLeft + (1 + spread) * faceWidth
      || (below && point.y > faceTop + 1.2 * faceHeight))) return false;
    const mine = reach(point, own);
    if (mine > 0.85 * 0.85 * (point.y < own.y ? 1.6 : 1)) return false; // head-shaped limit, taller above for hair
    return others.every(face => reach(point, face) > mine);
  };

  // Seed: the head pixel nearest the centre of the detected face.
  const x0 = Math.max(0, Math.floor(box.originX * sx));
  const x1 = Math.min(w - 1, Math.ceil((box.originX + box.width) * sx));
  const y0 = Math.max(0, Math.floor(box.originY * sy));
  const y1 = Math.min(h - 1, Math.ceil((box.originY + box.height) * sy));
  const cx = (box.originX + box.width / 2) * sx;
  const cy = (box.originY + box.height / 2) * sy;
  const isFace = i => labels[i] === 3 && isHead(i);
  let seed = -1;
  let best = Infinity;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < best && isFace(i)) { best = d; seed = i; }
    }
  }
  if (seed < 0) return null;

  const stack = new Int32Array(w * h);
  const flood = (marks, start, allowed) => {
    let top = 0;
    let count = 0;
    for (const i of start) { if (!marks[i] && allowed(i)) { marks[i] = 1; stack[top++] = i; } }
    while (top) {
      const i = stack[--top];
      count++;
      const x = i % w;
      if (x > 0 && !marks[i - 1] && allowed(i - 1)) { marks[i - 1] = 1; stack[top++] = i - 1; }
      if (x < w - 1 && !marks[i + 1] && allowed(i + 1)) { marks[i + 1] = 1; stack[top++] = i + 1; }
      if (i >= w && !marks[i - w] && allowed(i - w)) { marks[i - w] = 1; stack[top++] = i - w; }
      if (i < w * (h - 1) && !marks[i + w] && allowed(i + w)) { marks[i + w] = 1; stack[top++] = i + w; }
    }
    return count;
  };
  // Only this person's face skin counts, so a neighbour's face never joins through shared hair.
  const ownFace = new Uint8Array(w * h);
  flood(ownFace, [seed], isFace);
  const keep = new Uint8Array(w * h);
  const area = flood(keep, [seed], i => ownFace[i] || (labels[i] === 1 && isHead(i)));
  if (area < (x1 - x0) * (y1 - y0) * 0.35) return null; // too little head found to trust

  const border = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  const outside = new Uint8Array(w * h);
  flood(outside, border, i => !keep[i]);

  const mask = document.createElement('canvas');
  mask.width = w;
  mask.height = h;
  const maskCtx = mask.getContext('2d');
  const image = maskCtx.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    let alpha = 0;
    if (keep[i]) alpha = Math.min(1, Math.max(0.5, (hair[i] + face[i] - 0.25) / 0.5));
    else if (!outside[i]) alpha = 1; // enclosed gap
    if (alpha) {
      const o = i * 4;
      image.data[o] = image.data[o + 1] = image.data[o + 2] = 255;
      image.data[o + 3] = Math.round(alpha * 255);
    }
  }
  maskCtx.putImageData(image, 0, 0);

  const cut = document.createElement('canvas');
  cut.width = work.width;
  cut.height = work.height;
  const cutCtx = cut.getContext('2d');
  cutCtx.drawImage(work, 0, 0);
  cutCtx.globalCompositeOperation = 'destination-in';
  cutCtx.imageSmoothingQuality = 'high';
  cutCtx.drawImage(mask, 0, 0, work.width, work.height); // smooth upscale softens the edge
  return cut;
}

async function loadImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Crop a generous region around the face (hair above, chin below) into a soft-edged oval,
// applying the visitor's pan and zoom.
// Reused drawing surfaces for the sticker border, so dragging and zooming stay smooth.
const stickerFace = document.createElement('canvas');
const stickerSilhouette = document.createElement('canvas');
const STICKER_STEPS = 16;
function sizeLayer(layer, width, height) {
  if (layer.width !== width || layer.height !== height) {
    layer.width = width;
    layer.height = height;
  }
  const layerCtx = layer.getContext('2d');
  layerCtx.globalCompositeOperation = 'source-over';
  layerCtx.clearRect(0, 0, width, height);
  return layerCtx;
}

function buildHead(source, box, photo) {
  const sticker = useSticker();
  const scale = sticker ? STICKER_SCALE : 1;
  const width = HEAD.w * 2 * scale;
  const height = HEAD.h * 2 * scale;
  const cropHeight = (box.height * 2 * scale) / (photo.zoom * (sticker ? STICKER_FACE_BOOST : 1));
  const cropWidth = cropHeight * (width / height);
  const sourcePerCardPixel = cropHeight / (HEAD.h * scale); // the head canvas spans HEAD.h * scale card pixels
  const centerX = box.originX + box.width / 2 - photo.x * sourcePerCardPixel;
  const centerY = box.originY + box.height * 0.25 - photo.y * sourcePerCardPixel;
  const left = centerX - cropWidth / 2;
  const top = centerY - cropHeight / 2;
  const head = document.createElement('canvas');
  head.width = width;
  head.height = height;
  const headCtx = head.getContext('2d');
  if (sticker) {
    sizeLayer(stickerFace, width, height).drawImage(state.cutout, left, top, cropWidth, cropHeight, 0, 0, width, height);
    // White sticker border: a white silhouette stamped in a ring around the cutout.
    const silhouetteCtx = sizeLayer(stickerSilhouette, width, height);
    silhouetteCtx.drawImage(stickerFace, 0, 0);
    silhouetteCtx.globalCompositeOperation = 'source-in';
    silhouetteCtx.fillStyle = '#fff';
    silhouetteCtx.fillRect(0, 0, width, height);
    for (let step = 0; step < STICKER_STEPS; step++) {
      const angle = (step / STICKER_STEPS) * Math.PI * 2;
      headCtx.drawImage(stickerSilhouette, Math.cos(angle) * STICKER_BORDER, Math.sin(angle) * STICKER_BORDER);
    }
    headCtx.drawImage(stickerFace, 0, 0);
    return head;
  }
  headCtx.drawImage(source, left, top, cropWidth, cropHeight, 0, 0, width, height);
  headCtx.globalCompositeOperation = 'destination-in';
  headCtx.translate(width / 2, height / 2);
  headCtx.scale(1, height / width);
  const fade = headCtx.createRadialGradient(0, 0, 0, 0, 0, width / 2);
  fade.addColorStop(0, '#000');
  fade.addColorStop(0.86, '#000');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  headCtx.fillStyle = fade;
  headCtx.fillRect(-width / 2, -width / 2, width, width);
  return head;
}

// Estimate skin tone from both cheeks so the illustrated neck and hands match the face.
// Pixels are sorted by brightness and the lighter-middle band is averaged, which ignores
// beard, shadow and specular highlights.
function sampleSkin(source, box) {
  const sourceCtx = source.getContext('2d', { willReadFrequently: true });
  const size = Math.max(4, Math.round(box.width * 0.14));
  const pixels = [];
  for (const side of [-0.22, 0.22]) {
    const x = Math.round(box.originX + box.width * (0.5 + side) - size / 2);
    const y = Math.round(box.originY + box.height * 0.55 - size / 2);
    try {
      const { data } = sourceCtx.getImageData(Math.max(0, x), Math.max(0, y), size, size);
      for (let i = 0; i < data.length; i += 4) pixels.push([data[i], data[i + 1], data[i + 2]]);
    } catch { /* outside the image */ }
  }
  if (!pixels.length) return '#c68a5e';
  pixels.sort((p, q) => (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11) - (q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11));
  const band = pixels.slice(Math.floor(pixels.length * 0.4), Math.max(Math.floor(pixels.length * 0.9), Math.floor(pixels.length * 0.4) + 1));
  const mean = channel => Math.round(band.reduce((sum, pixel) => sum + pixel[channel], 0) / band.length);
  return `rgb(${mean(0)},${mean(1)},${mean(2)})`;
}

async function handlePhoto(file) {
  let img;
  try {
    img = await loadImage(file);
  } catch {
    setStatus(t('greeting.status.badPhoto', 'We couldn’t open that photo. Please try a JPG or PNG.'));
    return;
  }
  return processSource(img, img.naturalWidth, img.naturalHeight);
}

async function processSource(source, sourceWidth, sourceHeight) {
  stopDemo();
  const token = ++photoToken;
  shareButton.disabled = true;
  downloadButton.disabled = true;
  setStatus(t('greeting.status.finding', 'Finding your face…'), true);
  const scale = Math.min(1, 1600 / Math.max(sourceWidth, sourceHeight));
  const work = document.createElement('canvas');
  work.width = Math.round(sourceWidth * scale);
  work.height = Math.round(sourceHeight * scale);
  work.getContext('2d', { willReadFrequently: true }).drawImage(source, 0, 0, work.width, work.height);

  let box;
  let message;
  let faces = [];
  try {
    const detector = await getDetector();
    const detections = detector.detect(work).detections.filter(item => item.boundingBox)
      .sort((a, b) => b.boundingBox.width * b.boundingBox.height - a.boundingBox.width * a.boundingBox.height);
    faces = detections.map(item => item.boundingBox);
    const main = detections.find(item => (item.categories?.[0]?.score ?? 1) >= 0.5);
    if (main) {
      box = main.boundingBox;
      message = faces.length > 1 ? t('greeting.status.manyFaces', 'We found more than one face and used the largest. For a clean cutout, use a photo of just you.') : t('greeting.status.ready', 'Looking good! Pick an outfit and share.');
    } else {
      message = t('greeting.status.noFace', 'We couldn’t find a face, so we centred your photo. A clear, front-facing selfie works best.');
    }
  } catch {
    message = t('greeting.status.noDetector', 'Face detection isn’t available right now, so we centred your photo.');
  }
  if (token !== photoToken) return; // a newer photo was chosen meanwhile
  if (!box) {
    const side = Math.min(work.width, work.height) * 0.45;
    box = { originX: (work.width - side) / 2, originY: work.height * 0.42 - side / 2, width: side, height: side };
  }
  setStatus(t('greeting.status.cutting', 'Cutting out your photo…'), true);
  let cutout = null;
  try {
    const segmenter = await getSegmenter();
    if (token !== photoToken) return;
    const result = segmenter.segment(work);
    cutout = cutHead(work, box, result, faces.filter(face => face !== box));
    result.close?.();
  } catch {
    cutout = null;
  }
  if (token !== photoToken) return;
  if (!cutout) message += ` ${t('greeting.status.noCutout', 'We couldn’t cut out your photo cleanly, so it’s shown in a soft frame. A clear photo of just you works best.')}`;
  state.cutout = cutout;
  state.offsets = freshOffsets();
  state.scales = freshScales();
  state.angles = freshAngles();
  state.selected = null;
  state.photo = freshPhoto();
  state.work = work;
  state.box = box;
  state.skin = sampleSkin(work, box);
  preloadOutfits(); // outfits in this skin tone, so switching stays instant
  state.head = buildHead(work, box, state.photo);
  updateHint();
  render();
  shareButton.disabled = false;
  downloadButton.disabled = false;
  document.querySelector('#greeting-video').disabled = false;
  setStatus(message);
}

// ---------------------------------------------------------------------------
// Selfie camera: phones open the native front camera; other devices get a live
// webcam preview in a dialog (getUserMedia needs HTTPS or localhost).
// ---------------------------------------------------------------------------
const cameraButton = document.querySelector('#greeting-camera');
const captureInput = document.querySelector('#greeting-capture');
const cameraDialog = document.querySelector('#camera-dialog');
const cameraVideo = document.querySelector('#camera-video');
let cameraStream;

function stopCamera() {
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = undefined;
  cameraVideo.srcObject = null;
}

async function openWebcam() {
  setStatus(t('greeting.status.camera', 'Opening your camera… allow camera access if your browser asks.'), true);
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
  } catch {
    setStatus(t('greeting.status.cameraFailed', 'We couldn’t open your camera. Check the camera permission, or choose a photo instead.'));
    return;
  }
  cameraVideo.srcObject = cameraStream;
  setStatus('');
  cameraDialog.showModal();
}

cameraButton.addEventListener('click', () => {
  const phone = matchMedia('(pointer: coarse)').matches;
  if (phone || !navigator.mediaDevices?.getUserMedia) captureInput.click();
  else openWebcam();
});
captureInput.addEventListener('change', () => {
  const [file] = captureInput.files;
  captureInput.value = '';
  if (file) handlePhoto(file);
});
document.querySelector('#camera-shutter').addEventListener('click', () => {
  const { videoWidth: width, videoHeight: height } = cameraVideo;
  if (!width) return;
  // Capture mirrored, matching the preview the visitor saw.
  const frame = document.createElement('canvas');
  frame.width = width;
  frame.height = height;
  const frameCtx = frame.getContext('2d');
  frameCtx.translate(width, 0);
  frameCtx.scale(-1, 1);
  frameCtx.drawImage(cameraVideo, 0, 0, width, height);
  cameraDialog.close();
  processSource(frame, width, height);
});
document.querySelector('#camera-cancel').addEventListener('click', () => cameraDialog.close());
cameraDialog.addEventListener('close', () => { stopCamera(); cameraButton.focus(); });

// ---------------------------------------------------------------------------
// Card drawing
// ---------------------------------------------------------------------------
// Deepavali night, drawn in code (no artwork file): a deep sky with stars, a string of lights,
// two hanging sky lanterns (akasha butti) and clay diyas glowing on the ground either side.
function glowAt(x, y, radius, colour, alpha) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, `rgba(${colour}, ${alpha})`);
  glow.addColorStop(1, `rgba(${colour}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function drawLantern(x, top, length) {
  ctx.strokeStyle = 'rgba(242, 196, 109, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, top);
  ctx.stroke();
  const y = top + length / 2;
  glowAt(x, y, length * 1.1, '255, 170, 80', 0.35);
  ctx.fillStyle = '#e0a43c';
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + length * 0.42, y);
  ctx.lineTo(x, top + length);
  ctx.lineTo(x - length * 0.42, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd27a';
  ctx.beginPath();
  ctx.moveTo(x, top + length * 0.18);
  ctx.lineTo(x + length * 0.22, y);
  ctx.lineTo(x, top + length * 0.82);
  ctx.lineTo(x - length * 0.22, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#b8452c';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 7, top + length);
    ctx.lineTo(x + i * 9, top + length + 46);
    ctx.stroke();
  }
}

function drawDiya(x, y, width) {
  const h = width * 0.32;
  glowAt(x, y - h * 1.2, width * 1.1, '255, 160, 60', 0.45);
  ctx.fillStyle = '#9a4426';
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y - h);
  ctx.quadraticCurveTo(x, y - h + 6, x + width / 2, y - h);
  ctx.quadraticCurveTo(x + width * 0.42, y + 4, x, y + 6);
  ctx.quadraticCurveTo(x - width * 0.42, y + 4, x - width / 2, y - h);
  ctx.fill();
  ctx.fillStyle = '#d9a441';
  ctx.fillRect(x - width * 0.42, y - h - 1, width * 0.84, 3);
  const flame = ctx.createLinearGradient(0, y - h - width * 0.55, 0, y - h);
  flame.addColorStop(0, '#fff3c4');
  flame.addColorStop(0.6, '#ffab3d');
  flame.addColorStop(1, '#ff7a1a');
  ctx.fillStyle = flame;
  ctx.beginPath();
  ctx.moveTo(x, y - h - width * 0.55);
  ctx.quadraticCurveTo(x + width * 0.17, y - h - width * 0.18, x, y - h - 2);
  ctx.quadraticCurveTo(x - width * 0.17, y - h - width * 0.18, x, y - h - width * 0.55);
  ctx.fill();
}

function drawBackground() {
  const scene = sceneImage(state.scene);
  if (scene) {
    ctx.drawImage(scene, 0, 0, SIZE, CARD_H);
    return;
  }
  const sky = ctx.createLinearGradient(0, 0, 0, BAND_TOP);
  sky.addColorStop(0, '#120f24');
  sky.addColorStop(0.55, '#2b1d48');
  sky.addColorStop(1, '#5a2a45');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, SIZE, CARD_H);
  // Stars at fixed positions, so every card looks the same.
  let seed = 7;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.25 + random() * 0.55;
    ctx.beginPath();
    ctx.arc(random() * SIZE, random() * 760, 1 + random() * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Warm halo behind the character to lift it off the background.
  const halo = ctx.createRadialGradient(540, 600 + SCENE_Y, 60, 540, 600 + SCENE_Y, 540);
  halo.addColorStop(0, 'rgba(255, 196, 110, 0.4)');
  halo.addColorStop(0.55, 'rgba(255, 170, 90, 0.14)');
  halo.addColorStop(1, 'rgba(255, 170, 90, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SIZE, BAND_TOP);
  // String of lights swagging along the top edge.
  const swag = x => 18 + 34 * Math.sin(Math.PI * ((x % 360) / 360));
  ctx.strokeStyle = 'rgba(242, 196, 109, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= SIZE; x += 6) ctx[x ? 'lineTo' : 'moveTo'](x, swag(x));
  ctx.stroke();
  for (let x = 14; x < SIZE; x += 30) {
    glowAt(x, swag(x) + 6, 16, '255, 214, 130', 0.6);
    ctx.fillStyle = '#ffe2a0';
    ctx.beginPath();
    ctx.arc(x, swag(x) + 6, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  drawLantern(108, 250, 120);
  drawLantern(968, 214, 96); // kept clear of the sparkler in the waving hand
  // Ground glow and diyas either side of the figure.
  const ground = ctx.createLinearGradient(0, BAND_TOP - 140, 0, BAND_TOP);
  ground.addColorStop(0, 'rgba(255, 150, 70, 0)');
  ground.addColorStop(1, 'rgba(255, 150, 70, 0.22)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, BAND_TOP - 140, SIZE, 140);
  [[70, 74], [168, 60], [912, 60], [1010, 74]].forEach(([x, width]) => drawDiya(x, BAND_TOP - 22, width));
}

// Outfit artwork: {outfit}-{diya|sparkler}.webp, 1080 x 1110 in scene coordinates, with the arms,
// hands and the diya or sparkler painted in. {file}-skin.png marks where its skin is; the skin is
// recoloured to the visitor's (keeping the painted shading) and each version is cached.
const ART_BASE = `${ASSET_BASE}site/assets/deepavali/`;
const ART_SKIN = [198, 138, 94]; // #c68a5e, the skin colour the artwork is painted in
const POSE_FILE = { namaste: 'diya', wave: 'sparkler' };
const outfitFile = (outfit = state.outfit, pose = state.pose) => `${outfit}-${POSE_FILE[pose]}`;
// Each outfit's neck opening (scene px): the drawn neck fills it down to where the collar closes.
// Measured by tools/build-art.py; rerun it and copy its NECKS line after changing the artwork.
const NECKS = { 'kurta-diya': { x: 540, top: 801, width: 171, bottom: 875 }, 'kurta-sparkler': { x: 546, top: 801, width: 163, bottom: 873 }, 'langa-diya': { x: 537, top: 800, width: 198, bottom: 870 }, 'langa-sparkler': { x: 538, top: 802, width: 170, bottom: 854 }, 'panche-diya': { x: 540, top: 800, width: 150, bottom: 910 }, 'panche-sparkler': { x: 545, top: 800, width: 126, bottom: 896 }, 'saree-diya': { x: 538, top: 801, width: 199, bottom: 872 }, 'saree-sparkler': { x: 539, top: 800, width: 170, bottom: 870 } };

function loadArt(url) {
  const img = new Image();
  img.crossOrigin = 'anonymous'; // keeps the card canvas exportable when the page is on the CMS
  img.src = url;
  return img.decode().then(() => img);
}
function pixelsOf(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(img, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
const artSources = new Map();
function artSource(file) {
  if (!artSources.has(file)) {
    const source = Promise.all([loadArt(`${ART_BASE}${file}.webp`), loadArt(`${ART_BASE}${file}-skin.png`)])
      .then(([art, mask]) => ({ art, pixels: pixelsOf(art), mask: pixelsOf(mask).data }));
    source.catch(() => artSources.delete(file)); // try again next time
    artSources.set(file, source);
  }
  return artSources.get(file);
}
function toHex(color) {
  if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
  const rgb = (color.match(/\d+/g) || [198, 138, 94]).slice(0, 3).map(v => Math.max(0, Math.min(255, Number(v))));
  return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
// Skin pixels are scaled channel by channel from the artwork's skin colour to the visitor's, so creases
// and shading stay; the mask's grey edge pixels blend, so outlines stay smooth.
function recolour({ art, pixels, mask }, skin) {
  if (skin === '#c68a5e') return art;
  const target = [1, 3, 5].map(i => parseInt(skin.slice(i, i + 2), 16));
  const factor = target.map((value, i) => value / ART_SKIN[i]);
  const out = new ImageData(new Uint8ClampedArray(pixels.data), pixels.width, pixels.height);
  const data = out.data;
  for (let i = 0; i < data.length; i += 4) {
    const amount = mask[i] / 255;
    if (!amount) continue;
    for (let c = 0; c < 3; c++) data[i + c] += (data[i + c] * factor[c] - data[i + c]) * amount;
  }
  const canvas = document.createElement('canvas');
  canvas.width = out.width;
  canvas.height = out.height;
  canvas.getContext('2d').putImageData(out, 0, 0);
  return canvas;
}
const outfitImages = new Map(); // `${file}|${skin}` -> image or canvas, 'loading' or 'failed'
const lastReady = new Map(); // file -> the latest finished version, shown while a new skin is made
function loadOutfit(file, skin) {
  const key = `${file}|${skin}`;
  const cached = outfitImages.get(key);
  if (cached === 'loading') return lastReady.get(file) || null;
  if (cached === 'failed') return null; // the drawn outfit is used instead
  if (cached) return cached;
  outfitImages.set(key, 'loading');
  artSource(file)
    .then(source => {
      const image = recolour(source, skin);
      outfitImages.set(key, image);
      lastReady.set(file, image);
      scheduleRender();
    })
    .catch(() => { outfitImages.set(key, 'failed'); scheduleRender(); });
  return lastReady.get(file) || null;
}
const outfitArt = () => loadOutfit(outfitFile(), toHex(state.skin));
function preloadOutfits() {
  const skin = toHex(state.skin);
  for (const outfit of OUTFITS) for (const pose of POSES) loadOutfit(outfitFile(outfit, pose), skin);
}
// Resolves once a look's outfit (in the current skin) and background are ready to draw.
function lookReady(outfit, pose, scene) {
  const skin = toHex(state.skin);
  loadOutfit(outfitFile(outfit, pose), skin);
  sceneImage(scene);
  return Promise.allSettled([artSource(outfitFile(outfit, pose)), sceneSources.get(scene)]);
}

// Card backgrounds: bg-{scene}.webp, 1080 x 1350. The drawn night sky is used until one has loaded.
const sceneSources = new Map();
const sceneImages = new Map();
function sceneImage(scene) {
  if (!sceneSources.has(scene)) {
    const source = loadArt(`${ART_BASE}bg-${scene}.webp`);
    source.then(img => { sceneImages.set(scene, img); scheduleRender(); }, () => sceneSources.delete(scene));
    sceneSources.set(scene, source);
  }
  return sceneImages.get(scene) || null;
}

function shade(color, factor) {
  const rgb = color.startsWith('#')
    ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
    : color.match(/\d+/g).slice(0, 3).map(Number);
  return `rgb(${rgb.map(v => Math.round(v * factor)).join(',')})`;
}

// Where the face sits on the card. Sticker heads follow the photo's pan, zoom and rotation;
// the oval frame stays put and rotates around its own centre.
function faceCentre() {
  if (!state.box) return { x: HEAD.x, y: HEAD.y, k: 1 };
  const sticker = useSticker();
  const scale = sticker ? STICKER_SCALE : 1;
  const cropHeight = (state.box.height * 2 * scale) / (state.photo.zoom * (sticker ? STICKER_FACE_BOOST : 1));
  const k = (HEAD.h * scale) / cropHeight; // card pixels per photo pixel
  return { x: HEAD.x + state.photo.x, y: HEAD.y + state.box.height * 0.25 * k + state.photo.y, k };
}
function headPivot() {
  return useSticker() ? faceCentre() : { x: HEAD.x, y: HEAD.y };
}

// The neck is sized to the face and runs from just under the chin into the outfit's collar.
function neckShape() {
  if (!useSticker() || !state.box) return { x: 540, top: 690, width: 106 };
  const { x, y, k } = faceCentre();
  const reach = state.box.height * 0.5 * k;
  const angle = state.photo.angle;
  return {
    x: x - Math.sin(angle) * reach,
    top: Math.min(y + Math.cos(angle) * reach - state.box.height * k * 0.2, 780),
    width: Math.max(70, Math.min(200, state.box.width * k * 0.42))
  };
}

function drawNeck() {
  const { x, top, width } = neckShape();
  // The collar opening of the outfit artwork (the drawn fallback outfits have a narrow one at y 835).
  const collar = outfitArt() ? NECKS[outfitFile()] : { x: 540, top: 800, width: Math.max(width * 1.2, 110), bottom: 835 };
  const half = collar.width / 2 + 6; // a little wider, so no gap shows at the collar's edge
  const bottom = collar.bottom + 6;
  const skin = ctx.createLinearGradient(0, top, 0, bottom);
  skin.addColorStop(0, shade(state.skin, 0.72)); // shadow under the chin
  skin.addColorStop(0.4, shade(state.skin, 0.92));
  skin.addColorStop(1, state.skin);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, top);
  ctx.quadraticCurveTo(x - width * 0.5, collar.top, collar.x - half, collar.top + 4); // flares into the shoulders
  ctx.lineTo(collar.x - half, bottom);
  ctx.lineTo(collar.x + half, bottom);
  ctx.lineTo(collar.x + half, collar.top + 4);
  ctx.quadraticCurveTo(x + width * 0.5, collar.top, x + width / 2, top);
  ctx.closePath();
  ctx.fill();
}

function torso(top, left, right) {
  ctx.beginPath();
  ctx.moveTo(left, BODY_BOTTOM);
  ctx.bezierCurveTo(left - 4, 905, left + 30, top + 22, 395, top);
  ctx.lineTo(685, top);
  ctx.bezierCurveTo(right - 30, top + 22, right + 4, 905, right, BODY_BOTTOM);
  ctx.closePath();
}

function drape(points, fill, border) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  ctx.lineTo(...points[3]);
  ctx.moveTo(...points[1]);
  ctx.lineTo(...points[2]);
  ctx.stroke();
}

function drawKurta() {
  const silk = ctx.createLinearGradient(0, 790, 0, BODY_BOTTOM);
  silk.addColorStop(0, '#e58a2a');
  silk.addColorStop(1, '#b45a15');
  ctx.fillStyle = silk;
  torso(792, 222, 858);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.ellipse(540, 794, 62, 24, 0, 0, Math.PI);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(540, 818);
  ctx.lineTo(540, BODY_BOTTOM);
  ctx.stroke();
  ctx.fillStyle = '#f3d38a';
  [852, 892, 932].forEach(y => { ctx.beginPath(); ctx.arc(540, y, 7, 0, Math.PI * 2); ctx.fill(); });
  drape([[300, 806], [398, 794], [770 + 50, BODY_BOTTOM], [646 + 50, BODY_BOTTOM]], '#f4e7c8', GOLD); // angavastram
}

function drawSaree() {
  const silk = ctx.createLinearGradient(0, 795, 0, BODY_BOTTOM);
  silk.addColorStop(0, '#22735f');
  silk.addColorStop(1, '#134a3d');
  ctx.fillStyle = silk;
  torso(798, 240, 840);
  ctx.fill();
  ctx.fillStyle = state.skin; // round neckline
  ctx.beginPath();
  ctx.ellipse(540, 798, 64, 34, 0, 0, Math.PI);
  ctx.fill();
  const pallu = ctx.createLinearGradient(290, 800, 780, BODY_BOTTOM);
  pallu.addColorStop(0, '#b02a62');
  pallu.addColorStop(1, '#7c1745');
  drape([[292, 810], [402, 800], [784 + 50, BODY_BOTTOM], [652 + 50, BODY_BOTTOM]], pallu, GOLD);
  // Necklace with beads and a pendant.
  ctx.strokeStyle = '#e8bd55';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(540, 800, 76, 50, 0, 0.12 * Math.PI, 0.88 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#f2cf72';
  for (let t = 0.18; t <= 0.83; t += 0.065) {
    ctx.beginPath();
    ctx.arc(540 + 76 * Math.cos(t * Math.PI), 800 + 50 * Math.sin(t * Math.PI), 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(540, 858, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c8322a';
  ctx.beginPath();
  ctx.arc(540, 858, 6, 0, Math.PI * 2);
  ctx.fill();
}

// Arms and hands: drawn as thick rounded strokes to match the illustration style.
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function limb(points, width, color, cap = 'round') {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y));
  ctx.stroke();
}
const drawnAsSaree = () => state.outfit === 'saree' || state.outfit === 'langa';
function arm(shoulder, elbow, wrist) {
  if (drawnAsSaree()) {
    limb([shoulder, elbow, wrist], 56, state.skin); // bare arm below a short blouse sleeve
    const sleeveEnd = lerp(shoulder, elbow, 0.55);
    limb([shoulder, sleeveEnd], 64, '#8d2632');
    limb([lerp(shoulder, elbow, 0.5), sleeveEnd], 66, GOLD, 'butt'); // zari edge
  } else {
    limb([shoulder, elbow, wrist], 64, '#d2711b'); // full kurta sleeve with a zari cuff
    limb([lerp(elbow, wrist, 0.78), lerp(elbow, wrist, 0.88)], 66, GOLD, 'butt');
  }
}
function drawNamaste() {
  arm([300, 860], [330, 1010], [498, 928]);
  arm([780, 860], [750, 1010], [582, 928]);
  ctx.fillStyle = state.skin; // joined palms
  ctx.beginPath();
  ctx.moveTo(540, 826);
  ctx.bezierCurveTo(498, 850, 490, 922, 506, 958);
  ctx.lineTo(574, 958);
  ctx.bezierCurveTo(590, 922, 582, 850, 540, 826);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,30,20,.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(540, 836);
  ctx.lineTo(540, 952);
  ctx.stroke();
}
function drawWave() {
  arm([288, 850], [262, 960], [262, 1040]); // resting arm
  arm([792, 842], [905, 760], [935, 640]); // raised arm
  ctx.fillStyle = state.skin;
  ctx.beginPath();
  ctx.ellipse(940, 596, 40, 46, 0.1, 0, Math.PI * 2);
  ctx.fill();
  [[914, 566, 906, 512], [932, 556, 928, 498], [950, 558, 952, 502], [966, 568, 974, 520]].forEach(([x1, y1, x2, y2]) => limb([[x1, y1], [x2, y2]], 18, state.skin));
  limb([[906, 610], [880, 572]], 20, state.skin); // thumb
}

// Deepavali props held by the figure (scene coordinates, matching the outfit artwork's hands).
// Namaste: a lit clay diya cradled just in front of the joined palms, lighting them warmly.
function drawHeldDiya() {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowAt(540, 900, 300, '255, 150, 60', 0.28);
  ctx.restore();
  drawDiya(540, 1012, 168);
}

// Wave: a sparkler (phuljhadi) held in the raised hand. The wire is drawn behind the artwork so the
// hand appears to grip it; the burst of sparks is drawn on top afterwards (drawSparks).
const SPARKLER = { base: [922, 612], tip: [978, 392] };
function drawSparklerWire() {
  const [bx, by] = SPARKLER.base;
  const [tx, ty] = SPARKLER.tip;
  limb([[bx, by], [tx, ty]], 6, '#6f6a72');
  limb([[bx + (tx - bx) * 0.62, by + (ty - by) * 0.62], [tx, ty]], 11, '#3b2f2c'); // burnt coating near the tip
}
function drawSparks() {
  const [x, y] = SPARKLER.tip;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glowAt(x, y, 120, '255, 190, 90', 0.45);
  glowAt(x, y, 46, '255, 245, 210', 0.9);
  // Spark rays at fixed positions, so every card looks the same.
  let seed = 11;
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const angle = random() * Math.PI * 2;
    const inner = 8 + random() * 10;
    const outer = 30 + random() * 46; // stays inside the card's gold frame
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.strokeStyle = random() < 0.35 ? '#ffffff' : random() < 0.6 ? '#ffe39a' : '#ffb347';
    ctx.lineWidth = 1.6 + random() * 1.8;
    ctx.beginPath();
    ctx.moveTo(x + cos * inner, y + sin * inner);
    ctx.lineTo(x + cos * outer, y + sin * outer);
    ctx.stroke();
    // A little forked star at the end of some rays.
    if (random() < 0.45) {
      const ex = x + cos * outer;
      const ey = y + sin * outer;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(angle + 0.7) * 12, ey + Math.sin(angle + 0.7) * 12);
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex + Math.cos(angle - 0.7) * 12, ey + Math.sin(angle - 0.7) * 12);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHead() {
  const left = HEAD.x - HEAD.w / 2;
  const top = HEAD.y - HEAD.h / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(40,20,10,.35)';
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 10;
  if (state.head) {
    const width = state.head.width / 2;
    const height = state.head.height / 2;
    const pivot = headPivot();
    ctx.translate(pivot.x, pivot.y);
    ctx.rotate(state.photo.angle);
    ctx.translate(-pivot.x, -pivot.y);
    ctx.drawImage(state.head, HEAD.x - width / 2, HEAD.y - height / 2, width, height);
    ctx.restore();
    return;
  }
  ctx.fillStyle = '#f6ead3';
  ctx.beginPath();
  ctx.ellipse(HEAD.x, HEAD.y, HEAD.w / 2, HEAD.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = '#b7a485';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#8e6a4f';
  ctx.textAlign = 'center';
  ctx.font = `${ITALIC}600 44px ${SERIF}`;
  ctx.fillText(t('greeting.card.yourPhoto', 'Your photo'), HEAD.x, HEAD.y + 70);
  ctx.textAlign = 'left';
}

// Jasmine (mallige) string worn along the side of the hair: teardrop buds in two rows with
// green tips, a few open flowers, a soft shadow, and orange kanakambara blooms at the top.
function jasmineBud(x, y, angle, length) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const petal = ctx.createLinearGradient(0, -length / 2, 0, length / 2);
  petal.addColorStop(0, '#ffffff');
  petal.addColorStop(1, '#eee4c6');
  ctx.fillStyle = petal;
  ctx.strokeStyle = 'rgba(140, 128, 96, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -length / 2);
  ctx.bezierCurveTo(length * 0.42, -length * 0.2, length * 0.3, length * 0.42, 0, length / 2);
  ctx.bezierCurveTo(-length * 0.3, length * 0.42, -length * 0.42, -length * 0.2, 0, -length / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6f9a3c'; // green calyx
  ctx.beginPath();
  ctx.ellipse(0, length / 2, length * 0.14, length * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function blossom(x, y, radius, spin, petalColour, centreColour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.fillStyle = petalColour;
  ctx.strokeStyle = 'rgba(120, 100, 70, 0.4)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.beginPath();
    ctx.ellipse(0, -radius * 0.55, radius * 0.34, radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = centreColour;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMallige() {
  const rx = HEAD.w / 2 + 6;
  const ry = HEAD.h / 2 + 6;
  const start = -1.3;
  const end = 0.32;
  const along = t => ({ x: HEAD.x + rx * Math.cos(t), y: HEAD.y + ry * Math.sin(t), nx: Math.cos(t), ny: Math.sin(t) });

  // Soft shadow under the string.
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 10, 20, 0.35)';
  ctx.lineWidth = 34;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let t = start; t <= end; t += 0.02) {
    const p = along(t);
    ctx[t === start ? 'moveTo' : 'lineTo'](p.x + 4, p.y + 6);
  }
  ctx.stroke();
  ctx.restore();

  // Two rows of buds pointing outward, slightly fanned; every fifth spot is an open flower.
  const flowers = [];
  [[-7, 0], [9, 1]].forEach(([shift, row]) => {
    let index = 0;
    for (let t = start + row * 0.027; t <= end; t += 0.055, index++) {
      const p = along(t);
      const x = p.x + p.nx * shift;
      const y = p.y + p.ny * shift;
      if (row === 1 && index % 5 === 2) { flowers.push([x, y, index]); continue; }
      const tilt = (index % 2 ? 0.38 : -0.32) + (row ? 0.12 : -0.08);
      jasmineBud(x, y, Math.atan2(p.ny, p.nx) + Math.PI / 2 + tilt, row ? 30 : 26);
    }
  });
  flowers.forEach(([x, y, index]) => blossom(x, y, 17, index * 0.7, '#ffffff', '#f1df8c'));

  // Kanakambara cluster with leaves at the top of the string.
  const top = along(start - 0.06);
  ctx.fillStyle = '#4f7d2b';
  [[-26, 4, -0.6], [22, -6, 0.5]].forEach(([dx, dy, angle]) => {
    ctx.save();
    ctx.translate(top.x + dx, top.y + dy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  [[0, 0], [17, 10], [-15, 12], [3, 22], [-4, -14]].forEach(([dx, dy], i) => blossom(top.x + dx, top.y + dy, 15, i * 0.9, '#f7881f', '#b4410f'));
}

function fitFont(text, weightAndStyle, family, size, maxWidth) {
  let current = size;
  do {
    ctx.font = `${weightAndStyle} ${current}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return;
    current -= 2;
  } while (current > 20);
}

// Largest size that fits a logo inside maxW x maxH, keeping its proportions.
function fitBox(img, maxW, maxH) {
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight);
  return { w: img.naturalWidth * scale, h: img.naturalHeight * scale };
}

// Gold frame around the whole card, with diya-flame drops at the corners (after the bordered
// Rajyotsava poster): it reads as a finished greeting card when shared.
function drawFrame() {
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  // The frame closes just above the logo band, so it never crosses the band's text.
  const bottom = BAND_TOP - 16;
  ctx.strokeRect(20, 20, SIZE - 40, bottom - 20);
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, SIZE - 60, bottom - 40);
  ctx.globalAlpha = 1;
  ctx.fillStyle = GOLD;
  [[20, 20], [SIZE - 20, 20], [20, bottom], [SIZE - 20, bottom]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 15);
    ctx.lineTo(x + 11, y);
    ctx.lineTo(x, y + 15);
    ctx.lineTo(x - 11, y);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

// A dark fade at the top of the card, under the figure, keeps the headline readable on bright backgrounds.
function drawHeadlineVeil() {
  const veil = ctx.createLinearGradient(0, 0, 0, 360);
  veil.addColorStop(0, 'rgba(16, 10, 34, 0.85)');
  veil.addColorStop(0.5, 'rgba(16, 10, 34, 0.5)');
  veil.addColorStop(1, 'rgba(16, 10, 34, 0)');
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, SIZE, 360);
}

function drawText() {
  const serif = SERIF;
  const sans = SANS;
  ctx.fillStyle = '#ebc87f';
  ctx.textAlign = 'left';
  ctx.letterSpacing = KANNADA ? '1px' : '6px';
  ctx.font = `700 26px ${sans}`;
  ctx.fillText(t('greeting.card.kicker', 'DEEPAVALI DEEPAMALE 2026'), 60, 120);
  ctx.letterSpacing = '0px';
  ctx.fillStyle = '#fff4dc';
  const title = t('greeting.card.title', 'Happy Deepavali!');
  fitFont(title, `${ITALIC}600`, serif, KANNADA ? 62 : 70, SIZE - 112);
  ctx.save();
  ctx.shadowColor = 'rgba(10, 6, 24, 0.7)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;
  ctx.fillText(title, 56, 202);
  ctx.restore();

  const band = ctx.createLinearGradient(0, 0, SIZE, 0);
  band.addColorStop(0, '#1f1538');
  band.addColorStop(1, '#4a1d4c');
  ctx.fillStyle = band;
  ctx.fillRect(0, BAND_TOP, SIZE, CARD_H - BAND_TOP);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, BAND_TOP, SIZE, 4);

  // Publisher logo at the left of the band, greeting beside it; sponsor logo at the right.
  // Logos keep their proportions: the DH mark is square-ish, the Prajavani wordmark is wide.
  const { publisher, sponsor } = state.logos;
  let textLeft = 50;
  if (publisher) {
    const box = fitBox(publisher, 190, 76);
    ctx.drawImage(publisher, 36, BAND_TOP + 14 + (76 - box.h) / 2, box.w, box.h);
    textLeft = 36 + box.w + 23;
  }
  // The greeting runs up to the sponsor logo (or its white plate) on the right.
  const sponsorBox = sponsor ? fitBox(sponsor, 230, 54) : { w: 180 };
  const textRight = 1044 - sponsorBox.w - (SITE.sponsorOnLight ? 12 : 0) - 28;
  const name = state.name.trim();
  const line = name ? t('greeting.card.lineNamed', '{name} wishes you a bright Deepavali', { name }) : t('greeting.card.line', 'Wishing you a bright Deepavali');
  ctx.fillStyle = '#fff4dc';
  fitFont(line, '600', serif, 38, textRight - textLeft);
  ctx.fillText(line, textLeft, BAND_TOP + 54);
  ctx.fillStyle = '#ebc87f';
  ctx.letterSpacing = KANNADA ? '0px' : '3px';
  ctx.font = `700 17px ${sans}`;
  ctx.fillText(publisher ? t('greeting.card.kicker', 'DEEPAVALI DEEPAMALE 2026') : t('greeting.card.bandNoLogo', '{publisher} · DEEPAVALI DEEPAMALE 2026', brand).toUpperCase(), textLeft, BAND_TOP + 90);
  ctx.textAlign = 'right';
  ctx.font = `700 15px ${sans}`;
  ctx.fillText(t('greeting.card.presentedBy', 'PRESENTED BY'), 1044, BAND_TOP + 32);
  ctx.letterSpacing = '0px';
  if (sponsor) {
    const box = sponsorBox;
    const y = BAND_TOP + 42 + (54 - box.h) / 2;
    if (SITE.sponsorOnLight) {
      // A colour logo made for white backgrounds gets a white plate on the night band.
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(1044 - box.w - 12, y - 8, box.w + 24, box.h + 16, 8);
      ctx.fill();
      ctx.drawImage(sponsor, 1044 - box.w, y, box.w, box.h);
    } else {
      // The Bank of Maharashtra logo is a solid plate: round its corners and edge it in gold, as on the page.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(1044 - box.w, y, box.w, box.h, 5);
      ctx.clip();
      ctx.drawImage(sponsor, 1044 - box.w, y, box.w, box.h);
      ctx.restore();
      ctx.strokeStyle = 'rgba(232, 199, 132, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(1044 - box.w, y, box.w, box.h, 5);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 28px ${sans}`;
    ctx.fillText(SITE.sponsor, 1044, BAND_TOP + 84);
  }
  ctx.textAlign = 'left';
}

function accessoryTransform() {
  const offset = state.offsets[state.outfit];
  const anchor = ACCESSORY_ANCHOR[state.outfit];
  ctx.translate(offset.x + anchor.x, offset.y + anchor.y);
  ctx.rotate(state.angles[state.outfit]);
  ctx.scale(state.scales[state.outfit], state.scales[state.outfit]);
  ctx.translate(-anchor.x, -anchor.y);
}

// Dashed outline around the selected item. Drawn in the preview only, never in the saved card.
function drawSelection() {
  ctx.save();
  ctx.setLineDash([18, 12]);
  ctx.strokeStyle = '#ffd36b';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 6;
  if (state.selected === 'accessory' && hasAccessory()) {
    const bounds = ACCESSORY_BOUNDS[state.outfit];
    accessoryTransform();
    ctx.lineWidth = 4 / state.scales[state.outfit];
    ctx.strokeRect(bounds.left - 10, bounds.top - 10, bounds.right - bounds.left + 20, bounds.bottom - bounds.top + 20);
  } else if (state.selected === 'photo' && state.work) {
    const area = photoArea();
    ctx.translate(area.x, area.y);
    ctx.rotate(state.photo.angle);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, area.dy, area.rx + 12, area.ry + 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if ((state.selected === 'accessory' && hasAccessory()) || (state.selected === 'photo' && state.work)) drawHandle(handlePoint(state.selected));
}

// Round handle at the corner of the selection: drag it around to rotate, in or out to resize.
function drawHandle({ x, y }) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffd36b';
  ctx.strokeStyle = '#3a1f2e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = MAROON; // circular arrow icon
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, 12, -2.5, 1.0);
  ctx.stroke();
  const tip = { x: x + 12 * Math.cos(1.0), y: y + 12 * Math.sin(1.0) };
  ctx.fillStyle = MAROON;
  ctx.beginPath();
  ctx.moveTo(tip.x + 8, tip.y - 2);
  ctx.lineTo(tip.x - 4, tip.y + 8);
  ctx.lineTo(tip.x - 4, tip.y - 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The card is drawn in two layers, cached until something changes: the background (back) and the
// figure, text and frame (front). The animated card adds fireworks and twinkling stars between them,
// and sparks or a flickering glow on top, at the sparkler or diya (LIGHTS). The still card (Photo) has
// no effects; the maker's preview, the shared GIF and the video loop every LOOP_MS.
const backLayer = Object.assign(document.createElement('canvas'), { width: SIZE, height: CARD_H });
const frontLayer = Object.assign(document.createElement('canvas'), { width: SIZE, height: CARD_H });
function drawInto(layer, draw) {
  const previous = ctx;
  ctx = layer.getContext('2d');
  try {
    ctx.clearRect(0, 0, SIZE, CARD_H);
    draw();
  } finally {
    ctx = previous;
  }
}
function paintLayers() {
  drawInto(backLayer, () => {
    drawBackground();
    drawHeadlineVeil();
  });
  drawInto(frontLayer, () => {
    ctx.save();
    ctx.translate(0, SCENE_Y);
    drawNeck();
    const outfit = outfitArt();
    if (outfit) {
      ctx.drawImage(outfit, 0, 0, SIZE, 1110); // arms, hands and the diya or sparkler are part of the artwork
    } else {
      // Drawn stand-in while the artwork loads (or if it cannot be loaded).
      if (state.pose === 'wave') drawSparklerWire();
      if (drawnAsSaree()) drawSaree(); else drawKurta();
      if (state.pose === 'wave') drawWave(); else drawNamaste();
      if (state.pose === 'wave') drawSparks(); else drawHeldDiya();
    }
    drawHead();
    if (hasAccessory()) {
      ctx.save();
      accessoryTransform();
      drawMallige();
      ctx.restore();
    }
    ctx.restore();
    drawText();
    drawFrame();
  });
}
// Draws the card at a moment of the loop (time in ms), or the still card (time null), onto g.
function composeCard(g, time = null) {
  g.clearRect(0, 0, SIZE, CARD_H);
  g.drawImage(backLayer, 0, 0);
  if (time !== null) drawSkyEffects(g, time);
  g.drawImage(frontLayer, 0, 0);
  if (time !== null) drawLightEffects(g, time);
}

// Loop effects. Every movement repeats a whole number of times per loop, so the GIF and the video loop
// without a jump. Positions are fixed (seeded), so every card looks the same.
const LOOP_MS = 2400;
// Where each outfit's sparkler burst or diya flame is (scene px); measured by tools/build-art.py.
const LIGHTS = { 'kurta-diya': [540, 964], 'kurta-sparkler': [966, 363], 'langa-diya': [540, 963], 'langa-sparkler': [966, 364], 'panche-diya': [540, 966], 'panche-sparkler': [963, 364], 'saree-diya': [539, 937], 'saree-sparkler': [965, 363] };
const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
// Fireworks in the sky either side of the head: [x, y, radius, colour, start in the loop (0 to 1)].
const BURSTS = [[190, 360, 120, '255, 196, 90', 0], [880, 300, 105, '255, 120, 150', 0.33], [210, 640, 95, '150, 220, 255', 0.66], [900, 620, 90, '190, 255, 170', 0.15]];
const TWINKLES = (() => {
  const random = seeded(23);
  return Array.from({ length: 22 }, () => [random() * SIZE, 250 + random() * 520, 1.6 + random() * 2.2, Math.ceil(random() * 3), random()]);
})();
// Indoor backgrounds (a puja room, a doorway) have no sky: no fireworks or stars there, just warm
// embers drifting up from the lamps. Each ember rises a whole number of times per loop, so it loops.
const INDOOR = new Set(['doorstep', 'lakshmi-puja']);
const EMBERS = (() => {
  const random = seeded(41);
  return Array.from({ length: 26 }, () => [random() < 0.5 ? 60 + random() * 260 : 760 + random() * 260, 2.2 + random() * 2.6, Math.ceil(random() * 2), random(), 380 + random() * 380]);
})();
function drawEmbers(g, loop) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [x, size, beats, offset, travel] of EMBERS) {
    const life = (loop * beats + offset) % 1;
    const y = 1180 - life * travel;
    g.globalAlpha = Math.sin(Math.PI * life) * 0.85;
    const glow = g.createRadialGradient(x, y, 0, x, y, size * 3);
    glow.addColorStop(0, '#fff3cf');
    glow.addColorStop(0.35, 'rgba(255, 190, 90, .8)');
    glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
    g.fillStyle = glow;
    g.beginPath();
    g.arc(x + Math.sin((life + offset) * Math.PI * 4) * 10, y, size * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}
function drawSkyEffects(g, time) {
  const loop = time / LOOP_MS;
  if (INDOOR.has(state.scene)) { drawEmbers(g, loop); return; }
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (const [x, y, size, beats, offset] of TWINKLES) {
    g.globalAlpha = 0.25 + 0.75 * Math.abs(Math.sin(Math.PI * (loop * beats + offset)));
    g.fillStyle = '#fff3cf';
    g.beginPath();
    g.arc(x, y, size, 0, Math.PI * 2);
    g.fill();
  }
  for (const [x, y, radius, colour, start] of BURSTS) {
    const age = (loop - start + 1) % 1; // 0 to 1 through this burst's life
    if (age > 0.62) continue; // a quiet pause before it bursts again
    const progress = age / 0.62;
    const spread = radius * (1 - (1 - progress) ** 3);
    const drop = 30 * progress * progress; // the sparks fall a little as they fade
    const random = seeded(Math.round(x + y));
    g.globalAlpha = 1 - progress;
    g.strokeStyle = `rgb(${colour})`;
    g.fillStyle = '#fffbe8';
    g.lineWidth = 3;
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + random() * 0.2;
      const reach = spread * (0.75 + random() * 0.25);
      const px = x + Math.cos(angle) * reach;
      const py = y + Math.sin(angle) * reach + drop;
      g.beginPath();
      g.moveTo(x + Math.cos(angle) * reach * 0.8, y + Math.sin(angle) * reach * 0.8 + drop);
      g.lineTo(px, py);
      g.stroke();
      g.beginPath();
      g.arc(px, py, 2.6, 0, Math.PI * 2);
      g.fill();
    }
    if (progress < 0.2) { // the flash as it bursts
      g.globalAlpha = 1 - progress / 0.2;
      const flash = g.createRadialGradient(x, y, 0, x, y, radius * 0.45);
      flash.addColorStop(0, `rgba(${colour}, .9)`);
      flash.addColorStop(1, `rgba(${colour}, 0)`);
      g.fillStyle = flash;
      g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
  g.restore();
}
function drawLightEffects(g, time) {
  const loop = time / LOOP_MS;
  const [x, sceneY] = outfitArt() ? LIGHTS[outfitFile()] : state.pose === 'wave' ? SPARKLER.tip : [540, 930];
  const y = sceneY + SCENE_Y;
  g.save();
  g.globalCompositeOperation = 'lighter';
  if (state.pose === 'wave') {
    // The sparkler: a pulsing glow and sparks shooting out and fading.
    const glow = g.createRadialGradient(x, y, 0, x, y, 95);
    glow.addColorStop(0, `rgba(255, 230, 160, ${0.55 + 0.2 * Math.sin(Math.PI * 2 * loop * 6)})`);
    glow.addColorStop(1, 'rgba(255, 180, 80, 0)');
    g.fillStyle = glow;
    g.fillRect(x - 95, y - 95, 190, 190);
    const random = seeded(31);
    g.lineWidth = 2.2;
    for (let i = 0; i < 34; i++) {
      const angle = random() * Math.PI * 2;
      const length = 40 + random() * 55;
      const life = (loop * (3 + Math.floor(random() * 3)) + random()) % 1;
      const inner = 10 + life * length * 0.6;
      const outer = 14 + life * length;
      g.globalAlpha = 1 - life;
      g.strokeStyle = random() < 0.5 ? '#ffffff' : '#ffd88a';
      g.beginPath();
      g.moveTo(x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
      g.lineTo(x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
      g.stroke();
    }
  } else {
    // The diya: a warm glow that breathes and flickers.
    const flicker = 0.5 + 0.18 * Math.sin(Math.PI * 2 * loop * 3) + 0.08 * Math.sin(Math.PI * 2 * loop * 11);
    const glow = g.createRadialGradient(x, y, 0, x, y, 120);
    glow.addColorStop(0, `rgba(255, 200, 110, ${flicker})`);
    glow.addColorStop(0.4, `rgba(255, 150, 60, ${flicker * 0.35})`);
    glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
    g.fillStyle = glow;
    g.fillRect(x - 120, y - 120, 240, 240);
  }
  g.restore();
}

// The card plays its animation (fireworks, twinkles, diya flames, sparklers) in the maker and in the
// home page teaser while it is on screen, except for visitors who prefer reduced motion.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let cardOnScreen = false;
const animating = () => !reducedMotion && !document.hidden && (cardOnScreen || document.querySelector('#greeting').classList.contains('is-studio'));
let animationFrame = 0;
let lastFrameAt = 0;
function drawOverlay(selection) {
  if (selection && state.selected) {
    ctx.save();
    ctx.translate(0, SCENE_Y);
    drawSelection();
    ctx.restore();
  }
}
function animationTick(now) {
  animationFrame = 0;
  if (!animating()) { render(); return; } // back to the still card
  if (now - lastFrameAt > 45) { // about 20 frames a second is plenty for the preview
    lastFrameAt = now;
    composeCard(ctx, now % LOOP_MS);
    drawOverlay(true);
  }
  animationFrame = requestAnimationFrame(animationTick);
}
function startAnimation() {
  if (!animationFrame && animating()) animationFrame = requestAnimationFrame(animationTick);
}
document.addEventListener('visibilitychange', startAnimation);

function render({ selection = true } = {}) {
  paintLayers();
  composeCard(ctx, animating() ? performance.now() % LOOP_MS : null);
  drawOverlay(selection);
  const offset = state.offsets[state.outfit];
  const { x, y, zoom, angle } = state.photo;
  resetButton.hidden = !offset.x && !offset.y && !x && !y && zoom === 1 && !angle
    && state.scales[state.outfit] === 1 && !state.angles[state.outfit];
  scheduleGif();
}

// ---------------------------------------------------------------------------
// Adjusting (touch first): tap the photo or the mallige to select it, then drag to move,
// pinch to resize and twist to rotate. Mouse: drag; ctrl + wheel (trackpad pinch) resizes and
// Shift + wheel rotates. Keyboard: Enter switches selection, arrows move, + / - resize, [ / ] rotate.
// ---------------------------------------------------------------------------
const resetButton = document.querySelector('#greeting-reset');
const hint = document.querySelector('#greeting-hint');
const accessoryName = () => t('greeting.mallige', 'mallige');
const ACCESSORY_LIMIT = 420;
const PAN_LIMIT = 320;
const LIMITS = { photo: [0.5, 3.5], accessory: [0.4, 2.5] };
const pointers = new Map();
let gesture;
let frameRequested = false;
let headDirty = false;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
function scheduleRender() {
  if (frameRequested) return;
  frameRequested = true;
  requestAnimationFrame(() => {
    frameRequested = false;
    if (headDirty && state.work) state.head = buildHead(state.work, state.box, state.photo);
    headDirty = false;
    render();
  });
}
function updateHint() {
  const name = accessoryName();
  if (!hasAccessory()) {
    hint.textContent = state.work
      ? t('greeting.hint.photoOnly', 'Tap your photo to select it and drag to move. Pinch and twist, or drag the round handle, to resize and rotate.')
      : t('greeting.hint.noPhoto', 'Add your photo to light up the card.');
    return;
  }
  hint.textContent = state.work
    ? t('greeting.hint.withPhoto', 'Tap your photo or the {name} to select it and drag to move. Pinch and twist, or drag the round handle, to resize and rotate.', { name })
    : t('greeting.hint', 'Tap the {name} to select it and drag to move. Pinch and twist, or drag the round handle, to resize and rotate.', { name });
}
function toCard(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return { x: (clientX - rect.left) * (SIZE / rect.width), y: (clientY - rect.top) * (CARD_H / rect.height) - SCENE_Y };
}
function rotateAround(point, centre, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - centre.x;
  const dy = point.y - centre.y;
  return { x: centre.x + dx * cos - dy * sin, y: centre.y + dx * sin + dy * cos };
}

// Touch area of the photo: the sticker head (face plus hair), or the oval frame.
function photoArea() {
  if (useSticker() && state.box) {
    const { x, y, k } = faceCentre();
    return { x, y, dy: -state.box.height * 0.15 * k, rx: state.box.width * 0.8 * k, ry: state.box.height * 0.95 * k };
  }
  return { x: HEAD.x, y: HEAD.y, dy: 0, rx: HEAD.w / 2, ry: HEAD.h / 2 };
}
function overPhoto(point) {
  if (!state.work) return false;
  const area = photoArea();
  const local = rotateAround(point, area, -state.photo.angle);
  const dx = (local.x - area.x) / area.rx;
  const dy = (local.y - area.y - area.dy) / area.ry;
  return dx * dx + dy * dy <= 1;
}
function overAccessory(point) {
  if (!hasAccessory()) return false;
  const bounds = ACCESSORY_BOUNDS[state.outfit];
  const offset = state.offsets[state.outfit];
  const anchor = ACCESSORY_ANCHOR[state.outfit];
  const centre = { x: anchor.x + offset.x, y: anchor.y + offset.y };
  const local = rotateAround(point, centre, -state.angles[state.outfit]);
  const scale = state.scales[state.outfit];
  const x = anchor.x + (local.x - centre.x) / scale;
  const y = anchor.y + (local.y - centre.y) / scale;
  return x >= bounds.left - 10 && x <= bounds.right + 10 && y >= bounds.top - 10 && y <= bounds.bottom + 10;
}
const itemAt = point => (overAccessory(point) ? 'accessory' : overPhoto(point) ? 'photo' : null);

// The point each item rotates and resizes around, and where its handle sits.
const HANDLE_RADIUS = 26;
function itemCentre(item) {
  if (item === 'photo') return headPivot();
  const offset = state.offsets[state.outfit];
  const anchor = ACCESSORY_ANCHOR[state.outfit];
  return { x: anchor.x + offset.x, y: anchor.y + offset.y };
}
function handlePoint(item) {
  if (item === 'accessory') {
    const bounds = ACCESSORY_BOUNDS[state.outfit];
    const anchor = ACCESSORY_ANCHOR[state.outfit];
    const centre = itemCentre('accessory');
    const scale = state.scales[state.outfit];
    const corner = { x: centre.x + (bounds.right + 10 - anchor.x) * scale, y: centre.y + (bounds.bottom + 10 - anchor.y) * scale };
    return rotateAround(corner, centre, state.angles[state.outfit]);
  }
  const area = photoArea();
  const corner = { x: area.x + (area.rx + 12) * Math.SQRT1_2, y: area.y + area.dy + (area.ry + 12) * Math.SQRT1_2 };
  return rotateAround(corner, area, state.photo.angle);
}
function onHandle(point) {
  if (!state.selected || (state.selected === 'photo' && !state.work) || (state.selected === 'accessory' && !hasAccessory())) return false;
  const handle = handlePoint(state.selected);
  return Math.hypot(point.x - handle.x, point.y - handle.y) <= HANDLE_RADIUS + 18; // generous for fingers
}

// Current transform of an item, and a setter that keeps it in range.
function transformOf(item) {
  if (item === 'photo') return { x: state.photo.x, y: state.photo.y, scale: state.photo.zoom, angle: state.photo.angle };
  const offset = state.offsets[state.outfit];
  return { x: offset.x, y: offset.y, scale: state.scales[state.outfit], angle: state.angles[state.outfit] };
}
function setTransform(item, { x, y, scale, angle }) {
  const [min, max] = LIMITS[item];
  const size = Math.max(min, Math.min(max, scale));
  if (item === 'photo') {
    if (!state.work) return;
    const next = { x: clamp(x, PAN_LIMIT), y: clamp(y, PAN_LIMIT), zoom: size, angle };
    // Moving or resizing changes the photo crop; rotating alone is applied when drawing.
    if (next.x !== state.photo.x || next.y !== state.photo.y || next.zoom !== state.photo.zoom) headDirty = true;
    state.photo = next;
  } else {
    state.offsets[state.outfit] = { x: clamp(x, ACCESSORY_LIMIT), y: clamp(y, ACCESSORY_LIMIT) };
    state.scales[state.outfit] = size;
    state.angles[state.outfit] = angle;
  }
  scheduleRender();
}
function select(item) {
  if (state.selected === item) return;
  state.selected = item;
  scheduleRender();
}
function capturePointer(id) {
  try { canvas.setPointerCapture(id); } catch { /* pointer already gone; the gesture still works without capture */ }
}
function twoFingers() {
  const [a, b] = [...pointers.values()];
  return { distance: Math.hypot(a.x - b.x, a.y - b.y) || 1, angle: Math.atan2(b.y - a.y, b.x - a.x), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
}

canvas.addEventListener('pointerdown', event => {
  const point = toCard(event.clientX, event.clientY);
  if (!pointers.size && onHandle(point)) {
    const target = state.selected;
    const centre = itemCentre(target);
    pointers.set(event.pointerId, point);
    capturePointer(event.pointerId);
    gesture = { type: 'handle', target, start: transformOf(target), centre,
      distance: Math.hypot(point.x - centre.x, point.y - centre.y) || 1, angle: Math.atan2(point.y - centre.y, point.x - centre.x) };
    return;
  }
  const item = itemAt(point);
  if (!pointers.size) {
    if (!item) {
      // A tap on empty space clears the selection; a finger there may also start a two-finger gesture.
      if (event.pointerType === 'mouse') { select(null); return; }
      if (!state.selected) return;
    } else {
      select(item);
    }
  } else if (pointers.size >= 2 || !state.selected) {
    return;
  }
  pointers.set(event.pointerId, point);
  capturePointer(event.pointerId);
  const target = state.selected;
  if (pointers.size === 2) {
    const fingers = twoFingers();
    gesture = { type: 'pinch', target, start: transformOf(target), ...fingers };
  } else if (item) {
    gesture = { type: 'drag', target, start: transformOf(target), point };
    canvas.style.cursor = 'grabbing';
  }
});
canvas.addEventListener('pointermove', event => {
  const point = toCard(event.clientX, event.clientY);
  if (!pointers.has(event.pointerId)) {
    if (event.pointerType === 'mouse') canvas.style.cursor = onHandle(point) ? 'nwse-resize' : itemAt(point) ? 'grab' : '';
    return;
  }
  pointers.set(event.pointerId, point);
  if (!gesture) return;
  const { start } = gesture;
  if (gesture.type === 'pinch' && pointers.size === 2) {
    const now = twoFingers();
    setTransform(gesture.target, {
      x: start.x + now.mid.x - gesture.mid.x,
      y: start.y + now.mid.y - gesture.mid.y,
      scale: start.scale * (now.distance / gesture.distance),
      angle: start.angle + (now.angle - gesture.angle)
    });
  } else if (gesture.type === 'handle') {
    const { centre } = gesture;
    setTransform(gesture.target, {
      ...start,
      scale: start.scale * (Math.hypot(point.x - centre.x, point.y - centre.y) / gesture.distance),
      angle: start.angle + (Math.atan2(point.y - centre.y, point.x - centre.x) - gesture.angle)
    });
  } else if (gesture.type === 'drag') {
    setTransform(gesture.target, { ...start, x: start.x + point.x - gesture.point.x, y: start.y + point.y - gesture.point.y });
  }
});
const endPointer = event => {
  if (!pointers.delete(event.pointerId)) return;
  if (gesture) track(gesture.target === 'accessory' ? 'greeting_accessory_adjusted' : 'greeting_photo_adjusted');
  // Lifting one finger of a pinch ends the gesture rather than jumping into a drag.
  gesture = undefined;
  if (!pointers.size) canvas.style.cursor = '';
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
// Stop the page scrolling only when a gesture starts on an item, or two fingers adjust a selection.
canvas.addEventListener('touchstart', event => {
  const touch = event.touches[0];
  if (!touch) return;
  const point = toCard(touch.clientX, touch.clientY);
  if (onHandle(point) || itemAt(point) || (event.touches.length > 1 && state.selected)) event.preventDefault();
}, { passive: false });
canvas.addEventListener('wheel', event => {
  // Trackpad pinch arrives as ctrl + wheel; Shift + wheel rotates; a plain wheel scrolls the page.
  if (!event.ctrlKey && !event.shiftKey) return;
  const item = itemAt(toCard(event.clientX, event.clientY)) || state.selected;
  if (!item) return;
  event.preventDefault();
  select(item);
  const now = transformOf(item);
  if (event.ctrlKey) now.scale *= Math.exp(-event.deltaY * 0.01);
  else now.angle += (event.deltaY || event.deltaX) * 0.004;
  setTransform(item, now);
}, { passive: false });
canvas.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    if (!hasAccessory()) { if (state.work) select('photo'); return; }
    select(state.selected === 'accessory' && state.work ? 'photo' : 'accessory');
    return;
  }
  const item = state.selected || (state.work ? 'photo' : hasAccessory() ? 'accessory' : null);
  if (!item) return;
  const now = transformOf(item);
  const step = event.shiftKey ? 40 : 10;
  const turn = (event.shiftKey ? 15 : 5) * (Math.PI / 180);
  const actions = {
    ArrowLeft: () => { now.x -= step; }, ArrowRight: () => { now.x += step; },
    ArrowUp: () => { now.y -= step; }, ArrowDown: () => { now.y += step; },
    '+': () => { now.scale += 0.1; }, '=': () => { now.scale += 0.1; }, '-': () => { now.scale -= 0.1; },
    '[': () => { now.angle -= turn; }, ']': () => { now.angle += turn; }
  };
  if (!actions[event.key]) return;
  event.preventDefault();
  select(item);
  actions[event.key]();
  setTransform(item, now);
});
resetButton.addEventListener('click', () => {
  state.offsets[state.outfit] = { x: 0, y: 0 };
  state.scales[state.outfit] = 1;
  state.angles[state.outfit] = 0;
  state.photo = freshPhoto();
  headDirty = true;
  scheduleRender();
  canvas.focus();
});
function track(event) {
  try { window.dataLayer?.push({ event }); } catch { /* analytics must never break the page */ }
}

// ---------------------------------------------------------------------------
// Export. Share sends the animated card as a GIF; Photo saves the still card (PNG); Video saves an MP4.
//
// Sharing must never turn into a download. Phones only open the share sheet straight after a tap, and
// making a GIF takes a few seconds, so the GIF is made in the background once the card has stopped
// changing (GIF_IDLE_MS) and Share uses that ready file at once. It is kept within GIF_BUDGET, which
// is far below what share sheets and WhatsApp accept: each attempt is smaller (GIF_WIDTHS) until the
// file fits and the browser confirms it can share it. If Share is tapped before the GIF is ready, the
// visitor is asked to tap again in a moment; if the phone cannot share a GIF at all, the still card is
// shared instead.
// ---------------------------------------------------------------------------
const GIFENC = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';
const GIF_BUDGET = 2.5 * 1024 * 1024;
const GIF_WIDTHS = [720, 600, 540, 432]; // tried in turn until the GIF fits GIF_BUDGET
const GIF_FRAME_MS = 100; // 10 frames a second: 24 frames per loop
const GIF_IDLE_MS = 1200;
const videoButton = document.querySelector('#greeting-video');
const shareTitle = () => t('greeting.share.title', 'Deepavali greeting');
const shareText = () => t('greeting.share.text', 'Happy Deepavali! Make your own card: {url}', { url: location.href.split('#')[0] });

function stillFile() {
  paintLayers();
  composeCard(ctx, null); // the still card: no effects, no selection outline
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    render();
    if (blob) resolve(new File([blob], 'deepavali-greeting.png', { type: 'image/png' }));
    else reject(new Error('Export failed'));
  }, 'image/png'));
}

function download(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const canShareFiles = files => { try { return Boolean(navigator.canShare?.({ files })); } catch { return false; } };

// Everything the card shows; a GIF made for one version is not shared for another.
function cardKey() {
  return JSON.stringify([photoToken, state.outfit, state.pose, state.scene, state.name.trim(), toHex(state.skin), state.photo,
    state.offsets[state.outfit], state.scales[state.outfit], state.angles[state.outfit], Boolean(outfitArt()), Boolean(sceneImage(state.scene)), Boolean(state.head)]);
}

let gifJob = null; // { key, file, promise }
let gifTimer = 0;
let gifWanted = false; // Share was tapped before the GIF was ready
function scheduleGif() {
  clearTimeout(gifTimer);
  if (!state.work || shareButton.hidden || gifJob?.key === cardKey()) return;
  gifTimer = setTimeout(prepareGif, GIF_IDLE_MS);
}
function prepareGif() {
  const key = cardKey();
  if (gifJob?.key === key) return gifJob.promise;
  const job = { key, file: null };
  job.promise = makeGif(() => gifJob !== job || cardKey() !== key)
    .then(file => {
      if (gifJob !== job) return null;
      job.file = file;
      if (gifWanted) {
        gifWanted = false;
        setStatus(t('greeting.status.gifReady', 'Your animated card is ready. Tap Share.'));
      }
      return file;
    })
    .catch(() => {
      if (gifJob === job) gifJob = null; // made again on the next change or tap
      return null;
    });
  gifJob = job;
  return job.promise;
}
const yieldToPage = () => new Promise(resolve => setTimeout(resolve, 0));
// The GIF, made a few frames at a time so the page stays responsive; stale() stops it early if the card
// changes meanwhile. One palette for the whole loop (from three moments of it), so colours don't flicker.
async function makeGif(stale) {
  const { GIFEncoder, quantize, applyPalette } = await import(GIFENC);
  paintLayers();
  const full = Object.assign(document.createElement('canvas'), { width: SIZE, height: CARD_H });
  const fullContext = full.getContext('2d');
  const frames = Math.round(LOOP_MS / GIF_FRAME_MS);
  let file = null;
  for (const width of GIF_WIDTHS) {
    const height = Math.round(width * CARD_H / SIZE);
    const small = Object.assign(document.createElement('canvas'), { width, height });
    const smallContext = small.getContext('2d', { willReadFrequently: true });
    const frameAt = index => {
      composeCard(fullContext, index * GIF_FRAME_MS);
      smallContext.drawImage(full, 0, 0, width, height);
      return smallContext.getImageData(0, 0, width, height).data;
    };
    const samples = [0, Math.round(frames / 3), Math.round((2 * frames) / 3)].map(frameAt);
    const sampled = new Uint8ClampedArray(samples.reduce((sum, data) => sum + data.length, 0));
    samples.reduce((at, data) => (sampled.set(data, at), at + data.length), 0);
    // 255 colours, plus one "unchanged" slot: after the first frame, only the pixels the effects
    // change are stored and the rest stay as they were, which keeps the file small.
    const palette = quantize(sampled, 255);
    const unchanged = palette.length;
    const gifPalette = [...palette, [0, 0, 0]];
    const gif = GIFEncoder();
    let previous = null;
    for (let index = 0; index < frames; index++) {
      if (index % 3 === 0) {
        await yieldToPage();
        if (stale()) throw new Error('stale');
      }
      const pixels = applyPalette(frameAt(index), palette);
      if (!previous) {
        gif.writeFrame(pixels, width, height, { palette: gifPalette, delay: GIF_FRAME_MS, repeat: 0 });
      } else {
        const changes = pixels.slice();
        for (let i = 0; i < changes.length; i++) if (changes[i] === previous[i]) changes[i] = unchanged;
        gif.writeFrame(changes, width, height, { delay: GIF_FRAME_MS, transparent: true, transparentIndex: unchanged, dispose: 1 });
      }
      previous = pixels;
    }
    gif.finish();
    file = new File([gif.bytes()], 'deepavali-greeting.gif', { type: 'image/gif' });
    if (file.size <= GIF_BUDGET && canShareFiles([file])) return file;
    await yieldToPage();
  }
  return file; // the smallest; Share checks whether the phone accepts it
}

// Video: two loops recorded from a hidden canvas. MP4 only: WebM does not play in WhatsApp or on
// iPhones, so where the browser cannot record MP4 the animated GIF is saved instead.
async function recordVideo() {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return null;
  const type = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4'].find(candidate => MediaRecorder.isTypeSupported(candidate));
  if (!type) return null;
  paintLayers();
  const stage = Object.assign(document.createElement('canvas'), { width: SIZE, height: CARD_H });
  stage.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;opacity:0;pointer-events:none';
  document.body.append(stage);
  const context = stage.getContext('2d');
  composeCard(context, 0);
  const stream = stage.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 5_000_000 });
  const chunks = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const stopped = new Promise(resolve => { recorder.onstop = resolve; });
  recorder.start(250);
  const started = performance.now();
  await new Promise(resolve => {
    const frame = now => {
      const elapsed = now - started;
      composeCard(context, elapsed % LOOP_MS);
      if (elapsed < LOOP_MS * 2) requestAnimationFrame(frame); else resolve();
    };
    requestAnimationFrame(frame);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach(track => track.stop());
  stage.remove();
  return new File(chunks, 'deepavali-greeting.mp4', { type: 'video/mp4' });
}

// Share appears where the phone can share pictures; the GIF is made once a photo is in.
shareButton.hidden = !canShareFiles([new File([''], 'test.png', { type: 'image/png' })]);

shareButton.addEventListener('click', async () => {
  const ready = gifJob?.key === cardKey() ? gifJob.file : null;
  // No GIF yet (or the phone cannot share one): the still card is quick enough to share right away
  // if GIFs cannot be shared at all; otherwise ask for a second tap once the GIF is ready.
  let file = ready && canShareFiles([ready]) ? ready : null;
  if (!file && ready) file = await stillFile();
  if (!file) {
    gifWanted = true;
    setStatus(t('greeting.status.gifWait', 'Getting your animated card ready. Tap Share again in a moment.'), true);
    prepareGif();
    return;
  }
  try {
    await navigator.share({ files: [file], title: shareTitle(), text: shareText() });
    track(file.type === 'image/gif' ? 'greeting_shared_gif' : 'greeting_shared');
  } catch (error) {
    if (error.name !== 'AbortError') setStatus(t('greeting.status.shareFailed', 'Your phone couldn’t open the share menu. Save the card with Photo or Video and share it from your gallery.'));
  }
});
downloadButton.addEventListener('click', async () => { download(await stillFile()); track('greeting_photo_saved'); });
videoButton.addEventListener('click', async () => {
  videoButton.disabled = true;
  setStatus(t('greeting.status.video', 'Making your video…'), true);
  try {
    const video = await recordVideo();
    if (video) {
      download(video);
      setStatus(t('greeting.status.videoDone', 'Your video is saved.'));
      track('greeting_video_saved');
    } else {
      download(await (gifJob?.key === cardKey() && gifJob.file ? gifJob.file : prepareGif()) || await stillFile());
      setStatus(t('greeting.status.videoGif', 'This browser can’t make videos, so we saved an animated GIF instead.'));
      track('greeting_gif_saved');
    }
  } catch {
    setStatus(t('greeting.status.exportFailed', 'Something went wrong. Please try again.'));
  } finally {
    videoButton.disabled = false;
  }
});

photoInput.addEventListener('change', () => {
  const [file] = photoInput.files;
  photoInput.value = '';
  if (file) handlePhoto(file);
});
// A new outfit, pose or background is shown once its pictures are ready (usually at once: they are
// preloaded while the card is on screen); the card dims briefly while they load.
function showLook() {
  const { outfit, pose, scene } = state;
  render();
  if (outfitArt() && sceneImage(scene)) return;
  canvas.classList.add('is-loading');
  lookReady(outfit, pose, scene).then(() => {
    if (state.outfit !== outfit || state.pose !== pose || state.scene !== scene) return;
    canvas.classList.remove('is-loading');
    render();
  });
}
outfitInputs.forEach(input => input.addEventListener('change', () => {
  state.outfit = input.value;
  if (state.selected === 'accessory' && !hasAccessory()) state.selected = null;
  updateHint();
  showLook();
}));
poseInputs.forEach(input => input.addEventListener('change', () => { state.pose = input.value; showLook(); }));
sceneInputs.forEach(input => input.addEventListener('change', () => { state.scene = input.value; showLook(); }));
nameInput.addEventListener('input', () => { state.name = nameInput.value; render(); });

// ---------------------------------------------------------------------------
// The greeting section is a teaser (the demo card and a button); the maker opens full screen on every
// device, as on the Rajyotsava poster maker: a title bar, the card on a dark stage that stays in view
// (pinned at the top on phones, on the left on wider screens), every choice in one panel that scrolls
// under or beside it, and Download / Share always in reach at the bottom. Close with the X, Escape or
// the phone's back button; the card keeps its state.
// ---------------------------------------------------------------------------
const section = document.querySelector('#greeting');
const studioOpenButton = document.querySelector('#greeting-open');
const studioCloseButton = document.querySelector('#greeting-close');
const studioPanel = document.querySelector('#greeting-panel');
let studioReturnFocus;
const studioIsOpen = () => section.classList.contains('is-studio');
function openStudio() {
  if (studioIsOpen()) return;
  studioReturnFocus = document.activeElement;
  section.classList.add('is-studio');
  section.setAttribute('role', 'dialog');
  section.setAttribute('aria-modal', 'true');
  document.body.classList.add('studio-open');
  stopDemo(); // the maker shows the visitor's own choices, not the demo
  startAnimation(); // the preview plays the animated card
  studioPanel.scrollTop = 0;
  studioPanel.parentElement.scrollTop = 0;
  if (!history.state?.studio) history.pushState({ studio: true }, '', '#greeting');
  studioCloseButton.focus();
  track('greeting_studio_open');
}
function closeStudio(fromHistory = false) {
  if (!studioIsOpen()) return;
  select(null);
  section.classList.remove('is-studio');
  section.removeAttribute('role');
  section.removeAttribute('aria-modal');
  document.body.classList.remove('studio-open');
  if (!fromHistory && history.state?.studio) history.back();
  (studioReturnFocus?.isConnected ? studioReturnFocus : studioOpenButton).focus?.();
}
studioOpenButton.addEventListener('click', openStudio);
// Tapping the demo card in the teaser opens the maker too.
canvas.addEventListener('click', () => { if (!studioIsOpen()) openStudio(); });
studioCloseButton.addEventListener('click', () => closeStudio());
addEventListener('popstate', () => closeStudio(true));
document.addEventListener('keydown', event => {
  if (!studioIsOpen() || document.querySelector('dialog[open]')) return; // the camera dialog handles its own keys
  if (event.key === 'Escape') { closeStudio(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...section.querySelectorAll('button:not([hidden]):not(:disabled), input:not([tabindex="-1"]), canvas')]
    .filter(element => element.offsetParent !== null || element === document.activeElement);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// ---------------------------------------------------------------------------
// Empty-state preview: until the visitor adds a photo or makes a choice, the card alternates
// between outfits, poses and backgrounds so the choices are visible. Pauses off screen and in
// hidden tabs; off for visitors who prefer reduced motion.
// ---------------------------------------------------------------------------
const DEMO_LOOKS = [['kurta', 'namaste', 'doorstep'], ['saree', 'wave', 'fireworks'], ['panche', 'namaste', 'lakshmi-puja'], ['langa', 'wave', 'night-sky'], ['kurta', 'wave', 'balipadyami'], ['saree', 'namaste', 'doorstep'], ['panche', 'wave', 'fireworks'], ['langa', 'namaste', 'lakshmi-puja']];
const DEMO_MS = 2800;
let demoActive = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let demoVisible = false;
let demoTimer = null;
let demoIndex = 0;
const chosen = name => document.querySelector(`input[name="${name}"]:checked`)?.value;
function demoTick() {
  const next = (demoIndex + 1) % DEMO_LOOKS.length;
  lookReady(...DEMO_LOOKS[next]).then(() => {
    if (!demoActive) return;
    demoIndex = next;
    [state.outfit, state.pose, state.scene] = DEMO_LOOKS[next];
    canvas.classList.add('is-swapping');
    setTimeout(() => { render(); canvas.classList.remove('is-swapping'); }, 180);
  });
}
function runDemo() {
  clearInterval(demoTimer);
  demoTimer = demoActive && demoVisible && !document.hidden ? setInterval(demoTick, DEMO_MS) : null;
}
function stopDemo() {
  if (!demoActive) return;
  demoActive = false;
  runDemo();
  canvas.classList.remove('is-swapping');
  state.outfit = chosen('greeting-outfit') || 'kurta';
  state.pose = chosen('greeting-pose') || 'namaste';
  state.scene = chosen('greeting-scene') || 'doorstep';
  updateHint();
  showLook();
}
// Everything else is fetched once the card is on screen, so switching is instant (about 1.5 MB).
let preloaded = false;
function preloadAll() {
  if (preloaded) return;
  preloaded = true;
  preloadOutfits();
  SCENES.forEach(sceneImage);
}
new IntersectionObserver(entries => {
  demoVisible = cardOnScreen = entries[0].isIntersecting;
  if (demoVisible) preloadAll();
  runDemo();
  startAnimation();
}).observe(canvas);
document.addEventListener('visibilitychange', runDemo);
[...outfitInputs, ...poseInputs, ...sceneInputs].forEach(input => input.addEventListener('change', stopDemo));
canvas.addEventListener('pointerdown', stopDemo, { capture: true });
canvas.addEventListener('keydown', stopDemo, { capture: true });

(async () => {
  const fonts = KANNADA
    ? ['400 26px "Prajavani Text"', '600 38px "Prajavani Text"', '700 26px "DM Sans"', '600 38px "Playfair Display"']
    : ['700 26px "DM Sans"', 'italic 600 70px "Playfair Display"', '600 38px "Playfair Display"'];
  await Promise.all(fonts.map(font => document.fonts.load(font, KANNADA ? 'ದೀಪಾವಳಿ Deepavali' : 'Deepavali'))).catch(() => {});
  // Self-hosted logos (same origin), so the card can still be saved as an image.
  const loadLogo = async path => { const img = new Image(); img.crossOrigin = 'anonymous'; img.src = /^https?:/.test(path) ? path : ASSET_BASE + path; await img.decode(); return img; };
  const [publisher, sponsor] = await Promise.allSettled([loadLogo(SITE.cardPublisherLogo || SITE.publisherLogo), SITE.sponsorLogo ? loadLogo(SITE.sponsorLogo) : Promise.reject(), lookReady(state.outfit, state.pose, state.scene)]);
  state.logos = { publisher: publisher.value, sponsor: sponsor.value };
  render();
})();
