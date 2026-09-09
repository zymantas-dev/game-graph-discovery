import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProvider } from './api';
import { catalog } from './data';

test('live expansion hydrates details, rejects false matches, and caches detail requests', async () => {
  const original = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async input => {
    const url = new URL(String(input)); requests.push(url.pathname);
    const game = (id: number, developer: number) => ({ id, slug: `game-${id}`, name: `Game ${id}`, released: '2022-01-01', developers: [{ id: developer, name: `Developer ${developer}` }] });
    const body = url.pathname.endsWith('/games/1') ? game(1, 10) : url.pathname.endsWith('/games/2') ? game(2, 10) : url.pathname.endsWith('/games/3') ? game(3, 20) : { results: [game(1, 10), game(2, 10), game(2, 10), game(3, 10)] };
    return new Response(JSON.stringify(body), { status: 200 });
  };
  try {
    const provider = createProvider('test-only');
    const seed = await provider.detail('1');
    const result = await provider.expand(seed, ['1'], 'developer');
    assert.deepEqual(result.map(g => g.id), ['2']);
    await provider.detail('2');
    assert.equal(requests.filter(path => path.endsWith('/games/2')).length, 1);
  } finally { globalThis.fetch = original; }
});

test('authentication failures remain errors instead of returning fixtures', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('', { status: 401 });
  try { await assert.rejects(createProvider('invalid-test-key').seed(), /rejected this key/); }
  finally { globalThis.fetch = original; }
});

test('a full map makes no further API requests', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Unexpected request'); };
  try { assert.deepEqual(await createProvider('test-only').expand(catalog[0], Array.from({ length: 60 }, (_, i) => String(i)), 'all'), []); }
  finally { globalThis.fetch = original; }
});
