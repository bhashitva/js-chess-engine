import { BhashEngine, START_FEN } from './engine-client.js';
import { squares, moveLabel, needsPromotion, pieceNames } from './presentation.js';
import { pieceSvg } from './pieces.js';

const $ = id => document.getElementById(id);
const storageKey = 'bhash-chess-browser-v1';
const initialPieces = {};
for (let i = 0; i < 8; i++) {
  const file = 'ABCDEFGH'[i];
  initialPieces[file + '1'] = 'RNBQKBNR'[i]; initialPieces[file + '2'] = 'P';
  initialPieces[file + '7'] = 'p'; initialPieces[file + '8'] = 'rnbqkbnr'[i];
}
let snapshot = { fen: START_FEN, moves: {}, board: { pieces: initialPieces, turn: 'white', fullMove: 1, check: false, isFinished: false } };
let history = [], selected = null, flipped = false, busy = false, ready = false, epoch = 0, activity = 'snapshot';
let mode = 'ai', side = 'white', level = 1;
let pendingPromotion = null;
const captions = ['Explore', 'Find a rhythm', 'Think ahead', 'Go deeper', 'A real challenge'];
const engine = new BhashEngine(state => {
  ready = state === 'ready';
  $('runtime-status').textContent = state === 'ready' ? 'Bhash · running locally' : state === 'loading' ? 'Loading Bhash…' : 'Bhash · ready to restart';
  $('runtime-status').classList.toggle('ready', ready);
});

