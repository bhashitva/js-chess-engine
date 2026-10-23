import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BhashEngine, encodeRequest, START_FEN } from '../../web/engine-client.js';
import { squares, needsPromotion } from '../../web/presentation.js';

test('browser protocol preserves FEN and validates move/promotion boundaries', () => {
  assert.equal(encodeRequest(START_FEN), START_FEN + '\nsnapshot\n');
  assert.equal(encodeRequest(START_FEN, 'move', ['E2', 'E4', 'Q']), START_FEN + '\nmove\nE2\nE4\nQ\n');
  assert.throws(() => encodeRequest(START_FEN + '\nquit'));
  assert.throws(() => encodeRequest(START_FEN, 'move', ['E2', 'E9', 'Q']));
  assert.throws(() => encodeRequest(START_FEN, 'move', ['E2', 'E4', 'K']));
  assert.throws(() => encodeRequest(START_FEN, 'ai', ['6']));
  assert.throws(() => encodeRequest(START_FEN, 'ai', [1]));
});
test('board orientation retains every square and promotion UI uses piece/rank', () => {
  assert.equal(squares()[0], 'A8'); assert.equal(squares().at(-1), 'H1');
  assert.equal(squares(true)[0], 'H1'); assert.equal(new Set(squares(true)).size, 64);
  assert.equal(needsPromotion('P', 'A8'), true); assert.equal(needsPromotion('p', 'B1'), true);
  assert.equal(needsPromotion('R', 'A8'), false); assert.equal(needsPromotion('P', 'A7'), false);
});
test('worker is initialized once, reused, and errors reject only their request', async () => {
  const original = globalThis.Worker; const instances = [];
  class FakeWorker {
    constructor() { instances.push(this); queueMicrotask(() => this.onmessage({ data: { type: 'ready' } })); }
    postMessage(data) { this.last = data; queueMicrotask(() => this.onmessage({ data: { type: 'result', id: data.id, snapshot: { fen: START_FEN } } })); }
    terminate() { this.terminated = true; }
  }
  globalThis.Worker = FakeWorker;
  const engine = new BhashEngine();
  try {
    assert.equal((await engine.run(START_FEN)).fen, START_FEN);
    await engine.run(START_FEN); assert.equal(instances.length, 1);
    instances[0].postMessage = function (data) { queueMicrotask(() => this.onmessage({ data: { type: 'error', id: data.id, error: 'Invalid FEN' } })); };
    await assert.rejects(engine.run('bad'), /Invalid FEN/u);
    assert.equal(instances[0].terminated, undefined);
  } finally { engine.cancel(); globalThis.Worker = original; }
});
test('cancelling a search terminates its worker and allows a clean restart', async () => {
  const original = globalThis.Worker; const instances = [];
  class FakeWorker {
    constructor() { instances.push(this); queueMicrotask(() => this.onmessage({ data: { type: 'ready' } })); }
    postMessage() {}
    terminate() { this.terminated = true; }
  }
  globalThis.Worker = FakeWorker;
  const engine = new BhashEngine();
  try {
    await engine.start();
    const pending = engine.run(START_FEN, 'ai', ['5']);
    await Promise.resolve();
    engine.cancel(); await assert.rejects(pending, error => error.name === 'AbortError');
    assert.equal(instances[0].terminated, true);
    await engine.start(); assert.equal(instances.length, 2);
  } finally { engine.cancel(); globalThis.Worker = original; }
});
test('a worker startup failure rejects cleanly and can be retried', async () => {
  const original = globalThis.Worker; let attempt = 0;
  class FakeWorker {
    constructor() {
      if (++attempt === 1) throw new Error('Worker startup unavailable');
      queueMicrotask(() => this.onmessage({ data: { type: 'ready' } }));
    }
    terminate() {}
  }
  globalThis.Worker = FakeWorker; const engine = new BhashEngine();
  try { await assert.rejects(engine.start(), /startup unavailable/u); await engine.start(); assert.equal(attempt, 2); }
  finally { engine.cancel(); globalThis.Worker = original; }
});
