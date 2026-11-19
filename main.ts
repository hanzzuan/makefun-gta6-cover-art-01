// Neon Coast — Cover Studio, a working gta6-cover-art-01 entry (Node 22, standard library only): the app is
// this directory's app/ folder, plain static files a desktop browser loads offline (app/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. The app turns any photo into a multi-panel poster-style cover — four layouts, four sunset and
// neon colour grades, per-panel crop and position, bold caption lettering — exported as a PNG in 1080 x 1080,
// 1080 x 1350 or 1920 x 1080. Its two sample photos (app/samples/) were made for make.fun with an image model
// and are free to use. Put 3 or 4 PNG or JPEG screenshots in screenshots/ (the first by name is the cover) and
// run it. Screenshots and sample photos are stored in the repo as base64 text (*.b64) and decoded back to real
// images by this program, so the text-only push path carries them byte-exactly.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });

// Binary assets live in the repo as base64 text files (*.b64) so the
// text-only push path carries them byte-exactly. Decode each one back to
// the real file it stands for, in app/ (the sample photos) and in
// screenshots/ below; plain files pass through as-is.
function decodeB64Tree(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) decodeB64Tree(path);
    else if (entry.name.endsWith('.b64')) {
      writeFileSync(join(dir, basename(entry.name, '.b64')), Buffer.from(readFileSync(path, 'utf8').replace(/\s+/g, ''), 'base64'));
      rmSync(path);
    }
  }
}
decodeB64Tree(join(out, 'app'));
const shots = join(here, 'screenshots');
if (existsSync(shots)) {
  for (const name of readdirSync(shots).sort()) {
    const src = join(shots, name);
    if (name.endsWith('.b64')) {
      writeFileSync(join(out, 'screenshots', basename(name, '.b64')), Buffer.from(readFileSync(src, 'utf8').replace(/\s+/g, ''), 'base64'));
    } else {
      cpSync(src, join(out, 'screenshots', name));
    }
  }
}

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
