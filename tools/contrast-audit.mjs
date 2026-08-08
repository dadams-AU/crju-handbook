#!/usr/bin/env node
/**
 * Colour-contrast audit for this handbook site (WCAG 2.2 SC 1.4.3, Contrast Minimum).
 *
 * Serves the repo, drives headless Chromium over the DevTools protocol, and measures
 * the real computed contrast of every text node on every page, in both themes.
 *
 *   node tools/contrast-audit.mjs                  # all pages, both themes, both modes
 *   node tools/contrast-audit.mjs index.html       # just one page
 *   node tools/contrast-audit.mjs --mode=checker   # only the checker-emulation pass
 *   node tools/contrast-audit.mjs --json           # machine-readable output
 *
 * Exits non-zero if anything fails, so it can gate a commit or CI run.
 *
 * Two passes, because they answer different questions:
 *
 *   true    - what a sighted user actually sees. Resolves gradients (worst-case stop)
 *             and composites translucent layers up the ancestor chain.
 *   checker - what WAVE/axe-style tools see. They read `background-color` only, so an
 *             element whose colour comes from a `linear-gradient` (a background-IMAGE)
 *             looks transparent and they fall through to the page background. This is
 *             why every gradient background in this repo also sets an explicit
 *             `background-color` fallback; without it these tools report white-on-white.
 *
 * No dependencies. Needs `node` (>=18, for global fetch/WebSocket) and a Chromium build.
 */

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const hit = argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const has = name => argv.includes(`--${name}`);

const MODES = flag('mode', 'both') === 'both' ? ['true', 'checker'] : [flag('mode', 'both')];
const THEMES = flag('theme', 'both') === 'both' ? ['light', 'dark'] : [flag('theme', 'both')];
const EXPAND = !has('no-expand');
const AS_JSON = has('json');
const pageArgs = argv.filter(a => !a.startsWith('--'));

// ------------------------------------------------------------- static server

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.pdf': 'application/pdf', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

function serve() {
  const server = createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const file = resolve(ROOT, rel);
      if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  return new Promise(ok => server.listen(0, '127.0.0.1', () => ok(server)));
}

// --------------------------------------------------------------- chromium

function findChromium() {
  const candidates = [
    process.env.CHROME_PATH, 'chromium', 'chromium-browser',
    'google-chrome-stable', 'google-chrome', 'chrome',
  ].filter(Boolean);
  for (const c of candidates) {
    if (c.includes('/')) { if (existsSync(c)) return c; continue; }
    for (const dir of (process.env.PATH || '').split(':')) {
      if (dir && existsSync(join(dir, c))) return join(dir, c);
    }
  }
  return null;
}

/**
 * A fresh profile AND an ephemeral port per launch are both required. Chromium will
 * otherwise hand the request off to an already-running instance holding the default
 * profile, and you get answers from a stale page — results that look real but predate
 * your edits.
 */
async function launchChromium(bin) {
  const profile = await mkdtemp(join(tmpdir(), 'contrast-audit-'));
  const port = 9000 + Math.floor((process.pid * 7919) % 40000);
  const proc = spawn(bin, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-sandbox', '--disable-gpu', '--hide-scrollbars',
    '--window-size=1280,2000', 'about:blank',
  ], { stdio: 'ignore' });

  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = tabs.find(t => t.type === 'page');
      if (page) return { proc, profile, wsUrl: page.webSocketDebuggerUrl };
    } catch { /* not up yet */ }
  }
  throw new Error('Chromium did not expose a debugging port');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let id = 0;
  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    const p = pending.get(m.id);
    if (!p) return;
    pending.delete(m.id);
    m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result);
  });
  const ready = new Promise(ok => ws.addEventListener('open', ok, { once: true }));
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const i = ++id;
    pending.set(i, { resolve, reject });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  return { ws, ready, send };
}

// ------------------------------------------------- code evaluated in the page
// Defined as real functions and stringified, rather than built as template
// strings — that keeps regex backslashes from needing double-escaping.

function pageReadyProbe() {
  const themed = !!document.querySelector('.header');
  const header = document.querySelector('.header');
  return JSON.stringify({
    state: document.readyState,
    themed,
    theme: document.documentElement.getAttribute('data-theme'),
    headerBg: header ? getComputedStyle(header).backgroundImage.slice(0, 60) : 'n/a',
    sheets: document.styleSheets.length,
  });
}

function settlePage(expand) {
  // 1. `transition: color` on <a> means a freshly-themed page reports in-flight colours.
  const style = document.createElement('style');
  style.textContent = '*,*::before,*::after{transition:none !important;animation:none !important}';
  document.head.appendChild(style);
  // 2. Content inside a closed <details> lives in a style-recalc-skipped subtree, so
  //    getComputedStyle there returns stale pre-theme colours. Opening forces a real
  //    recalc and measures what the user sees once they expand it.
  if (expand) document.querySelectorAll('details').forEach(d => { d.open = true; });
  void document.body.offsetHeight;
  return true;
}

