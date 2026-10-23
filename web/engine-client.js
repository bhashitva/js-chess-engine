// Transport only: the module worker runs the compiled Bhash program.
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export function encodeRequest(fen, action = 'snapshot', args = []) {
  const lines = [fen, action, ...args];
  if (lines.some(value => typeof value !== 'string' || /[\r\n\0]/u.test(value))) throw new Error('Expected single-line position and move values.');
  if (!['snapshot', 'move', 'ai'].includes(action)) throw new Error('Unknown engine action.');
  if (action === 'move' && (args.length !== 3 || !/^[a-h][1-8]$/iu.test(args[0]) || !/^[a-h][1-8]$/iu.test(args[1]) || !/^[qrbn]$/iu.test(args[2]))) throw new Error('Invalid move coordinates or promotion.');
  if (action === 'ai' && (args.length !== 1 || !/^[1-5]$/u.test(args[0]))) throw new Error('Choose an AI level between 1 and 5.');
  return lines.join('\n') + '\n';
}
export class BhashEngine {
  constructor(onState = () => {}) { this.onState = onState; this.sequence = 0; this.pending = new Map(); }
  start() {
    if (this.ready) return this.ready;
    this.onState('loading');
    this.ready = new Promise((resolve, reject) => {
      this.bootTimer = setTimeout(() => this.fail(new Error('The browser runtime did not finish loading. Check that all engine assets are served, then reload.')), 60000);
      this.rejectReady = reject;
      try { this.worker = new Worker(new URL('./engine-worker.js', import.meta.url), { type: 'module' }); }
      catch (error) { queueMicrotask(() => this.fail(error)); return; }
      this.worker.onerror = event => this.fail(new Error(event.message || 'The browser runtime could not start.'));
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'ready') { clearTimeout(this.bootTimer); this.onState('ready'); resolve(); }
        else if (data.type === 'fatal') this.fail(new Error(data.error));
        else {
          const task = this.pending.get(data.id); if (!task) return;
          this.pending.delete(data.id); clearTimeout(task.timer);
          if (data.type === 'error') task.reject(new Error(data.error)); else task.resolve(data.snapshot);
        }
      };
    });
    return this.ready;
  }
  async run(fen, action = 'snapshot', args = []) {
    const input = encodeRequest(fen, action, args);
    await this.start();
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('The search took too long. Try a lower AI level.')), 180000);
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ type: 'run', id, input });
    });
  }
  fail(error) {
    clearTimeout(this.bootTimer);
    this.worker?.terminate(); this.worker = null;
    this.rejectReady?.(error);
    for (const task of this.pending.values()) { clearTimeout(task.timer); task.reject(error); }
    this.pending.clear(); this.ready = null; this.onState('error');
  }
  cancel() { this.fail(new DOMException('Search cancelled.', 'AbortError')); }
}
