# भाष शतरंज · Bhash Chess

A native **Bhash (भाष)** port of [js-chess-engine](https://github.com/bhashitva/js-chess-engine), for demonstrating a real application written with Devanagari identifiers and Bhash's classes, overloads, recursion and control flow.

Chess rules, move generation, FEN parsing/serialization, game status, history,
evaluation and AI search live in [`bhash/shatranj.bhash`](bhash/shatranj.bhash).
The application compiles to a standalone **JVM JAR**, **.NET 10 assembly**, or
**browser WebAssembly application**.
The JavaScript adapter delegates chess operations to that compiled application;
it does not import or run the original TypeScript engine.

## Play in a browser

The new browser app runs the compiled Bhash engine locally in a worker, with
click-to-move play, AI, promotion choices, undo, board rotation, saved games,
move history and FEN import/export. Visitors need only a modern browser.

```sh
npm run web:build    # requires BHASH_COMPILER, JDK 17+, .NET 10 + wasm-tools
npm run web:serve
```

Open **http://localhost:4173**. A delivered prebuilt `web/dist/` does not need
recompilation. The entire output is deployable to a static HTTPS host, including
GitHub Pages. See [web/README.md](web/README.md) for setup, hosting and tests.

## Play the native showcase

Prebuilt applications are included in the local delivery. For a GitHub checkout,
first follow the source-build steps below, or download a successful **Bhash
chess** workflow artifact. Java 17+ is required:

```sh
java -jar bhash/play.jar
```

On Windows, `./run-demo.ps1` automatically selects an installed Java 17+ runtime,
including when an older Java is first on PATH. Enter `E2 E4` to move, `ai` for
the computer to move, `fen` to export the position, or `quit` to exit.
Both players can enter moves; call `ai` whenever the computer should take a turn.

The Windows launcher configures UTF-8 input/output automatically. If you launch
the JAR directly in VS Code's terminal, run `chcp 65001` first. Output such as
`αñ¡αñ╛...` indicates that UTF-8 bytes are being decoded with a legacy code page.
In PowerShell, also set `[Console]::OutputEncoding` and `$OutputEncoding` to
`[System.Text.UTF8Encoding]::new($false)` when piping or capturing native output.

The same native showcase also runs under .NET 10:

```sh
dotnet bhash/play-clr/BhashProgram.dll
```

## Use the original JavaScript API

Node.js 24+ and Java 17+; no npm runtime dependencies or installation step.

```js
import { Game, moves, status, move, ai, getFen } from './bhash/index.mjs';

const game = new Game();
console.log(game.moves('E2'));                  // { E2: ['E3', 'E4'] }
game.move('E2', 'E4');
console.log(game.ai({ level: 1, analysis: true }));
console.log(game.exportFEN());
console.log(game.exportJson());
console.log(game.getHistory());
```

CommonJS is available through `require('./bhash/index.cjs')`. The package's
`main`, `exports` and TypeScript declarations select the Bhash implementation.
`node example/bhash-demo.mjs` runs the adapter showcase.

The public methods remain `move`, `moves`, `setPiece`, `removePiece`,
`getHistory`, `exportJson`, `exportFEN`, `printToConsole`, `aiMove` and `ai`.
Stateless `moves`, `status`, `move`, `ai`, `aiMove` and `getFen` accept FEN or
board configurations and preserve the existing JSON field names. Move coordinates
are case insensitive. `move(from, to, promotion)` additionally supports explicit
rook/bishop/knight promotion; the original two-argument API promotes to a queen.
History stores snapshots from the actual initial position, including custom FEN.

AI accepts levels 1–5, `play`, `analysis`, `randomness`, `ttSizeMB`, and the
`depth.base`, `depth.extended`, `depth.check`, `depth.quiescence` controls.
Analysis returns move scores, completed depth, searched nodes and best score.
`play: false` preserves position and history. `ttSizeMB: 0` disables caching.
The adapter supplies random selection among the Bhash-scored candidates.

Environment settings:

| Variable | Purpose |
| --- | --- |
| `BHASH_JAVA` | Java executable; default `java` |
| `BHASH_COMPILER` | Extended compiler JAR, for rebuilding only |
| `BHASH_TARGET=clr` | Run adapter calls with the .NET backend |
| `BHASH_DOTNET` | .NET executable; default `dotnet` |

## Build from Bhash source

The companion `../bhash-compiler` checkout extends Bhash with the text operations
needed by this port. Its prebuilt compiler JAR is included. To rebuild it, install
JDK 17+ and Maven 3.9+, then run `mvn verify` in that checkout.

For a fresh GitHub checkout, obtain the compiler dependency as follows:

```sh
git clone https://github.com/bhashitva/bhash.git ../bhash-compiler
git -C ../bhash-compiler checkout 0591eb7f34ab61e69dd8032c37c59fcfa641e770
```

Run `mvn verify` in `../bhash-compiler` to produce its compiler JAR. CI uses this
same pinned revision so builds do not depend on changes to another branch.


PowerShell, from this engine directory:

```powershell
$env:BHASH_COMPILER = (Resolve-Path ../bhash-compiler/target/bhash-compiler-0.1.0-SNAPSHOT.jar).Path
# If Java 17+ is not first on PATH, set BHASH_JAVA to that JDK's java executable.
node bhash/build.mjs
node bhash/build.mjs --clr    # additionally requires .NET 10 SDK
```

On macOS/Linux, set `BHASH_COMPILER` with `export` and run the same Node commands.
The build script joins the reusable library with each entry point before calling
the Bhash compiler, because Bhash does not yet have module/import syntax.
It produces `chess.jar` (API protocol), `play.jar` (interactive showcase), and
equivalent `chess-clr/` / `play-clr/` deployment directories.
No TypeScript build is involved in producing the chess applications.

## Bhash source guide

| File / symbol | Purpose |
| --- | --- |
| `bhash/shatranj.bhash` | Reusable chess library |
| `बिसात` | 64-square position, legal moves, special rules, FEN, JSON |
| `चाल` | Linked move entry, including promotion choice |
| `खेल` | Stateful game and history |
| `खोज` / `स्मृतिनोड` | Iterative search, quiescence, bounded transposition cache |
| `चालें`, `स्थिति`, `चली`, `बुद्धि`, `फेनप्राप्त` | Stateless equivalents |
| `bhash/play.bhash` | Native console game entry point |
| `bhash/protocol.bhash` | Line protocol used by adapters and automated tests |
| `bhash/index.cjs` / `index.mjs` | Node transport and external data conversion |
| `src/`, `test/unit/`, `test/integration/` | Preserved upstream reference sources/tests |

To use the library in another Bhash application, concatenate it with a source
containing your `कार्य मुख्य() -> शून्य`. For example:

```text
कार्य मुख्य() -> शून्य {
    स्थिर खेलक: खेल = नया खेल();
    लिखो(खेलक.चालें("E2"));
    लिखो(खेलक.चली("E2", "E4"));
    लिखो(खेलक.बुद्धि(१, सत्य, सत्य));
    लिखो(खेलक.फेननिर्यात());
}
```

The native API returns JSON as `पाठ`; the Node adapter exposes ordinary objects.
The native eight-argument AI overload uses an integer cache-entry capacity;
the adapter translates `ttSizeMB` to a bounded capacity. There is no foreign
function interface, embedded JavaScript, or host-language chess implementation.

## Validation

```sh
node --test test/bhash/*.test.cjs
```

Repeat with `BHASH_TARGET=clr` to test the .NET build. Differential tests are
enabled by setting `REFERENCE_ENGINE` to a separately built original
`dist/index.js`. Without it, the differential test is explicitly skipped.
Use `npm ci` and `npm run build:reference` if you want to build the preserved
TypeScript reference. The unchanged upstream API/FEN suites can also be run with
`npm run test:compat` after installing the development dependencies.

See [VALIDATION.md](VALIDATION.md) for measured results and [PORTING.md](PORTING.md)
for architecture and compatibility limits. The original project's documentation
is preserved in [README.upstream.md](README.upstream.md).

## Compatibility and scope

This is a working port with public API compatibility, rather than an identical
performance implementation. The original BigInt bitboards and typed arrays are
replaced with a text mailbox and linked move lists. AI uses iterative negamax,
alpha-beta pruning, capture ordering, quiescence, check extensions and a bounded
cache; its evaluation, budgets and playing strength differ from upstream.
Levels have node budgets of 1,000 / 3,000 / 9,000 / 27,000 / 81,000 and retain
the last fully completed search iteration. A requested depth may therefore stop
earlier; the returned analysis reports the completed depth. Cache memory in MB
is approximate and capped at 262,144 entries. Caches last for one AI request.

The Node adapter is synchronous and launches a managed process for each request.
It requires Node and a JVM or .NET runtime and cannot execute directly in a browser.
The standalone native applications do not require Node. The separate browser
application uses the Bhash WebAssembly backend and needs no installed managed
runtime. Automatic repetition/insufficient-material draw
adjudication is not added; public game completion follows the upstream
checkmate/stalemate behavior. Error messages may differ from upstream.

The engine retains the upstream MIT attribution. See `THIRD_PARTY_NOTICES.md`
for source revisions and the separate Bhash compiler licensing status.

## Branches

`master` retains the original JavaScript/TypeScript fork as an upstream baseline.
`bhash` is the integration branch for the native port. Port changes use feature
branches and pull requests targeting `bhash`; compiler changes are reviewed in
the separate Bhash repository. Upstream changes can be merged into `bhash`
deliberately without replacing the JavaScript baseline.