function auditPage(checkerMode) {
  const parse = c => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (x, y) => {
    const a = lum(x), b = lum(y);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  // Gradient colour stops resolve to rgb() in computed style.
  const gradientStops = img => {
    if (!img || img === 'none' || !/gradient/.test(img)) return [];
    return (img.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(c => c && c.a > 0);
  };

  // Walk up compositing background layers. Returns every candidate backdrop; a
  // gradient contributes one per stop so the caller can score the worst case.
  const backdrops = el => {
    const layers = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      const stops = checkerMode ? [] : gradientStops(cs.backgroundImage);
      const solid = parse(cs.backgroundColor);
      if (stops.length) { layers.push(stops); if (stops.every(s => s.a >= 1)) break; }
      if (solid && solid.a > 0) { layers.push([solid]); if (solid.a >= 1) break; }
      if (!checkerMode && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) {
        layers.push([{ r: 128, g: 128, b: 128, a: 1 }]); // unknown bitmap; assume mid-grey
        break;
      }
      node = node.parentElement;
    }
    layers.push([{ r: 255, g: 255, b: 255, a: 1 }]); // canvas
    let base = layers[layers.length - 1][0];
    for (let i = layers.length - 2; i >= 1; i--) {
      const c = layers[i][0];
      base = c.a >= 1 ? c : over(c, base);
    }
    return layers[0].map(c => (c.a >= 1 ? c : over(c, base)));
  };

  // Visually-hidden text is exempt: it is never rendered to a sighted user.
  const isClipped = el => {
    let n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      if (cs.clipPath === 'inset(50%)' || cs.clip === 'rect(0px, 0px, 0px, 0px)') return true;
      if (r.width <= 1 && r.height <= 1 && cs.overflow === 'hidden') return true;
      n = n.parentElement;
    }
    return false;
  };

  const describe = el => {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && parts.length < 4) {
      let s = n.tagName.toLowerCase();
      if (n.id) { parts.unshift(s + '#' + n.id); break; }
      if (typeof n.className === 'string' && n.className.trim()) {
        s += '.' + n.className.trim().split(/\s+/).slice(0, 3).join('.');
      }
      parts.unshift(s);
      n = n.parentElement;
    }
    return parts.join(' > ');
  };

  const results = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const text = node.nodeValue.trim();
    if (!text) continue;
    const el = node.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    if (isClipped(el)) continue;

    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;

    // Worst-case stop wins: text must stay legible across the whole gradient.
    const cands = backdrops(el);
    let bg = cands[0], cr = Infinity;
    for (const cand of cands) {
      const f = fgRaw.a < 1 ? over(fgRaw, cand) : fgRaw;
      const c = ratio(f, cand);
      if (c < cr) { cr = c; bg = cand; }
    }

    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const needs = large ? 3 : 4.5;
    if (cr >= needs) continue;

    // Checker tools report per element; the true pass reports per distinct run of text.
    const key = checkerMode
      ? describe(el) + '|' + Math.round(rect.top) + '|' + Math.round(rect.left)
      : cs.color + '|' + Math.round(rect.top) + '|' + text.slice(0, 30);
    if (seen.has(key)) continue;
    seen.add(key);

    results.push({
      text: text.slice(0, 70),
      selector: describe(el),
      fg: cs.color,
      bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      ratio: Math.round(cr * 100) / 100,
      needs,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
    });
  }
  return JSON.stringify(results);
}

// ------------------------------------------------------------------- driver

async function auditUrl(send, url, theme, checkerMode) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: theme }],
  });
  await send('Page.navigate', { url });

  let state = null;
  for (let i = 0; i < 60; i++) {
    await sleep(250);
    const { result } = await send('Runtime.evaluate', {
      expression: `(${pageReadyProbe})()`, returnByValue: true,
    });
    if (!result.value) continue;
    const s = JSON.parse(result.value);
    // Themed pages must show the painted gradient; plain pages just need their sheets.
    const settled = s.themed ? (s.theme && /gradient/.test(s.headerBg)) : s.sheets > 0;
    if (s.state === 'complete' && settled) { state = s; break; }
    state = s;
  }
  if (!state || state.state !== 'complete') {
    throw new Error(`page never settled: ${url} (${JSON.stringify(state)})`);
  }

  await send('Runtime.evaluate', { expression: `(${settlePage})(${EXPAND})`, returnByValue: true });
  await sleep(400);

  const { result } = await send('Runtime.evaluate', {
    expression: `(${auditPage})(${checkerMode})`, returnByValue: true,
  });
  return JSON.parse(result.value);
}

async function main() {
  const bin = findChromium();
  if (!bin) {
    console.error('No Chromium found. Install chromium, or set CHROME_PATH=/path/to/chrome');
    process.exit(2);
  }

  const pages = pageArgs.length
    ? pageArgs
    : (await readdir(ROOT))
        .filter(f => f.endsWith('.html') && !f.startsWith('lighthouse'))
        .sort();

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const { proc, profile, wsUrl } = await launchChromium(bin);
  const { ws, ready, send } = connect(wsUrl);
  await ready;
  await send('Page.enable');
  await send('Runtime.enable');

  const report = [];
  let failures = 0;
  try {
    for (const page of pages) {
      for (const theme of THEMES) {
        for (const mode of MODES) {
          const found = await auditUrl(send, `${base}/${page}`, theme, mode === 'checker');
          failures += found.length;
          report.push({ page, theme, mode, findings: found });
          if (!AS_JSON) {
            const label = `${page.padEnd(20)} ${theme.padEnd(6)} ${mode.padEnd(8)}`;
            if (!found.length) {
              console.log(`  PASS  ${label}`);
            } else {
              console.log(`  FAIL  ${label} ${found.length} finding(s)`);
              for (const f of found) {
                console.log(`          ${f.ratio}:1 (needs ${f.needs}) ${f.fg} on ${f.bg}`);
                console.log(`          ${f.selector}`);
                console.log(`          ${JSON.stringify(f.text)}\n`);
              }
            }
          }
        }
      }
    }
  } finally {
    ws.close();
    proc.kill();
    server.close();
    await rm(profile, { recursive: true, force: true }).catch(() => {});
  }

  if (AS_JSON) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(failures === 0
      ? `\nAll clear — ${report.length} run(s), 0 contrast failures.`
      : `\n${failures} contrast failure(s) across ${report.length} run(s).`);
  }
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => { console.error(err); process.exit(2); });
