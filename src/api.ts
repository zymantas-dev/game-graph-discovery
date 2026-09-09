import { catalog, type Attribute, type Game } from './data';
import { relatedGames, type Filter } from './graph';
type RawGame = { id: number; slug: string; name: string; background_image: string | null; released: string | null; description_raw?: string; developers?: { id: number; name: string }[]; genres?: { id: number; name: string }[]; tags?: { id: number; name: string }[] };
function normalize(raw: RawGame): Game {
  const attributes: Attribute[] = [];
  for (const [key, kind] of [['developers', 'developer'], ['genres', 'genre'], ['tags', 'tag']] as const) {
    for (const value of raw[key] ?? []) attributes.push({ id: String(value.id), name: value.name, kind });
  }
  return { id: String(raw.id), name: raw.name, image: raw.background_image ?? '', year: raw.released?.slice(0, 4) ?? 'TBA', description: raw.description_raw ?? 'Follow its connections to explore more games.', attributes, url: `https://rawg.io/games/${raw.slug}` };
}
export function createProvider(key: string) {
  const cache = new Map<string, Promise<Game>>();
  async function request(path: string, params: Record<string, string> = {}) {
    const response = await fetch(`https://api.rawg.io/api/${path}?${new URLSearchParams({ ...params, key })}`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'RAWG rejected this key. Check your API access and try again.' : `RAWG request failed (${response.status}). Please try again.`);
    return response.json();
  }
  function detail(id: string): Promise<Game> {
    if (!key) return Promise.resolve(catalog.find(game => game.id === id) ?? catalog[0]);
    if (!cache.has(id)) cache.set(id, request(`games/${encodeURIComponent(id)}`).then(normalize).catch(error => { cache.delete(id); throw error; }));
    return cache.get(id)!;
  }
  return {
    live: Boolean(key),
    seed: () => detail(key ? 'elden-ring' : catalog[0].id),
    async search(query: string): Promise<Game[]> {
      if (!key) return catalog.filter(game => game.name.toLowerCase().includes(query.toLowerCase()));
      const result = await request('games', { search: query, page_size: '8' });
      return result.results.map(normalize);
    },
    detail,
    async expand(seed: Game, existing: string[], filter: Filter) {
      if (existing.length >= 60) return [];
      if (!key) return relatedGames(seed, catalog, existing, filter);
      const kinds = filter === 'all' ? ['developer', 'tag', 'genre'] as const : [filter];
      const attributes = kinds.flatMap(kind => seed.attributes.filter(a => a.kind === kind).slice(0, 1));
      const results = await Promise.all(attributes.map(a => request('games', { [a.kind === 'developer' ? 'developers' : a.kind === 'genre' ? 'genres' : 'tags']: a.id, page_size: '15', ordering: '-added' })));
      const ids = [...new Set<string>(results.flatMap(result => result.results.map((game: RawGame) => String(game.id))))].filter(id => id !== seed.id && !existing.includes(id)).slice(0, 15);
      const candidates = await Promise.all(ids.map(detail));
      return relatedGames(seed, candidates, existing, filter);
    },
  };
}
