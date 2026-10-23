'use strict';
// Compatibility transport only. All chess rules, status and search run in Bhash.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const JAR = path.join(__dirname, 'chess.jar');
function line(value) {
  if (typeof value !== 'string' || /[\r\n\0]/u.test(value)) throw new Error('Expected a single line of text');
  return value;
}
function request(fen, commands, strict = false) {
  const input = [...(strict ? [] : ['config']), line(fen), ...commands.map(line), 'quit', ''].join('\n');
  const clr = process.env.BHASH_TARGET === 'clr';
  const executable = clr ? process.env.BHASH_DOTNET || 'dotnet' : process.env.BHASH_JAVA || 'java';
  const args = clr ? [path.join(__dirname, 'chess-clr/BhashProgram.dll')] : ['-Xmx512m', '-jar', JAR];
  const result = spawnSync(executable, args, {
    input, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, timeout: 300000, windowsHide: true,
  });
  if (result.error) throw new Error(`Cannot run the Bhash engine: ${result.error.message}. Set BHASH_JAVA to a Java 17+ executable.`);
  if (result.status !== 0) throw new Error(result.stderr.trim() || 'Bhash engine failed');
  return result.stdout.trimEnd().split(/\r?\n/u);
}
// This routine only encodes an external configuration as the Bhash wire format.
function configFen(config) {
  if (!config || typeof config !== 'object' || !config.pieces || Array.isArray(config.pieces)) throw new Error('Invalid board configuration');
  const pieces = {};
  for (const [s, p] of Object.entries(config.pieces)) {
    if (!/^[a-h][1-8]$/iu.test(s) || !/^[pnbrqk]$/iu.test(p)) throw new Error('Invalid square or piece');
    const normalized = s.toUpperCase();
    if (pieces[normalized]) throw new Error('Duplicate square');
    pieces[normalized] = p;
  }
  const ranks = [];
  for (let r = 8; r >= 1; r--) {
    let rank = '', empty = 0;
    for (const f of 'ABCDEFGH') {
      const piece = pieces[f + r];
      if (!piece) empty++;
      else { if (empty) rank += empty; empty = 0; rank += piece; }
    }
    if (empty) rank += empty;
    ranks.push(rank);
  }
  const turn = config.turn ?? 'white';
  if (!['white', 'black'].includes(turn)) throw new Error('Invalid turn');
  const c = config.castling ?? {};
  const rights = (c.whiteShort ? 'K' : '') + (c.whiteLong ? 'Q' : '') + (c.blackShort ? 'k' : '') + (c.blackLong ? 'q' : '');
  const half = config.halfMove ?? 0, full = config.fullMove ?? 1;
  if (!Number.isSafeInteger(half) || half < 0 || !Number.isSafeInteger(full) || full < 1) throw new Error('Invalid move counters');
  const ep = config.enPassant == null ? '-' : line(config.enPassant).toLowerCase();
  return `${ranks.join('/')} ${turn === 'white' ? 'w' : 'b'} ${rights || '-'} ${ep} ${half} ${full}`;
}
function clone(value) { return structuredClone(value); }
class Game {
  #fen; #history = [];
  constructor(configuration) {
    const strict = typeof configuration === 'string';
    const fen = configuration == null ? START : strict ? configuration.trim().replace(/\s+/gu, ' ') : configFen(configuration);
    this.#fen = request(fen, ['fen'], strict)[0];
  }
  move(from, to, promotion = 'Q') {
    const output = request(this.#fen, ['move', line(from), line(to), line(promotion), 'fen']);
    const board = JSON.parse(output[0]);
    this.#fen = output[1];
    this.#history.push({ ...clone(board), move: { [from.toUpperCase()]: to.toUpperCase() } });
    return board;
  }
  moves(from = '') { return JSON.parse(request(this.#fen, ['moves', line(from)])[0]); }
  setPiece(square, piece) { this.#fen = request(this.#fen, ['set', line(square), line(piece)])[0]; }
  removePiece(square) { this.#fen = request(this.#fen, ['remove', line(square)])[0]; }
  getHistory() { return clone(this.#history); }
  exportJson() { return JSON.parse(request(this.#fen, ['status'])[0]); }
  exportFEN() { return this.#fen; }
  printToConsole() { console.log(request(this.#fen, ['board']).join('\n')); }
  aiMove(level = 3) { return this.ai({ level }).move; }
  ai(options = {}) {
    const { level = 3, play = true, analysis = false, depth = {}, randomness = 0, ttSizeMB } = options;
    if (!Number.isInteger(level) || level < 1 || level > 5) throw new Error('AI level must be between 1 and 5');
    if (typeof play !== 'boolean' || typeof analysis !== 'boolean') throw new Error('play and analysis must be booleans');
    if (depth.base !== undefined && (!Number.isInteger(depth.base) || depth.base < 1)) throw new Error('depth.base must be an integer > 0');
    if (depth.extended !== undefined && (!Number.isInteger(depth.extended) || depth.extended < 0 || depth.extended > 3)) throw new Error('depth.extended must be an integer between 0 and 3');
    if (depth.quiescence !== undefined && (!Number.isInteger(depth.quiescence) || depth.quiescence < 0)) throw new Error('depth.quiescence must be an integer >= 0');
    if (depth.check !== undefined && typeof depth.check !== 'boolean') throw new Error('depth.check must be a boolean');
    if (!Number.isFinite(randomness) || randomness < 0) throw new Error('randomness must be a non-negative number');
    if (ttSizeMB !== undefined && (!Number.isFinite(ttSizeMB) || ttSizeMB < 0)) throw new Error('ttSizeMB must be a non-negative number');
    const detailed = analysis || randomness > 0;
    const capacity = ttSizeMB === 0 ? 0 : Math.min(262144, Math.floor(Math.max(0.25, ttSizeMB ?? 2) * 4096));
    const nativePlay = play && randomness === 0;
    const output = request(this.#fen, ['ai', String(level), String(nativePlay), String(detailed), String(depth.base ?? 0), String(depth.quiescence ?? 2), String(depth.extended ?? 1), String(depth.check ?? true), String(capacity), 'fen']);
    const result = JSON.parse(output[0]);
    let promotion = 'Q';
    if (randomness > 0 && result.analysis?.length) {
      const best = Math.max(...result.analysis.map(x => x.score));
      const candidates = result.analysis.filter(x => x.score >= best - randomness);
      const selected = candidates[Math.floor(Math.random() * candidates.length)];
      result.move = selected.move; result.bestScore = selected.score;
      promotion = selected.promotion;
    }
    if (nativePlay) {
      this.#fen = output[1];
      this.#history.push({ ...clone(result.board), move: clone(result.move) });
    } else if (play) {
      const [from, to] = Object.entries(result.move)[0];
      result.board = this.move(from, to, promotion);
    }
    if (result.analysis) for (const entry of result.analysis) delete entry.promotion;
    if (analysis) result.analysis.sort((a, b) => b.score - a.score);
    else for (const k of ['analysis', 'depth', 'nodesSearched', 'bestScore']) delete result[k];
    return result;
  }
}
module.exports = {
  ...require('./enums.cjs'),
  Game,
  moves: configuration => new Game(configuration).moves(),
  status: configuration => new Game(configuration).exportJson(),
  getFen: configuration => new Game(configuration).exportFEN(),
  move: (configuration, from, to) => new Game(configuration).move(from, to),
  ai: (configuration, options) => new Game(configuration).ai(options),
  aiMove: (configuration, level) => new Game(configuration).aiMove(level),
};
