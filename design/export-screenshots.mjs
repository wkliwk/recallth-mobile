#!/usr/bin/env node
// Export each phone frame in recallth-mobile-design-v1.html as a PNG.
// Usage: node design/export-screenshots.mjs
// Requires: npm i -D playwright (then `npx playwright install chromium`)

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = path.resolve(__dirname, 'recallth-mobile-design-v1.html');
const WIRE_OUT = path.resolve(__dirname, 'wireframes');
const HIFI_OUT = path.resolve(__dirname, 'mockups');

const screens = [
  // Tier 1 — wireframes (one phone frame per index in source order, 0..5)
  { idx: 0, name: '01-onboarding', dir: WIRE_OUT },
  { idx: 1, name: '02-home', dir: WIRE_OUT },
  { idx: 2, name: '03-cabinet', dir: WIRE_OUT },
  { idx: 3, name: '04-chat', dir: WIRE_OUT },
  { idx: 4, name: '05-profile', dir: WIRE_OUT },
  { idx: 5, name: '06-history', dir: WIRE_OUT },
  // Tier 2 — hi-fi mockups (indexes 6..8)
  { idx: 6, name: '01-home-hifi', dir: HIFI_OUT },
  { idx: 7, name: '02-cabinet-hifi', dir: HIFI_OUT },
  { idx: 8, name: '03-chat-hifi', dir: HIFI_OUT },
];

await fs.mkdir(WIRE_OUT, { recursive: true });
await fs.mkdir(HIFI_OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ deviceScaleFactor: 2 });
const page = await context.newPage();
await page.goto('file://' + HTML);
await page.waitForLoadState('networkidle');

const phones = await page.$$('.phone');
console.log(`Found ${phones.length} phone frames.`);

for (const s of screens) {
  const el = phones[s.idx];
  if (!el) { console.warn(`Skip ${s.name}: no element at index ${s.idx}`); continue; }
  const out = path.join(s.dir, s.name + '.png');
  await el.screenshot({ path: out, omitBackground: false });
  console.log('  ✓', path.relative(__dirname, out));
}

await browser.close();
console.log('Done.');
