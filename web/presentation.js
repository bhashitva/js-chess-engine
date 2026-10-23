// Board orientation, move labels and SVGs are presentation, not chess rules.
export function squares(flipped = false) {
  const files = flipped ? 'HGFEDCBA' : 'ABCDEFGH';
  const ranks = flipped ? '12345678' : '87654321';
  return [...ranks].flatMap(rank => [...files].map(file => file + rank));
}
export function moveLabel(from, to, piece, promotion) {
  const symbols = { K: 'K', Q: 'Q', R: 'R', B: 'B', N: 'N', P: '' };
  return `${symbols[piece?.toUpperCase()] || ''}${from.toLowerCase()}–${to.toLowerCase()}${promotion && piece?.toUpperCase() === 'P' && /[18]$/u.test(to) ? '=' + promotion.toUpperCase() : ''}`;
}
export function needsPromotion(piece, destination) { return piece?.toUpperCase() === 'P' && /[18]$/u.test(destination); }
export const pieceNames = { P: 'pawn', N: 'knight', B: 'bishop', R: 'rook', Q: 'queen', K: 'king' };
