// Neon Coast cover engine: draws a multi-panel poster-style cover from photos,
// a caption and a colour grade onto any 2D canvas. Everything is drawn by hand
// with the canvas API: no image assets, no fonts shipped, no network use.
// The cover's look is our own: white panel frames, a sunset or neon grade,
// bold stacked lettering and a film grain finish.

/** The four panel arrangements, each a list of panel rects in 0..1 space. */
export const LAYOUTS = {
  grid: {
    label: 'Four-panel grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.0, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, rot: 0 },
    ],
    title: 'bottom',
  },
  hero: {
    label: 'Hero and three',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.62, rot: 0 },
      { x: 0.0, y: 0.62, w: 1 / 3, h: 0.38, rot: 0 },
      { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38, rot: 0 },
      { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38, rot: 0 },
    ],
    title: 'bottom',
  },
  tilted: {
    label: 'Tilted snapshots',
    panels: [
      { x: 0.04, y: 0.30, w: 0.42, h: 0.42, rot: -0.07 },
      { x: 0.52, y: 0.22, w: 0.44, h: 0.44, rot: 0.05 },
      { x: 0.28, y: 0.58, w: 0.46, h: 0.36, rot: -0.02 },
    ],
    title: 'top',
  },
  fullbleed: {
    label: 'Full bleed',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0, rot: 0 }],
    title: 'bottom',
  },
};

/** The colour grades: each a list of [gradient stops] plus a wash colour. */
export const GRADES = {
  sunset: {
    label: 'Sunset',
    sky: ['#2b1055', '#7597de'],
    wash: 'rgba(255, 110, 60, 0.34)',
    deep: 'rgba(200, 40, 120, 0.42)',
    accent: '#ff7a3d',
  },
  neon: {
    label: 'Neon night',
    sky: ['#12002e', '#3b0f66'],
    wash: 'rgba(255, 0, 128, 0.30)',
    deep: 'rgba(0, 229, 255, 0.26)',
    accent: '#00e5ff',
  },
  palm: {
    label: 'Palm gold',
    sky: ['#06302b', '#0f766e'],
    wash: 'rgba(255, 190, 60, 0.30)',
    deep: 'rgba(6, 90, 70, 0.38)',
    accent: '#ffd166',
  },
  noir: {
    label: 'Noir',
    sky: ['#101014', '#2c2c38'],
    wash: 'rgba(180, 200, 255, 0.16)',
    deep: 'rgba(0, 0, 0, 0.42)',
    accent: '#e8e8f0',
  },
};

/** The post sizes the app exports. */
export const SIZES = {
  square: { label: 'Square · 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 x 1080', w: 1920, h: 1080 },
};

