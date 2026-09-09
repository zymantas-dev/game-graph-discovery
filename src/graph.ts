import type { Attribute, Game } from './data';
export type Filter = 'all' | Attribute['kind'];
export type Connection = { source: string; target: string; attribute: Attribute };
export function sharedAttributes(a: Game, b: Game, filter: Filter = 'all') {
  const priority = { developer: 0, tag: 1, genre: 2 };
  return a.attributes.filter(x => (filter === 'all' || x.kind === filter) && b.attributes.some(y => x.kind === y.kind && x.id === y.id)).sort((x, y) => priority[x.kind] - priority[y.kind]);
}
export function relatedGames(seed: Game, candidates: Game[], existing: string[], filter: Filter = 'all') {
  const seen = new Set([...existing, seed.id]);
  return candidates.filter(game => {
    if (seen.has(game.id) || !sharedAttributes(seed, game, filter).length) return false;
    seen.add(game.id); return true;
  }).slice(0, Math.min(5, Math.max(0, 60 - existing.length)));
}
export function connect(seed: Game, games: Game[], filter: Filter): Connection[] {
  return games.flatMap(game => sharedAttributes(seed, game, filter).slice(0, 1).map(attribute => ({ source: seed.id, target: game.id, attribute })));
}
