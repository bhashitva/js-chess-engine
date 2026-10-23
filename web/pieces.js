const shapes = {
 P: '<circle cx="24" cy="15" r="7"/><path d="M19 22h10l-1 7 4 7H16l4-7z"/><path d="M14 37h20v5H14z"/>',
 R: '<path d="M13 9h6v6h4V9h5v6h4V9h5v12l-5 4 1 11H17l1-11-5-4z"/><path d="M14 37h20v5H14zM17 21h16"/>',
 N: '<path d="M15 36l3-12-6 3-3-6 8-8 5-2 1-6 7 8c8 4 8 17 4 23z"/><path d="M15 37h21v5H13z"/><path d="M26 17h1M18 24l7-3"/>',
 B: '<path d="M24 7c-10 9-12 14-5 19l-2 10h14l-2-10c7-5 5-10-5-19z"/><path d="M24 14l-5 7M14 37h20v5H14z"/>',
 Q: '<circle cx="10" cy="12" r="3"/><circle cx="24" cy="8" r="3"/><circle cx="38" cy="12" r="3"/><path d="M11 16l5 18h16l5-18-9 7-4-11-4 11z"/><path d="M14 37h20v5H14zM17 29h14"/>',
 K: '<path d="M24 5v11M19 10h10"/><path d="M24 18c-12-10-17 4-10 10l4 8h12l4-8c7-6 2-20-10-10z"/><path d="M14 37h20v5H14zM18 30h12"/>',
};
export function pieceSvg(piece) {
  const white = piece === piece.toUpperCase();
  return `<svg class="piece ${white ? 'white-piece' : 'black-piece'}" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><g fill="${white ? '#fff9e8' : '#163c3b'}" stroke="${white ? '#385450' : '#e9f0df'}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${shapes[piece.toUpperCase()] || ''}</g></svg>`;
}
