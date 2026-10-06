import { writeFile } from 'node:fs/promises';
import { normalizePapers, publicationsEndpoint } from '../src/lib/papers.mjs';

const response = await fetch(publicationsEndpoint, { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`Publication source returned HTTP ${response.status}`);
const papers = normalizePapers(await response.json());
if (!papers.length) throw new Error('Publication source returned no usable papers; keeping the saved bibliography.');
await writeFile(new URL('../src/data/publications.json', import.meta.url), JSON.stringify({ updatedAt: new Date().toISOString().slice(0, 10), papers }, null, 2) + '\n');
console.log(`Saved ${papers.length} publications from OpenAlex.`);
