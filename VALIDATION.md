# Validation results

Validated locally on Windows using Java 24 (applications target Java 17),
.NET SDK 10.0.401 and Node.js 24.19.0.

| Check | Result |
| --- | --- |
| Native Bhash chess build | JVM and .NET successful |
| Native interactive demo | JVM and .NET successful; legal/illegal input and FEN export checked |
| Windows launcher | Selects Java 17+ and runs the native demo |
| Chess correctness/API suite | 12 cases on each backend |
| Differential verification | 90 positions across three deterministic 30-ply games; legal move sets, complete public status and FEN matched upstream |
| Unchanged upstream API/FEN cases | 45/45 passed via a synchronous assertion harness |
| Original runtime exports | All retained, including exact numeric enum values and reverse mappings |
| TypeScript declarations | Consumer example type-checked |
| Compiler regression suites | JVM 36, CLR 38, frontend 17, generics 3, WASM validation 3; zero failures |
| Final text-operation checks | Both new shared regression cases rerun on JVM and CLR after final ASCII-case refinement |
| Browser/WASM application | Compiled successfully; manual browser checks confirmed legal moves, AI reply, FEN loading, knight promotion, undo and deep-search cancellation |
| Responsive browser layout | Checked at 390 px wide; no horizontal overflow |
| Web transport/static server | Six tests cover request validation, worker reuse/recovery/cancellation, board presentation and WASM MIME handling |

The 45-case compatibility run executed the unchanged `api.test.ts` and
`fen.test.ts` bodies with a small local synchronous matcher harness. This was
not a full Jest run. The harness is provided at `test/bhash/upstream-compat.cjs`
and uses the TypeScript development dependency to load those original tests.
`npm run test:compat:harness` reproduces it after `npm ci`.
`jest.bhash.config.cjs` is also provided for running these suites with Jest.

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
node --test test/bhash/*.test.cjs
```

Run again with `BHASH_TARGET=clr`. To enable the optional differential test,
set `REFERENCE_ENGINE` to a separately built upstream `dist/index.js`.
To build that reference from the preserved source, install development
dependencies and run `npm run build:reference`.

In the companion compiler checkout, run `mvn verify` with JDK 17+, Maven 3.9+
and .NET SDK 10 installed. No browser workload is required for the compiler's
WASM validation tests. Building a real browser application needs the separate
WebAssembly workload and runtime packs.
