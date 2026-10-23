// Set REFERENCE_ENGINE to a separately built upstream dist/index.js.
const { test }=require('node:test');
const assert=require('node:assert/strict');
const port=require('../../bhash/index.cjs');
const reference=process.env.REFERENCE_ENGINE ? require(process.env.REFERENCE_ENGINE) : null;
function normalize(map) { return Object.fromEntries(Object.entries(map).map(([k,v])=>[k,[...new Set(v)].sort()]).sort()); }
test('differential legal moves, status and FEN over deterministic games', {skip:!reference}, () => {
 let seed=76131;
 for(let game=0;game<3;game++) {
  const a=new port.Game(), b=new reference.Game();
  for(let ply=0;ply<30;ply++) {
   const moves=a.moves();
   assert.deepEqual(normalize(moves),normalize(b.moves()),`game ${game} ply ${ply}: ${a.exportFEN()}`);
   assert.deepEqual(a.exportJson(),b.exportJson());
   assert.equal(a.exportFEN(),b.exportFEN());
   const options=Object.entries(moves).flatMap(([from,tos])=>tos.map(to=>[from,to]));
   if(!options.length) break;
   seed=(Math.imul(seed,1664525)+1013904223)>>>0;
   const [from,to]=options[seed%options.length];
   a.move(from,to); b.move(from,to);
  }
 }
});
