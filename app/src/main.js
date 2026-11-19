// Neon Coast — Cover Studio: wires the editor. Pick photos, choose a layout,
// grade and post size, drag a panel to reposition its photo, type a caption,
// and export the cover as a PNG. A `?shot=` query sets up a fixed scene for
// a screenshot instead (./shots.js). Photos stay on the machine: nothing is
// uploaded, and the app makes no network request.
import { drawCover, panelAt, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const status = document.getElementById('status');
const zoomInput = document.getElementById('zoom');
const panelLabel = document.getElementById('panel-label');

/** The editor's state: four photo slots, one panel setting per layout slot. */
export const state = {
  layout: 'grid',
  grade: 'sunset',
  size: 'square',
  caption: 'Sunset Coast',
  subtitle: 'a night on the boulevard',
  photos: [null, null, null, null],
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
  ],
};
let selectedPanel = 0;
let dragging = null;

function redraw() {
  const size = SIZES[state.size];
  if (!document.body.classList.contains('shot-cover')) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function selectPanel(i) {
  selectedPanel = i;
  const panel = state.panels[i];
  zoomInput.value = String(Math.round((panel.zoom || 1) * 100));
  panelLabel.textContent = `Panel ${i + 1} — photo ${panel.photo + 1}, drag to move, slider to zoom`;
}

/** Marks the option buttons that match the current state (used after a shot sets it). */
function syncOptions() {
  const groups = [
    ['layouts', state.layout],
    ['grades', state.grade],
    ['sizes', state.size],
  ];
  groups.forEach(([id, current]) => {
    document.getElementById(id).querySelectorAll('.opt').forEach((el) => {
      el.classList.toggle('on', el.dataset.key === current);
    });
  });
}
function buildOptions(containerId, options, current, onPick) {
  const box = document.getElementById(containerId);
  Object.entries(options).forEach(([key, value]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.textContent = value.label;
    b.dataset.key = key;
    if (key === current) b.classList.add('on');
    b.addEventListener('click', () => {
      box.querySelectorAll('.opt').forEach((el) => el.classList.remove('on'));
      b.classList.add('on');
      onPick(key);
      redraw();
    });
    box.appendChild(b);
  });
}

buildOptions('layouts', LAYOUTS, state.layout, (key) => {
  state.layout = key;
  selectPanel(0);
});
buildOptions('grades', GRADES, state.grade, (key) => {
  state.grade = key;
});
buildOptions('sizes', SIZES, state.size, (key) => {
  state.size = key;
});

// Photo slots: a file picker and a sample button each.
for (let slot = 0; slot < 4; slot++) {
  const input = document.getElementById(`photo-${slot}`);
  input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    state.photos[slot] = await loadImage(URL.createObjectURL(file));
    status.textContent = `Photo ${slot + 1} loaded.`;
    redraw();
  });
  document.getElementById(`sample-${slot}`).addEventListener('click', async () => {
    const sample = slot % 2 === 0 ? 'samples/pier.jpg' : 'samples/boulevard.jpg';
    state.photos[slot] = await loadImage(sample);
    status.textContent = `Photo ${slot + 1} filled with a sample.`;
    redraw();
  });
}

document.getElementById('fill-all').addEventListener('click', () => {
  const first = state.photos[0];
  if (!first) {
    status.textContent = 'Load photo 1 first, then fill every panel with it.';
    return;
  }
  state.panels.forEach((p) => {
    p.photo = 0;
  });
  status.textContent = 'Every panel now shows photo 1.';
  redraw();
});

zoomInput.addEventListener('input', () => {
  state.panels[selectedPanel].zoom = Number(zoomInput.value) / 100;
  redraw();
});

captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});

// Click a panel to select it; drag it to pan its photo.
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state, p.x, p.y, canvas.width, canvas.height);
  if (hit < 0) return;
  selectPanel(hit);
  dragging = { x: p.x, y: p.y };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const panel = state.panels[selectedPanel];
  const layout = LAYOUTS[state.layout];
  const rect = layout.panels[selectedPanel];
  panel.ox = Math.max(-0.5, Math.min(0.5, (panel.ox || 0) + (p.x - dragging.x) / (rect.w * canvas.width)));
  panel.oy = Math.max(-0.5, Math.min(0.5, (panel.oy || 0) + (p.y - dragging.y) / (rect.h * canvas.height)));
  dragging = p;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  dragging = null;
});

// Export: render the same state at the chosen post size and download the PNG.
document.getElementById('export').addEventListener('click', () => {
  const size = SIZES[state.size];
  const out = document.createElement('canvas');
  out.width = size.w;
  out.height = size.h;
  drawCover(out, state);
  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, async (setup) => {
    Object.assign(state, setup);
    captionInput.value = state.caption;
    subtitleInput.value = state.subtitle;
    syncOptions();
    selectPanel(0);
    if (shot === 'cover') {
      document.body.classList.add('shot-cover');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    redraw();
  });
} else {
  selectPanel(0);
  redraw();
}
