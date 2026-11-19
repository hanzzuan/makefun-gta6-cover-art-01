// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone, full frame. `photo` picks the
// sample (samples/<photo>.jpg), `caption` the words, `layout`, `grade` and
// `size` the cover's settings. window.__shotReady is set once painted.
import { loadImage } from './main.js';

export async function runShot(shot, query, apply) {
  const photoName = query.get('photo') ?? 'pier';
  const otherName = photoName === 'pier' ? 'boulevard' : 'pier';
  const first = await loadImage(`samples/${photoName}.jpg`);
  const second = await loadImage(`samples/${otherName}.jpg`);
  const caption = query.get('caption') ?? 'Sunset Coast';
  const subtitle = query.get('subtitle') ?? 'a night on the boulevard';
  const layout = query.get('layout') ?? 'grid';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? 'square';
  await apply({
    layout,
    grade,
    size,
    caption,
    subtitle,
    photos: [first, second, first, second],
    panels: [
      { photo: 0, zoom: 1.15, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.1, ox: 0, oy: 0.05 },
      { photo: 0, zoom: 1.25, ox: 0.05, oy: 0 },
      { photo: 1, zoom: 1.05, ox: 0, oy: -0.05 },
    ],
  });
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
