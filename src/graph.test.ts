import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from './data';
import { relatedGames, sharedAttributes, connect } from './graph';
test('developer relations match exact identities, not broad resemblance', () => {
  assert.equal(sharedAttributes(catalog[0], catalog[1], 'developer')[0].name, 'FromSoftware');
  assert.equal(sharedAttributes(catalog[0], catalog[3], 'developer').length, 0);
});
test('expansion adds at most five unique unseen games and never the seed', () => {
  const games = relatedGames(catalog[0], [...catalog, ...catalog], [catalog[0].id, catalog[1].id]);
  assert.equal(games.length, 5);
  assert.equal(new Set(games.map(x => x.id)).size, 5);
  assert.ok(games.every(x => x.id !== catalog[0].id && x.id !== catalog[1].id));
});
test('cap and exhausted branches return honest smaller result sets', () => {
  assert.equal(relatedGames(catalog[0], catalog, Array.from({length: 59}, (_, i) => `other${i}`)).length, 1);
  assert.equal(relatedGames(catalog[0], catalog, catalog.map(x => x.id)).length, 0);
});
test('every edge explains a verified shared attribute', () => {
  const games = relatedGames(catalog[0], catalog, [catalog[0].id], 'tag');
  const edges = connect(catalog[0], games, 'tag');
  assert.equal(edges.length, games.length);
  assert.ok(edges.every(edge => edge.attribute.kind === 'tag' && sharedAttributes(catalog[0], games.find(x => x.id === edge.target)!, 'tag').some(a => a.id === edge.attribute.id)));
});
