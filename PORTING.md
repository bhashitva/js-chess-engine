# Port architecture

## Source and public contracts

The starting point is `bhashitva/js-chess-engine` revision
`25c8a1f077b81999faa78d504c74ec42639903b1` (2.4.6). The language baseline is
`bhashitva/bhash` revision `2029642dae140e9fe488798f8f81962ef0019624`.
The original source is retained for review and differential verification.

The native implementation uses A1=0 through H8=63, with uppercase white and
lowercase black pieces. `बिसात` holds a fixed-length text mailbox and explicit
side-to-move, four castling rights, en-passant square, halfmove and fullmove clocks.
Copying a position shares immutable text until its squares are changed.
Linked `चाल` nodes and a bounded binary tree of cache slots replace arrays/maps.

Move generation checks piece geometry, occupancy, sliding paths and castling
transit attacks, then applies candidate moves to a copy and checks king safety.
En passant removes the captured pawn before that safety check, so discovered
rook/bishop attacks are handled. All four promotion choices are generated.
Castling rights are removed when a king/rook moves or a corner rook is captured.

Search is iterative deepening with negamax and alpha-beta pruning. Captures are
searched before quiet moves. Quiescence searches captures, promotions and check
evasions to its configured bound. Check extensions consume a bounded allowance.
Mate scores prefer faster mates. A direct-mapped cache stores depth, bound type,
score and full FEN key; hash hits must also match the complete key. Entries with
mate scores are not reused across different search plies. Evaluation uses
material plus a small centralization bonus. The implementation favors readable
Bhash over recreating the original optimized bitboard code.

The adapter converts JSON board configurations into the wire representation,
invokes Bhash, decodes its JSON output, and retains detached public snapshots.
It never computes attacks, legal moves, position status or search evaluations.
Randomness selects from the native engine's scored candidates. With normal
deterministic AI, Bhash itself applies the selected move, including underpromotion.

## Compiler changes

See the companion compiler's `docs/text-operations.md`. Added: UTF-8 text input,
Unicode-scalar length/slicing, ASCII numeric serialization, signed integer parsing,
ASCII uppercase and an explicit runtime failure function. `पाठ + पाठ` is checked
and lowered on both JVM and CLR. No array, import, bitwise or FFI syntax was added.
Both the library and entry points remain actual type-checked Bhash source.

## Deliberate differences

- Public API names, configuration fields, FEN and move shapes remain available
  through the Node adapter. Bhash names are Devanagari and serialized JSON is text.
- The original TypeScript implementation remains as reference code; the package
  entry now selects the compiled Bhash backend.
- Search strength, node totals, cache persistence and timing differ. Cache size
  is an approximate capacity setting, not an exact heap allocation contract.
- FEN clocks reject malformed numeric text rather than accepting partial numbers
  through JavaScript `parseInt`. Square and option validation is also stricter.
- Duplicate promotion destinations are deduplicated in public `moves()` output;
  native generation still includes all four distinct promotions.
- History from a custom FEN is recorded from that actual position, correcting the
  original history replay behavior.
- The Node adapter requires a managed runtime. Browser support is not claimed.

## Protocol

The first input line is a FEN. The optional first line `config` followed by a FEN
allows editor/configuration boards without requiring exactly one king per side,
matching the original configuration API. Commands consume subsequent lines:

| Command | Additional lines | Output |
| --- | --- | --- |
| `fen` | none | FEN |
| `status` | none | BoardConfig JSON |
| `moves` | from square, or empty line | MovesMap JSON |
| `move` | from, to, promotion symbol | BoardConfig JSON |
| `set` / `remove` | square + piece / square | FEN |
| `history` | none | JSON array of snapshots |
| `ai` | level, play, analysis, base depth (0=automatic), quiescence depth, extension limit, enable check extensions, cache-entry capacity | AIResult JSON |
| `perft` | nonnegative depth | ASCII node count |
| `board` | none | printable board |
| `quit` | none | terminate normally |

The low-level protocol expects trusted validated input; the Node adapter validates
public options. Runtime/source failures return nonzero status with a concise Bhash
diagnostic. The native console entry validates interactive coordinates and moves
before applying them, allowing play to continue after an invalid move.
