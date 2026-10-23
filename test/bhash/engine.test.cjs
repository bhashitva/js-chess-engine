const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const api = require('../../bhash/index.cjs');
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
function protocol(fen, commands) {
  const clr = process.env.BHASH_TARGET === 'clr';
  const result = spawnSync(clr ? process.env.BHASH_DOTNET || 'dotnet' : process.env.BHASH_JAVA || 'java', clr ? [path.join(__dirname, '../../bhash/chess-clr/BhashProgram.dll')] : ['-Xmx512m', '-jar', path.join(__dirname, '../../bhash/chess.jar')], {
    input: [fen, ...commands, 'quit', ''].join('\n'), encoding: 'utf8', timeout: 120000, windowsHide: true,
  });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
  return result.stdout.trim().split(/\r?\n/u);
}
test('standard perft positions validate complete legal move generation', () => {
  assert.deepEqual(protocol(START, ['perft','1','perft','2','perft','3','perft','4']), ['20','400','8902','197281']);
  assert.deepEqual(protocol('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', ['perft','1','perft','2','perft','3']), ['48','2039','97862']);
  assert.deepEqual(protocol('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', ['perft','1','perft','2','perft','3']), ['14','191','2812']);
  assert.deepEqual(protocol('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', ['perft','1','perft','2','perft','3']), ['6','264','9467']);
});
test('stateful/stateless APIs and FEN/JSON round trips', () => {
  const game = new api.Game();
  assert.equal(game.exportFEN(), START);
  assert.deepEqual(new Set(game.moves('e2').E2), new Set(['E3','E4']));
  const board = game.move('e2','e4');
  assert.equal(board.pieces.E4, 'P'); assert.equal(board.turn, 'black');
  assert.equal(game.exportFEN(), 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  assert.equal(api.getFen(board), game.exportFEN());
  assert.deepEqual(api.status(board), game.exportJson());
  assert.deepEqual(api.move(START,'E2','E4'), board);
  const h = game.getHistory(); assert.deepEqual(h[0].move, { E2:'E4' });
  h[0].pieces.E4='q'; assert.equal(game.getHistory()[0].pieces.E4,'P');
  const before=game.exportFEN(); assert.throws(() => game.move('A7','A4')); assert.equal(game.exportFEN(),before);
});
test('castling relocates rook and updates rights; attacked transit square prohibits castling', () => {
  const g = new api.Game('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  assert.ok(g.moves('E1').E1.includes('G1')); assert.ok(g.moves('E1').E1.includes('C1'));
  const b=g.move('E1','C1'); assert.equal(b.pieces.D1,'R'); assert.equal(b.pieces.A1,undefined);
  assert.equal(b.castling.whiteShort,false); assert.equal(b.castling.whiteLong,false);
  const blocked = new api.Game('k4r2/8/8/8/8/8/8/4K2R w K - 0 1');
  assert.ok(!blocked.moves('E1').E1.includes('G1'));
});
test('en passant captures and discovered check prevention', () => {
  const g=new api.Game('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  assert.ok(g.moves('E5').E5.includes('D6'));
  const b=g.move('E5','D6'); assert.equal(b.pieces.D5,undefined); assert.equal(b.pieces.D6,'P'); assert.equal(b.halfMove,0);
  const pinned=new api.Game('4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1');
  assert.ok(!pinned.moves('G5').G5.includes('F6'));
});
test('all four promotions, black promotion, and correct clocks', () => {
  for (const p of ['Q','R','B','N']) {
    const g=new api.Game('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    assert.equal(g.move('A7','A8',p).pieces.A8,p);
  }
  const g=new api.Game('4k3/8/8/8/8/8/p7/4K3 b - - 0 9');
  const b=g.move('A2','A1','N'); assert.equal(b.pieces.A1,'n'); assert.equal(b.fullMove,10);
});
test('checkmate, stalemate, and terminal search', () => {
  const g=new api.Game();
  for (const [a,b] of [['F2','F3'],['E7','E5'],['G2','G4'],['D8','H4']]) g.move(a,b);
  assert.equal(g.exportJson().checkMate,true); assert.equal(g.exportJson().isFinished,true);
  assert.deepEqual(g.moves(),{}); assert.throws(() => g.ai({level:1}));
  const stale=api.status('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(stale.staleMate,true); assert.equal(stale.check,false);
});
test('AI returns legal moves, analysis and preview do not mutate the game', () => {
  const g=new api.Game(); const before=g.exportFEN();
  const r=g.ai({level:1, play:false, analysis:true, ttSizeMB:0, depth:{base:2,quiescence:0,extended:0,check:false}});
  const [from,to]=Object.entries(r.move)[0]; assert.ok(g.moves(from)[from].includes(to));
  assert.equal(g.exportFEN(),before); assert.equal(g.getHistory().length,0);
  assert.equal(r.depth,2); assert.ok(r.nodesSearched>0); assert.equal(r.analysis.length,20);
  const played=g.ai({level:1}); assert.equal(g.exportJson().turn,'black'); assert.equal(g.getHistory().length,1);
  assert.deepEqual(played.board,g.exportJson());
});
test('AI finds mate in one and cache preserves exact fixed-depth scores', () => {
  const fen='7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  const options={level:2,play:false,analysis:true,depth:{base:2,extended:0,check:false,quiescence:0}};
  const without=api.ai(fen,{...options,ttSizeMB:0}); const cached=api.ai(fen,{...options,ttSizeMB:0.25});
  assert.equal(cached.bestScore,without.bestScore);
  const g=new api.Game(fen); const [a,b]=Object.entries(cached.move)[0]; assert.equal(g.move(a,b).checkMate,true);
});
test('history starts from custom FEN and captures snapshots', () => {
  const g=new api.Game('4k3/8/8/8/8/8/4P3/4K3 w - - 0 17');
  g.move('E2','E4'); assert.equal(g.getHistory()[0].fullMove,17);
  g.setPiece('A3','N'); assert.equal(g.exportJson().pieces.A3,'N');
  g.removePiece('A3'); assert.equal(g.exportJson().pieces.A3,undefined);
  g.removePiece('E8'); assert.equal(g.exportJson().pieces.E8,undefined);
});
test('invalid FEN, coordinates, pieces and options fail cleanly', () => {
  for (const f of ['8/8/8/8/8/8/8/8 w - - 0 1', START.replace(' w ',' x '), START.replace('KQkq','KK'), START.replace(' 0 1',' -1 0')]) assert.throws(() => new api.Game(f));
  const g=new api.Game();
  assert.throws(() => g.moves('Z9')); assert.throws(() => g.moves('E2\nquit')); assert.throws(() => g.setPiece('E2','X'));
  for (const options of [{level:0},{level:1.5},{randomness:-1},{depth:{base:0}},{depth:{extended:4}},{depth:{quiescence:-1}},{depth:{check:'yes'}}]) assert.throws(() => g.ai(options));
});
test('native Bhash game tracks history without the JavaScript facade', () => {
  const lines=protocol(START,['move','E2','E4','Q','history','fen']);
  assert.deepEqual(JSON.parse(lines[1])[0].move,{E2:'E4'});
  assert.equal(JSON.parse(lines[0]).pieces.E4,'P');
});
test('FEN whitespace normalization and randomized AI preserve the public shape', () => {
  assert.equal(new api.Game('  ' + START.replaceAll(' ', '\t') + '  ').exportFEN(), START);
  const g=new api.Game();
  const r=g.ai({level:1,play:true,randomness:10,analysis:true,depth:{base:1,quiescence:0,extended:0}});
  assert.deepEqual(r.board,g.exportJson()); assert.equal(g.getHistory().length,1);
  assert.ok(r.analysis.every(entry=>Object.keys(entry).sort().join(',')==='move,score'));
});