/** A small deterministic random stream, so the grain is stable per cover. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
export function drawPanelPhoto(ctx, photo, rect, panel, w, h) {
  const px = rect.x * w;
  const py = rect.y * h;
  const pw = rect.w * w;
  const ph = rect.h * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  if (photo) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight) * zoom;
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const ox = (panel.ox || 0) * pw;
    const oy = (panel.oy || 0) * ph;
    ctx.drawImage(photo, px + (pw - dw) / 2 + ox, py + (ph - dh) / 2 + oy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(px, py, px + pw, py + ph);
    g.addColorStop(0, '#3a2b4d');
    g.addColorStop(1, '#1c1426');
    ctx.fillStyle = g;
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = `600 ${Math.round(ph * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
  }
  ctx.restore();
}

/** Washes the whole cover with the grade's colours and a vignette. */
export function applyGrade(ctx, grade, w, h) {
  const g = GRADES[grade] || GRADES.sunset;
  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, g.wash);
  wash.addColorStop(1, g.deep);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.78, h * 0.16, 0, w * 0.78, h * 0.16, w * 0.5);
  sun.addColorStop(0, 'rgba(255, 220, 140, 0.28)');
  sun.addColorStop(1, 'rgba(255, 220, 140, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

/** Sprinkles a light film grain over the cover. */
export function applyGrain(ctx, seed, w, h) {
  const rand = seededRandom(seed);
  const count = Math.round((w * h) / 900);
  ctx.save();
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < count; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Fits a caption to one line, shrinking the type until it fits. */
export function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 4;
    ctx.font = `900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

/** Draws the caption, subtitle and accent rule in the title zone. */
export function drawTitleBlock(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid;
  const caption = (state.caption || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const top = layout.title === 'top';
  const bandH = h * (top ? 0.2 : 0.26);
  const bandY = top ? 0 : h - bandH;

  // A dark scrim behind the lettering so it reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (top) {
    scrim.addColorStop(0, 'rgba(10, 6, 18, 0.78)');
    scrim.addColorStop(1, 'rgba(10, 6, 18, 0)');
  } else {
    scrim.addColorStop(0, 'rgba(10, 6, 18, 0)');
    scrim.addColorStop(1, 'rgba(10, 6, 18, 0.82)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, w, bandH);

  if (!caption) return;
  const margin = w * 0.055;
  const maxWidth = w - margin * 2;
  const size = fitCaption(ctx, caption, maxWidth, Math.round(h * 0.105));
  try {
    ctx.letterSpacing = `${Math.round(size * 0.04)}px`;
  } catch (e) {
    /* letterSpacing is Chrome-only; the fallback is plain bold type. */
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const baseY = top ? bandY + h * 0.115 : h - h * 0.12;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.strokeStyle = 'rgba(12, 6, 20, 0.9)';
  ctx.strokeText(caption, margin, baseY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(caption, margin, baseY);
  try {
    ctx.letterSpacing = '0px';
  } catch (e) {
    /* reset for the subtitle below */
  }

  // Accent rule under the caption, in the grade's colour.
  const ruleY = baseY + size * 0.24;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(margin, ruleY, Math.min(maxWidth * 0.42, size * 4.4), Math.max(3, size * 0.07));

  if (subtitle) {
    ctx.font = `italic 600 ${Math.round(size * 0.34)}px Georgia, "Times New Roman", serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(subtitle, margin, ruleY + size * 0.42);
  }
}

/** Draws the whole cover for `state` onto the canvas, at the canvas's own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid;
  const grade = GRADES[state.grade] || GRADES.sunset;

  // Sky backdrop: the grade's own gradient, so empty panels still read as a poster.
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(1, grade.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.008));
  const frame = gap * 1.6;
  ctx.fillStyle = '#f5f1ea';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = sky;
  ctx.fillRect(frame, frame, w - frame * 2, h - frame * 2);

  layout.panels.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo] || null;
    // Panels live inside the outer white frame.
    const inner = {
      x: (frame + rect.x * (w - frame * 2)) / w,
      y: (frame + rect.y * (h - frame * 2)) / h,
      w: (rect.w * (w - frame * 2)) / w,
      h: (rect.h * (h - frame * 2)) / h,
      rot: rect.rot,
    };
    ctx.save();
    if (inner.rot) {
      const cx = (inner.x + inner.w / 2) * w;
      const cy = (inner.y + inner.h / 2) * h;
      ctx.translate(cx, cy);
      ctx.rotate(inner.rot);
      ctx.translate(-cx, -cy);
    }
    const inset = {
      x: inner.x + gap / w,
      y: inner.y + gap / h,
      w: inner.w - (gap * 2) / w,
      h: inner.h - (gap * 2) / h,
    };
    drawPanelPhoto(ctx, photo, inset, panel, w, h);
    ctx.strokeStyle = '#f5f1ea';
    ctx.lineWidth = Math.max(2, gap);
    ctx.strokeRect(inset.x * w + 1, inset.y * h + 1, inset.w * w - 2, inset.h * h - 2);
    ctx.restore();
  });

  applyGrade(ctx, state.grade, w, h);
  drawTitleBlock(ctx, state, w, h);
  const seed = (state.caption || '').length * 7919 + state.layout.length * 131 + state.grade.length * 17;
  applyGrain(ctx, seed, w, h);
}

/** Returns the panel index (in canvas pixels) under point (x, y), or -1. */
export function panelAt(state, x, y, w, h) {
  const layout = LAYOUTS[state.layout] || LAYOUTS.grid;
  const gap = Math.max(3, Math.round(Math.min(w, h) * 0.008));
  const frame = gap * 1.6;
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const r = layout.panels[i];
    const px = frame + r.x * (w - frame * 2);
    const py = frame + r.y * (h - frame * 2);
    const pw = r.w * (w - frame * 2);
    const ph = r.h * (h - frame * 2);
    if (x >= px && x <= px + pw && y >= py && y <= py + ph) return i;
  }
  return -1;
}
