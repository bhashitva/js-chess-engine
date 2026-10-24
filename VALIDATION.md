# Validation results

Validated locally on Windows using Java 24 (applications target Java 17),
.NET SDK 10.0.401 and Node.js 24.19.0.

| Check | Result |
| --- | --- |
| Native Bhash chess build | JVM and .NET successful |
| Specifications written in Bhash | 102 assertions passed on each of JVM and CLR, without the JavaScript adapter |
| Native interactive demo | JVM and .NET successful; legal/illegal input and FEN export checked |
| Windows launcher | Selects Java 17+ and runs the native demo |
| Chess correctness/API suite | 12 cases on each backend |
| Differential verification | 90 positions across three deterministic 30-ply games; legal move sets, complete public status and FEN matched upstream |
| Unchanged upstream API/FEN cases | 45/45 passed via a synchronous assertion harness |
| Original runtime exports | All retained, including exact numeric enum values and reverse mappings |
| TypeScript declarations | Consumer example type-checked |
| Bhash branch source separation | No executable `.ts` files; five API declaration files remain. Compatibility assertions run without TypeScript/Jest; the original engine is a separate comparison checkout |
| Compiler regression suites | JVM 36, CLR 38, frontend 17, generics 3, WASM validation 3; zero failures |
| Final text-operation checks | Both new shared regression cases rerun on JVM and CLR after final ASCII-case refinement |
| Browser/WASM application | Compiled successfully; manual browser checks confirmed legal moves, AI reply, FEN loading, knight promotion, undo and deep-search cancellation |
| Responsive browser layout | Checked at 390 px wide; no horizontal overflow |
| Web transport/static server | Six tests cover request validation, worker reuse/recovery/cancellation, board presentation and WASM MIME handling |

The original 45-case compatibility run executed upstream `api.test.ts` and
`fen.test.ts` bodies with a small synchronous matcher harness. Those assertions
are now retained as `test/compat/*.test.cjs`, with type annotations erased and
imports redirected to the Bhash adapter. `npm run test:compat` reproduces the
suite without installing TypeScript or Jest.

The differential check uses the original TypeScript implementation only as an
independent test oracle. It is not loaded by the port at runtime.
The full original AI tactical/strength/benchmark suite has not been claimed as
passing: the Bhash search implementation and playing strength are different.

The browser feature was exercised manually in the app's browser preview using
the real WebAssembly engine. An isolated Playwright end-to-end suite and a Linux
WebAssembly CI workflow are included; that automated browser suite has not been
run locally in this session.

## Standard move-generation counts

`perft` counts every legal move path, including separate promotion choices.
All counts matched on JVM and CLR.

| Position | Depth 1 | Depth 2 | Depth 3 | Depth 4 |
| --- | ---: | ---: | ---: | ---: |
| Standard opening | 20 | 400 | 8,902 | 197,281 |
| Kiwipete | 48 | 2,039 | 97,862 | — |
| Rook/pawn endgame | 14 | 191 | 2,812 | — |
| Promotion/castling stress position | 6 | 264 | 9,467 | — |

The executable test source records the exact FENs and expected counts.
Additional cases cover castling transit attacks, en-passant discovered checks,
every promotion type, black promotion clocks, custom-position history,
checkmate/stalemate, AI preview/play/analysis, cache consistency, mate in one,
randomized AI, input validation, and FEN/JSON round trips.

## Reproduction

```sh
npm run test:native
npm test
npm run test:compat
```

Run again with `BHASH_TARGET=clr`. To enable the optional differential test,
set `REFERENCE_ENGINE` to a separately built upstream `dist/index.js`.
Build the reference in a separate checkout (as CI does), never as part of the
native application:

```sh
git clone https://github.com/bhashitva/js-chess-engine.git ../reference
git -C ../reference checkout 25c8a1f077b81999faa78d504c74ec42639903b1
cd ../reference
npm ci
npm run build
```

Return to the Bhash checkout, set `REFERENCE_ENGINE` to that checkout's absolute
`dist/index.js` path, then run `npm test`. Implementation-specific TypeScript
unit/AI benchmark tests stay with their original implementation on `master`;
removing them from this branch does not imply they pass against Bhash.

In the companion compiler checkout, run `mvn verify` with JDK 17+, Maven 3.9+
and .NET SDK 10 installed. No browser workload is required for the compiler's
WASM validation tests. Building a real browser application needs the separate
WebAssembly workload and runtime packs.