function showError(message) { $('error-text').textContent = message; $('error').hidden = false; }
function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ fen: snapshot.fen, history, mode, side, level, flipped })); } catch { /* Private browsing and storage limits should not interrupt a game. */ }
}
function restore() {
  try {
    const text = localStorage.getItem(storageKey);
    if (!text || text.length > 1000000) return START_FEN;
    const saved = JSON.parse(text);
    mode = saved.mode === 'local' ? 'local' : 'ai'; side = saved.side === 'black' ? 'black' : 'white';
    level = Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= 5 ? saved.level : 1;
    flipped = Boolean(saved.flipped);
    history = Array.isArray(saved.history) ? saved.history.filter(h => h && typeof h.before === 'string' && typeof h.from === 'string' && typeof h.to === 'string' && typeof h.label === 'string' && Number.isInteger(h.number) && ['white', 'black'].includes(h.turn)).slice(-1000) : [];
    return typeof saved.fen === 'string' ? saved.fen : START_FEN;
  } catch { return START_FEN; }
}
function pieceColor(piece) { return piece === piece.toUpperCase() ? 'white' : 'black'; }
function humanTurn() { return mode === 'local' || snapshot.board.turn === side; }
function canUndo() { return history.length > 0 && (mode === 'local' || history.some(move => move.turn === side)); }
function clearSelection() { selected = null; }
function render() {
  const board = $('board'), active = !busy && ready && !snapshot.board.isFinished && humanTurn();
  const last = history.at(-1);
  const order = squares(flipped);
  board.replaceChildren(); board.setAttribute('aria-busy', String(busy || !ready));
  for (let i = 0; i < order.length; i++) {
    const square = order[i], piece = snapshot.board.pieces[square];
    const button = document.createElement('button'); button.type = 'button'; button.className = 'square';
    button.dataset.square = square;
    if (('ABCDEFGH'.indexOf(square[0]) + Number(square[1])) % 2 === 1) button.classList.add('dark');
    if (selected === square) button.classList.add('selected');
    if (last && [last.from, last.to].includes(square)) button.classList.add('last-move');
    if (piece?.toUpperCase() === 'K' && pieceColor(piece) === snapshot.board.turn && snapshot.board.check) button.classList.add('checked');
    const legal = Boolean(selected && snapshot.moves[selected]?.includes(square));
    if (legal) { button.classList.add('legal'); if (piece) button.classList.add('capture'); }
    button.disabled = !active;
    const label = piece ? `${pieceColor(piece)} ${pieceNames[piece.toUpperCase()]}` : 'empty';
    button.setAttribute('aria-label', `${square}, ${label}${legal ? ', legal destination' : ''}`);
    if (selected === square) button.setAttribute('aria-pressed', 'true');
    if (piece) button.innerHTML = pieceSvg(piece);
    if (i % 8 === 0) { const rank = document.createElement('span'); rank.className = 'coordinate rank-coordinate'; rank.textContent = square[1]; button.append(rank); }
    if (i >= 56) { const file = document.createElement('span'); file.className = 'coordinate file-coordinate'; file.textContent = square[0].toLowerCase(); button.append(file); }
    button.addEventListener('click', () => selectSquare(square));
    button.addEventListener('keydown', event => navigateBoard(event, square));
    board.append(button);
  }
  const turn = snapshot.board.turn === 'white' ? 'White' : 'Black';
  let heading = `${turn} to move`, hindi = snapshot.board.turn === 'white' ? 'सफेद की चाल' : 'काले की चाल';
  let message = selected ? 'Choose a highlighted square to make your move.' : 'Select a piece. Find your next possibility.';
  if (!ready && busy) { heading = 'Preparing the board'; hindi = 'खेल की तैयारी'; message = 'Loading the Bhash engine. The first visit takes a moment.'; }
  else if (busy) { heading = 'Bhash is thinking…'; hindi = 'भाष सोच रहा है'; message = 'The search runs in the background. Take a breath, or stop it below the board.'; }
  else if (snapshot.board.checkMate) { heading = `${turn === 'White' ? 'Black' : 'White'} wins`; hindi = 'शह और मात'; message = 'A well-played ending. There is always another game.'; }
  else if (snapshot.board.staleMate) { heading = 'A draw by stalemate'; hindi = 'गतिरोध'; message = 'No legal moves, no check. A shared ending.'; }
  else if (snapshot.board.check) { heading += ' · check'; hindi = 'शह'; message = 'Your king needs a little attention.'; }
  else if (!humanTurn()) message = 'Bhash plays this side. Ask the engine to continue.';
  if (busy && ready && activity !== 'ai') { heading = 'Updating the board'; hindi = 'बिसात बदल रही है'; message = 'Applying the position with the Bhash engine.'; }
  $('turn-label').textContent = heading; $('turn-hindi').textContent = hindi; $('game-message').textContent = message;
  document.body.classList.toggle('loading-pulse', busy);
  $('stop').hidden = !busy; $('stop').textContent = activity === 'ai' ? 'Stop thinking' : 'Cancel'; $('undo').disabled = !canUndo(); $('new-game').disabled = false;
  $('ai-move').disabled = !ready || busy || snapshot.board.isFinished;
  $('mode').value = mode; $('side').value = side; $('level').value = level;
  $('mode').disabled = busy; $('side').disabled = busy;
  $('ai-settings').hidden = mode !== 'ai';
  $('level-caption').textContent = captions[level - 1];
  for (const button of document.querySelectorAll('[data-level]')) { button.setAttribute('aria-pressed', String(Number(button.dataset.level) === level)); button.disabled = busy; }
  $('opponent-name').textContent = mode === 'local' ? (side === 'white' ? 'Black' : 'White') : 'Bhash engine';
  $('opponent-caption').textContent = mode === 'local' ? 'A friend across the board' : `Level ${level} · ${captions[level - 1]}`;
  $('player-name').textContent = mode === 'local' ? (side === 'white' ? 'White' : 'Black') : 'You';
  $('player-color').textContent = side.toUpperCase(); $('opponent-color').textContent = side === 'white' ? 'BLACK' : 'WHITE';
  $('move-count').textContent = `${history.length} ${history.length === 1 ? 'move' : 'moves'}`;
  renderHistory();
}
function renderHistory() {
  if (!history.length) { $('history').innerHTML = '<div class="empty-history"><span aria-hidden="true">✦</span><p>Every game begins<br>with a possibility.</p></div>'; return; }
  const rows = new Map();
  for (const move of history) {
    if (!rows.has(move.number)) rows.set(move.number, { white: '—', black: '—' });
    rows.get(move.number)[move.turn] = move.label;
  }
  $('history').replaceChildren();
  for (const [number, moves] of rows) {
    const row = document.createElement('div'); row.className = 'history-row';
    for (const [index, text] of [`${number}.`, moves.white, moves.black].entries()) {
      const span = document.createElement('span'); span.textContent = text; if (!index) span.className = 'move-number'; row.append(span);
    } $('history').append(row);
  }
  $('history').scrollTop = $('history').scrollHeight;
}
function navigateBoard(event, square) {
  const offsets = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
  if (!(event.key in offsets)) return;
  event.preventDefault();
  const order = squares(flipped), index = order.indexOf(square), next = index + offsets[event.key];
  if (next >= 0 && next < 64 && !((event.key === 'ArrowLeft' && index % 8 === 0) || (event.key === 'ArrowRight' && index % 8 === 7))) document.querySelector(`[data-square="${order[next]}"]`)?.focus();
}
async function selectSquare(square) {
  if (busy || !ready || !humanTurn()) return;
  if (selected && snapshot.moves[selected]?.includes(square)) {
    const from = selected, piece = snapshot.board.pieces[from];
    if (needsPromotion(piece, square)) { openPromotion(from, square); return; }
    await execute('move', [from, square, 'Q']); return;
  }
  selected = selected === square ? null : (snapshot.moves[square]?.length ? square : null);
  render(); document.querySelector(`[data-square="${square}"]`)?.focus();
}
async function execute(action = 'snapshot', args = [], { fen = snapshot.fen, reset = false, auto = true, undoCut = null } = {}) {
  const version = ++epoch, before = snapshot;
  busy = true; activity = action; clearSelection(); $('error').hidden = true; render();
  try {
    const next = await engine.run(fen, action, args);
    if (version !== epoch) return false;
    if (reset) history = [];
    if (undoCut !== null) history = history.slice(0, undoCut);
    if (action === 'move' || action === 'ai') {
      const [from, to] = action === 'move' ? args : Object.entries(next.ai.move)[0];
      const p = next.board.pieces[to];
      history.push({ before: before.fen, from, to, turn: before.board.turn, number: before.board.fullMove, label: moveLabel(from, to, before.board.pieces[from], p) });
    }
    snapshot = next; ready = true; busy = false; render(); persist();
    if (auto) maybeAI();
    return true;
  } catch (error) {
    if (version !== epoch) return false;
    busy = false; render(); if (error.name !== 'AbortError') showError(error.message);
    return false;
  }
}
function maybeAI() {
  if (!busy && ready && mode === 'ai' && snapshot.board.turn !== side && !snapshot.board.isFinished) void execute('ai', [String(level)], { auto: false });
}
function interrupt() { epoch++; engine.cancel(); busy = false; ready = false; }
async function newGame() {
  if (busy) interrupt();
  flipped = side === 'black';
  await execute('snapshot', [], { fen: START_FEN, reset: true });
}
function openPromotion(from, to) {
  pendingPromotion = { from, to }; $('promotion-options').replaceChildren();
  for (const kind of ['Q', 'R', 'B', 'N']) {
    const button = document.createElement('button'); button.type = 'button';
    const p = snapshot.board.turn === 'white' ? kind : kind.toLowerCase();
    button.innerHTML = pieceSvg(p); button.setAttribute('aria-label', `Promote to ${pieceNames[kind]}`);
    button.addEventListener('click', () => { $('promotion-dialog').close(); pendingPromotion = null; void execute('move', [from, to, kind]); });
    $('promotion-options').append(button);
  } $('promotion-dialog').showModal();
}
$('cancel-promotion').addEventListener('click', () => { pendingPromotion = null; $('promotion-dialog').close(); });
$('promotion-dialog').addEventListener('cancel', () => { pendingPromotion = null; });
$('flip').addEventListener('click', () => { flipped = !flipped; render(); persist(); });
$('new-game').addEventListener('click', () => void newGame());
$('ai-move').addEventListener('click', () => void execute('ai', [String(level)], { auto: false }));
$('stop').addEventListener('click', () => { interrupt(); render(); void execute('snapshot', [], { auto: false }); });
$('undo').addEventListener('click', () => {
  if (!canUndo()) return;
  if (busy) interrupt();
  let cut = history.length - 1;
  if (mode === 'ai') { while (cut > 0 && history[cut].turn !== side) cut--; }
  void execute('snapshot', [], { fen: history[cut].before, undoCut: cut, auto: false });
});
$('mode').addEventListener('change', event => { mode = event.target.value; clearSelection(); render(); persist(); maybeAI(); });
$('side').addEventListener('change', event => { side = event.target.value; flipped = side === 'black'; clearSelection(); render(); persist(); maybeAI(); });
for (const button of document.querySelectorAll('[data-level]')) button.addEventListener('click', () => { level = Number(button.dataset.level); render(); persist(); });
$('position').addEventListener('click', () => { $('fen-input').value = snapshot.fen; $('fen-feedback').textContent = ''; $('position-dialog').showModal(); });
$('close-position').addEventListener('click', () => $('position-dialog').close());
$('copy-fen').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('fen-input').value); $('fen-feedback').textContent = 'FEN copied.'; }
  catch { $('fen-input').focus(); $('fen-input').select(); $('fen-feedback').textContent = 'Text selected. Use your usual copy shortcut.'; }
});
$('load-fen').addEventListener('click', async () => {
  const fen = $('fen-input').value.trim().replace(/\s+/gu, ' ');
  if (busy) interrupt();
  $('load-fen').disabled = true;
  const success = await execute('snapshot', [], { fen, reset: true, auto: false });
  $('load-fen').disabled = false;
  if (success) { $('position-dialog').close(); maybeAI(); }
  else $('fen-feedback').textContent = 'That position could not be loaded. Check all six FEN fields.';
});
$('show-code').addEventListener('click', () => $('code-dialog').showModal());
$('close-code').addEventListener('click', () => $('code-dialog').close());
$('dismiss-error').addEventListener('click', () => { $('error').hidden = true; });
const savedFen = restore(); render();
if (!(await execute('snapshot', [], { fen: savedFen }))) {
  history = [];
  if (savedFen !== START_FEN) await execute('snapshot', [], { fen: START_FEN });
}
