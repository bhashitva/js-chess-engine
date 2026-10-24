# Original modules and their Bhash equivalents

The original engine is preserved on `master`, pinned for comparison at
[`25c8a1f`](https://github.com/bhashitva/js-chess-engine/tree/25c8a1f077b81999faa78d504c74ec42639903b1/src).
This branch has one executable chess implementation: [shatranj.bhash](../bhash/shatranj.bhash).
It consolidates the original modules into Bhash classes and functions. File count
does not measure the extent of this port; the algorithm differences below do.

| Original TypeScript module | Bhash implementation or boundary |
| --- | --- |
| `core/Board.ts` | `बिसात`: squares, pieces, side, rights, clocks, copy, apply |
| `core/Position.ts` | `खेल`: position ownership, moves, snapshots and history |
| `core/AttackDetector.ts` | `बिसात.ज्यामिति`, `आक्रांत`, `शह` |
| `core/MoveGenerator.ts` | `बिसात.चालें`, `किलाबंदी`, `लगाओ`; promotions and en passant |
| `core/zobrist.ts` | `बिसातहैश`, with full FEN verification; different hash algorithm |
| `core/index.ts` | No barrel module needed: compile Bhash declarations together |
| `ai/AIEngine.ts` | `खेल.बुद्धि`: level budgets, iteration, play/preview and analysis |
| `ai/Search.ts` | `खोज.नेगामैक्स`, `शांत`: alpha-beta, quiescence, check extensions |
| `ai/MoveOrdering.ts` | Capture-first traversal in `खोज.नेगामैक्स`; simplified ordering |
| `ai/TranspositionTable.ts` | `स्मृतिनोड`, `खोज.स्मृतिकोष्ठ`: bounded slots, depths and bounds |
| `ai/Evaluator.ts` | `मूल्य`, `मूल्यांकन`: material and centralization; simplified evaluation |
| `utils/fen.ts` | `फेनपढ़ो`, `बिसात.फेन`: parse, validate and serialize FEN |
| `utils/conversion.ts` | `खाना`, `क्रम`, `रंग`, `प्यादा`; no BigInt bitboard conversions needed |
| `utils/constants.ts` | Board geometry, piece values and starting position in Bhash |
| `utils/environment.ts` | Host runtime selection in `bhash/index.cjs`; browser worker lifecycle in `web/engine-client.js` |
| `adapters/APIAdapter.ts` | Native `खेल`, `बिसात.जेसन`, stateless functions; JS object conversion at the Node boundary |
| `index.ts` | `खेल`, `चालें`, `स्थिति`, `चली`, `बुद्धि`, `फेनप्राप्त`; English API exports in Node adapter |
| `types/board.types.ts` | Typed `बिसात`, `इतिहास`, `खेल` fields; external declarations in `bhash/types/board.types.d.ts` |
| `types/move.types.ts` | Typed `चाल` fields; external declarations in `bhash/types/move.types.d.ts` |
| `types/ai.types.ts` | Typed `खोज`, `स्मृतिनोड` fields and AI parameters; external declarations in `bhash/types/ai.types.d.ts` |
| `types/index.ts` | No native barrel module; `bhash/types/index.d.ts` only re-exports consumer declarations |

All native identifiers above belong to `bhash/shatranj.bhash`. The compiled entry
points are `play.bhash` (terminal), `protocol.bhash` (Node adapter), `web.bhash`
(browser), and `tests.bhash` (native specifications). The Bhash compiler type-checks
the assembled program for JVM, CLR or WebAssembly.

## Algorithm differences still present

This is a functional port with a different internal representation, not an exact
translation of every upstream optimization. Removing reference files does not
change that distinction.

- Text mailbox and linked move nodes replace BigInt bitboards and typed arrays.
- A polynomial position hash plus full-key verification replaces Zobrist hashing.
- Material and centralization replace the upstream piece-square evaluation tables.
- Capture-first traversal replaces the richer upstream move-ordering heuristics.
- Search uses bounded iterative negamax, alpha-beta, quiescence and check
  extensions. Upstream search optimizations and adaptive heuristics are not all
  reproduced; identical moves, node counts, speed and playing strength are not
  promised. The original AI benchmark suite is not claimed to pass.

These are future algorithm-parity work, not TypeScript code that the Bhash
application secretly depends on. Implementing exact parity would require further
native engine work and new tactical/search comparisons.

## What remains outside Bhash

The `.d.ts` files are declarations for existing TypeScript callers. They have no
runtime behavior. `bhash/index.cjs` provides process transport, JavaScript objects,
option validation and optional randomized candidate selection; its engine calls
delegate to the native executable. Build scripts and test runners use Node.
The browser renders its board and manages workers/storage in JavaScript, calling
the compiled Bhash WebAssembly engine for chess operations. A Bhash browser
DOM/FFI API would be additional compiler work, not a direct translation of these
engine modules.

## Tests and reference code

`bhash/tests.bhash` exercises the engine directly without the JavaScript facade.
`test/bhash/` verifies the external API and optionally compares legal moves,
status and FEN against a separately built upstream engine. `test/compat/`
preserves the upstream API/FEN assertions with types erased and imports redirected.
Implementation-specific bitboard, Zobrist and AI benchmark tests remain on
`master` with the implementation they test. CI builds its oracle in a separate
checkout; the application build never loads it.
