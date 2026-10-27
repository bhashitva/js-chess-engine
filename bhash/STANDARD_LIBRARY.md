# Standard-library migration

The native engine imports `मानक.पाठ्य`, `मानक.गणित` and `मानक.जेसन` with aliases to avoid collisions with existing parameter names.

- Text length, scalar slicing and ASCII case conversion use the text library.
- Piece and destination membership use `मानकपाठ.है`; piece classification explicitly rejects empty and multi-character strings because substring search accepts an empty needle.
- Evaluation distances use `मानकगणित.निरपेक्ष`.
- FEN numbers, JSON numbers and booleans use `मानकजेसन.पाठबनाओ`. Integer serialization remains exact and uses ASCII digits.
- Console input, strict integer parsing and terminal errors retain the language’s `पाठपढ़ो`, `पूर्णांकपाठ` and `त्रुटि` built-ins; the current standard library has no replacement for these operations.
- Single-character access and FEN field scanning remain chess-specific helpers, built on the text library, preserving the existing whitespace rules.

The compiler is pinned to cf46f367d67b0236e5a0aa7a434d98679d5b723b in both native and browser workflows. JVM, CLR and browser builds use the same migrated source.
