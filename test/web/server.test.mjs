import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createStaticServer } from '../../web/serve.mjs';

test('static server serves WASM and modules with correct types and rejects writes/traversal', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'bhash-web-'));
  await writeFile(path.join(dir, 'index.html'), '<h1>भाष</h1>');
  await writeFile(path.join(dir, 'engine.wasm'), new Uint8Array([0, 97, 115, 109]));
  await writeFile(path.join(dir, 'app.js'), 'export const x = 1;');
  const server = createStaticServer(dir); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.match(await (await fetch(url)).text(), /भाष/u);
    assert.equal((await fetch(url + '/engine.wasm')).headers.get('content-type'), 'application/wasm');
    assert.match((await fetch(url + '/app.js')).headers.get('content-type'), /text\/javascript/u);
    assert.equal((await fetch(url, { method: 'POST' })).status, 405);
    assert.notEqual((await fetch(url + '/..%5coutside.txt')).status, 200);
    assert.equal((await fetch(url + '/missing')).status, 404);
    assert.equal((await fetch(url, { method: 'HEAD' })).headers.get('content-length'), String(Buffer.byteLength('<h1>भाष</h1>')));
  } finally { await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});
