# Bhash Chess for the browser

This is a static web application. The **actual Bhash chess engine** is compiled
with the existing compiler's `wasm-browser` target and executes inside a module
worker using the .NET WebAssembly runtime. No chess backend, installed Java/.NET
runtime, account, or external service is needed by players.

The page supplies board rendering, accessible square controls, promotion choices,
human/computer play, undo, board rotation, move history, local save/restore and
FEN import/export. Legal moves, FEN validation, check/mate status, move application
and AI scores come from `bhash/shatranj.bhash`. `bhash/web.bhash` is the small
request/response entry point, not a replacement implementation of chess rules.

## Build

Build prerequisites: JDK 17+, the Bhash compiler JAR with the portable standard library, Node 24+,
and .NET SDK 10 with its WebAssembly workload. Use the companion compiler checkout
or the pinned revision in `.github/workflows/web.yml`.

```sh
dotnet workload install wasm-tools
# Build the compiler with Maven if its JAR is not already available.
# Set BHASH_COMPILER to its absolute target/bhash-compiler-0.1.0-SNAPSHOT.jar path.
npm run web:build
npm run web:serve
```

Open **http://localhost:4173**. The server binds only to the local machine and
serves static files. Set `PORT` to change its port. If Java 17+ is not first on
PATH, set `BHASH_JAVA` to its executable. Initial compilation can need NuGet
access for runtime packs; playing the built application requires only the files
in `web/dist/`.

PowerShell example using the delivered sibling compiler checkout:

```powershell
$env:BHASH_COMPILER = (Resolve-Path ../bhash-compiler/target/bhash-compiler-0.1.0-SNAPSHOT.jar).Path
npm run web:build
npm run web:serve
```

## Hosting

Upload **the entire contents of `web/dist/`**, including `engine/_framework/`, to
any static HTTPS host. The `Bhash browser chess` workflow builds and tests this
folder and uploads it as an artifact. All asset URLs are relative, so deployment
in a GitHub Pages project subdirectory is supported. Configure `.wasm` files as
`application/wasm`, `.js` as JavaScript, and retain UTF-8 HTML/CSS. The included
local server demonstrates these MIME types. Opening `index.html` using `file://`
does not support module workers; use HTTP/HTTPS. Cross-origin isolation and a
server-side chess process are not required.

The distributed runtime's .NET license and third-party notices are included in
`runtime-notices/` (from the 10.0.12 browser runtime used for this build). Keep
these notices when hosting the app and refresh them when updating its runtime.

No third-party fonts, scripts, analytics or network APIs are loaded. Runtime
resources are served from the same origin as the page. The runtime download is
several megabytes; subsequent visits can use browser caches.
Game state and settings are stored in that browser's local storage. A different
browser/device does not share the game. This is local two-player play, not online
multiplayer.

## Worker lifecycle and search

The worker loads the runtime once and reuses it for successive requests.
Each request creates a fresh Bhash game from the current FEN and returns a full
position plus its legal moves. State is committed only after a successful result.
Failures leave the previous position intact. Undo/new game/FEN import invalidate
outstanding requests, and stopping a search terminates its worker before starting
a fresh runtime. A stale AI response cannot overwrite a newer position.

The browser uses the same native AI at a depth of 1–5 according to the selected
level, with quiescence/check extensions disabled and a 2,048-entry cache to keep
the managed interpreter practical. Higher levels may still take substantial time;
**Stop thinking** is always available. Desktop and browser levels are not promised
to have identical strength or timing. Browser support requires WebAssembly and
module workers; current Chromium, Firefox and Safari implement these facilities.

## Tests

```sh
npm ci
npm run test:web
npx playwright install chromium
npm run test:web:browser
```

The browser test uses the real compiled WASM engine to check moves, an AI reply,
undo, rotation, promotions, saved-state reload, invalid FEN recovery, mate,
cancellation, a narrow viewport and the absence of third-party network requests.
The transport tests cover request validation, worker reuse/cancellation and
static asset MIME types. Build the app before running the browser suite.
