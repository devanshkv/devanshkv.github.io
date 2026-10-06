// ORCID identifies this author more reliably than OpenAlex's merged author ID.
// ponytail: newest 100 records cover this bibliography; paginate if it outgrows that limit.
export const publicationsEndpoint = 'https://api.openalex.org/works?filter=authorships.author.orcid:0000-0003-0385-491X&select=id,doi,title,publication_year,type,primary_location&per_page=100&sort=publication_date:desc';

export function normalizePapers(data) {
  if (!Array.isArray(data?.results)) return [];
  const papers = new Map();
  for (const work of data.results) {
    const source = work?.primary_location?.source;
    if (!['article', 'conference-paper', 'review', 'software-paper'].includes(work?.type)) continue;
    if (!['journal', 'conference'].includes(source?.type)) continue;
    if (source.display_name === 'Astrophysics Source Code Library') continue;
    if (typeof work.title !== 'string' || !work.title.trim() || !Number.isInteger(work.publication_year)) continue;
    let url;
    try {
      url = new URL(work.doi || work.primary_location.landing_page_url || work.id);
      if (url.protocol !== 'https:' || url.username || url.password) continue;
    } catch { continue; }
    const title = work.title.trim();
    const key = title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (!key || papers.has(key)) continue;
    papers.set(key, {
      title,
      year: work.publication_year,
      venue: typeof source.display_name === 'string' ? source.display_name : '',
      url: url.href,
    });
  }
  return [...papers.values()].sort((a, b) => b.year - a.year);
}
