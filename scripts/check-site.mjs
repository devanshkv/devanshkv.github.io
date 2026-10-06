import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { normalizePapers } from '../src/lib/papers.mjs';

// One check covers filtering, duplicate versions, and untrusted API links.
const paperRecords = [
  { title: 'An example paper', type: 'article', publication_year: 2023, doi: 'https://doi.org/10.example/paper', primary_location: { source: { type: 'journal', display_name: 'Example Journal' } } },
  { title: 'An example paper!', type: 'article', publication_year: 2022, doi: 'https://doi.org/10.example/duplicate', primary_location: { source: { type: 'journal' } } },
  { title: 'Dataset', type: 'dataset', publication_year: 2024, doi: 'https://doi.org/10.example/dataset', primary_location: { source: { type: 'repository' } } },
  { title: 'Unsafe link', type: 'article', publication_year: 2024, doi: 'javascript:alert(1)', primary_location: { source: { type: 'journal' } } },
  { title: 'Code registry', type: 'article', publication_year: 2020, doi: 'https://doi.org/10.example/code', primary_location: { source: { type: 'journal', display_name: 'Astrophysics Source Code Library' } } },
  { title: 'Unpublished preprint', type: 'preprint', publication_year: 2025, doi: 'https://doi.org/10.example/preprint', primary_location: { source: { type: 'repository' } } },
  null,
];
assert.deepEqual(normalizePapers({ results: paperRecords }), [{ title: 'An example paper', year: 2023, venue: 'Example Journal', url: 'https://doi.org/10.example/paper' }]);
assert.deepEqual(normalizePapers({ error: 'unavailable' }), []);

const root = path.resolve('dist');
const origin = 'https://devanshkv.github.io';
const routes = ['/', '/work/', '/publications/', '/about/', '/teaching/'];
const pages = new Map();

for (const file of await readdir(root, { recursive: true })) {
  if (file.endsWith('.html')) pages.set(file, await readFile(path.join(root, file), 'utf8'));
}

for (const route of routes) {
  const file = `${route.slice(1)}index.html`;
  const html = pages.get(file);
  assert.ok(html, `Missing page: ${route}`);
  assert.match(html, /<html[^>]*lang="en"/, `Missing page language: ${route}`);
  assert.match(html, /name="description"/, `Missing description: ${route}`);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `Expected one main heading: ${route}`);
}

let links = 0;
for (const [file, html] of pages) {
  assert.doesNotMatch(html, /mailto:|[\w.%+-]+@[\w.-]+\.[a-z]{2,}|\/blog\//i, `Removed private contact or blog content remains in ${file}`);
  assert.doesNotMatch(html, /github\.com\/devanshkv\/(?:argmark|docclean|fetch|your)(?:["\/?#]|&)/i, `Old repository promotion remains in ${file}`);
  const headings = [];
  for (const [tag, level] of html.matchAll(/<\/?h([1-6])(?:\s[^>]*)?>/g)) {
    if (tag.startsWith('</')) assert.equal(headings.pop(), level, `Mismatched heading in ${file}: ${tag}`);
    else headings.push(level);
  }
  assert.equal(headings.length, 0, `Unclosed heading in ${file}`);
  const pageUrl = new URL(file.replace(/index\.html$/, ''), `${origin}/`);
  for (const [, attribute, value] of html.matchAll(/\b(href|src)="([^"]+)"/g)) {
    const url = new URL(value.replaceAll('&amp;', '&'), pageUrl);
    if (url.origin !== origin) continue;
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
    const target = path.join(root, relative);
    let destination;
    try {
      destination = (await stat(target)).isDirectory() ? path.join(target, 'index.html') : target;
      await stat(destination);
    } catch {
      assert.fail(`Broken ${attribute} in ${file}: ${value}`);
    }
    if (attribute === 'href' && url.hash && destination.endsWith('.html')) {
      const destinationHtml = pages.get(path.relative(root, destination));
      assert.ok(destinationHtml?.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor in ${file}: ${value}`);
    }
    links++;
  }
}

const home = pages.get('index.html');
assert.match(home, /Devansh Agarwal/);
assert.match(home, /AI systems that scale/);
assert.match(home, /\/_astro\/portrait-natural\.[^"\s]+\.webp/);
assert.match(pages.get('about/index.html'), /\/_astro\/portrait-natural\.[^"\s]+\.webp/);
assert.match(home, /Tempus AI/);
assert.match(home, /astronomical images/);
assert.match(home, /CT and MRI/);
assert.match(home, /genomic data/);
assert.match(home, /patient outcomes/);
assert.equal((home.match(/class="publication-title"/g) || []).length, 4, 'Home should show four papers from the feed');
const bibliography = pages.get('publications/index.html');
assert.match(bibliography, /data-publication-feed/);
assert.match(bibliography, /Bibliography via/);
assert.match(bibliography, /openalex.org/);
assert.match(bibliography, /Masked Image Modeling Advances 3D Medical Image Analysis/);
assert.match(bibliography, /FETCH: A deep-learning based classifier for fast transient classification/);
assert.match(bibliography, /Your: Your Unified Reader/);
const snapshot = JSON.parse(await readFile('src/data/publications.json', 'utf8'));
assert.equal((bibliography.match(/class="publication-title"/g) || []).length, snapshot.papers.length, 'All saved papers must render without JavaScript');
const projects = pages.get('projects/index.html');
assert.ok(projects?.includes('/work/'), 'Legacy project route must lead to current work');
assert.match(pages.get('404.html'), /name="robots" content="noindex"/, 'Error page should not be indexed');
assert.ok(!pages.has('blog/index.html') && !pages.has('blog/image_translator/index.html'), 'Removed blog must not be built');
assert.ok(!(await readdir(root)).includes('resume'), 'Old resume contains personal contact details and must not be published');
console.log(`Checked ${pages.size} generated pages and ${links} local links/assets. All checks passed.`);
