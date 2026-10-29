// Post-build checks. Run with:  npm run build && npm run verify
//
// 1. Text fidelity: the visible text inside <main> of dist/index.html and
//    dist/cv.html must equal the text of the Markdown files in
//    src/content (after removing Markdown syntax and collapsing whitespace).
// 2. Every URL written in the originals appears, unchanged, in the built pages.
// 3. Every local href/src/srcset in the built HTML points at a file that exists.
// 4. CNAME, <html lang>, one <h1> per page, <title>, and image alt text.
//
// No dependencies; plain Node.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const original = resolve('src/content');

let failures = 0;
const pass = (msg) => console.log(`  ok    ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`  FAIL  ${msg}`);
};
const check = (cond, msg) => (cond ? pass(msg) : fail(msg));

const normalise = (s) => s.replace(/\s+/g, ' ').trim();

function decodeEntities(s) {
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return s
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
  .replace(/&([a-z]+);/gi, (m, n) => named[n.toLowerCase()] ?? m);
}

// ---------------------------------------------------------------- originals
function readQmd(name) {
  const raw = readFileSync(join(original, name), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
  return { front: m ? m[1] : '', body: m ? raw.slice(m[0].length) : raw };
}

// Pandoc Markdown -> plain text, for the constructs used in these two files.
function bodyToText(body) {
  return body
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/?span\b[^>]*>/gi, '') // inline wrappers: no gap
  .replace(/<\/?[a-z][^>]*>/gi, ' ') // any other HTML tag (div, ...): gap
  .split('\n')
  .filter((line) => line.trim() !== '\\') // Pandoc line-break-only paragraph
  .map((line) => line.replace(/^#{1,6}\s+/, '').replace(/\\\s*$/, ''))
  .join('\n')
  .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/\*([^*]+)\*/g, '$1');
}

const urlsIn = (body) => [...body.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
const frontValues = (front, key) =>
[...front.matchAll(new RegExp(`^\\s*(?:- )?${key}:\\s*(.+)$`, 'gm'))].map((m) => m[1].trim());

// -------------------------------------------------------------------- built
function readBuilt(name) {
  const path = join(dist, name);
  if (!existsSync(path)) {
    fail(`${name} was not built`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

function mainText(html) {
  const m = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/);
  if (!m) return null;
  return normalise(
    decodeEntities(
      m[1]
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '')
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?(?:a|strong|em|b|i|span)(?:\s[^>]*)?>/g, '') // inline: no gap
      .replace(/<[^>]+>/g, ' '), // block-level: gap
    ),
  );
}

function firstDifference(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return `at char ${i}: expected …${JSON.stringify(a.slice(Math.max(0, i - 25), i + 40))} got …${JSON.stringify(b.slice(Math.max(0, i - 25), i + 40))}`;
}

function checkPage(builtName, qmdName, { includeFrontLinkTexts }) {
  console.log(`\n${builtName}  <-  ${qmdName}`);
  const html = readBuilt(builtName);
  if (html === null) return;
  const { front, body } = readQmd(qmdName);

  const expected = normalise(
    [bodyToText(body), ...(includeFrontLinkTexts ? frontValues(front, 'text') : [])].join(' '),
  );
  const actual = mainText(html);
  if (actual === null) return fail('no <main> element found');
  if (actual === expected) pass(`text of <main> is identical to the original (${expected.length} chars)`);
  else fail(`text differs ${firstDifference(expected, actual)}`);

  const hrefs = [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => decodeEntities(m[1]));
  const wanted = [...urlsIn(body), ...frontValues(front, 'href')];
  for (const url of wanted) check(hrefs.includes(url), `URL preserved: ${url}`);

  check(/<html[^>]*\slang="en"/.test(html), '<html lang="en">');
  check(/<title>[^<]+<\/title>/.test(html), '<title> is not empty');
  check((html.match(/<h1\b/g) ?? []).length === 1, 'exactly one <h1>');
  for (const img of html.match(/<img\b[^>]*>/g) ?? [])
    check(/\salt="[^"]+"/.test(img), 'image has alt text');
}

checkPage('index.html', 'index.md', { includeFrontLinkTexts: true });
checkPage('cv.html', 'cv.md', { includeFrontLinkTexts: false });

// ------------------------------------------------------- local link / assets
console.log('\nlocal links and assets');
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
  });
}

function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  const target = join(dist, clean);
  if (clean.endsWith('/')) return existsSync(join(target, 'index.html'));
  // GitHub Pages also serves /cv for cv.html
  return (existsSync(target) && statSync(target).isFile()) || existsSync(`${target}.html`);
}

for (const file of htmlFiles(dist)) {
  const html = readFileSync(file, 'utf8');
  const refs = [];
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) refs.push(decodeEntities(m[1]));
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g))
    for (const part of decodeEntities(m[1]).split(',')) refs.push(part.trim().split(/\s+/)[0]);
    for (const ref of refs) {
      if (!ref.startsWith('/') || ref.startsWith('//')) continue;
        check(resolves(ref), `${file.slice(dist.length + 1)} -> ${ref}`);
    }
}

// ------------------------------------------------------------- deployment
console.log('\ndeployment');
const cname = join(dist, 'CNAME');
check(existsSync(cname) && readFileSync(cname, 'utf8').trim() === 'maharremayar.com', 'dist/CNAME is maharremayar.com');

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
