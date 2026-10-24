# Attribution

This port is derived from Josef Jadrny's **js-chess-engine**, MIT licensed,
as forked at https://github.com/bhashitva/js-chess-engine.
The original copyright and permission notice are preserved in `LICENSE`.
The original TypeScript sources and implementation-specific tests remain on
the `master` branch. API/FEN assertions derived from the upstream tests are
retained in `test/compat/` with type annotations erased and imports redirected.
Native chess implementation and specifications are Bhash source in `bhash/`.
Reference revision: `25c8a1f077b81999faa78d504c74ec42639903b1`.

Bhash compiler source comes from https://github.com/bhashitva/bhash,
revision `2029642dae140e9fe488798f8f81962ef0019624`, with the text-operation
changes in the accompanying `bhash-compiler` checkout. Its upstream README says
that no open-source license has yet been selected; this port's MIT license does
not change the compiler's licensing. Generated chess applications contain only
the Bhash console runtime and the compiled chess program, with no ANTLR dependency.

The companion shaded compiler JAR includes ANTLR 4.13.2, copyright (c) 2012–2022
The ANTLR Project, under its BSD 3-Clause license. Its packaged license is
included in the JAR. See the compiler checkout's `THIRD_PARTY_NOTICES.md` for
the complete notice.

The browser application additionally redistributes the .NET WebAssembly runtime.
Its license and third-party notices are retained in `web/runtime-notices/` and
copied into the browser build. Playwright is a development/test dependency only;
it is not shipped to visitors.
