'use strict';
// Public numeric enums retained from the original API; no executable chess logic.
function enumeration(values) {
  const result = {};
  for (const [name, value] of Object.entries(values)) { result[name] = value; result[value] = name; }
  return result;
}
module.exports = {
  Piece: enumeration({EMPTY:0,WHITE_PAWN:1,WHITE_KNIGHT:2,WHITE_BISHOP:3,WHITE_ROOK:4,WHITE_QUEEN:5,WHITE_KING:6,BLACK_PAWN:7,BLACK_KNIGHT:8,BLACK_BISHOP:9,BLACK_ROOK:10,BLACK_QUEEN:11,BLACK_KING:12}),
  InternalColor: enumeration({WHITE:0,BLACK:1}),
  MoveFlag: enumeration({NONE:0,EN_PASSANT:1,CASTLING:2,PROMOTION:4,PAWN_DOUBLE_PUSH:8,CAPTURE:16}),
  PromotionPiece: enumeration({QUEEN:5,ROOK:4,BISHOP:3,KNIGHT:2}),
  CastlingType: enumeration({NONE:0,WHITE_SHORT:1,WHITE_LONG:2,BLACK_SHORT:3,BLACK_LONG:4}),
  MoveOrderType: enumeration({TT_MOVE:1000000,WINNING_CAPTURE:100000,KILLER_1:90000,KILLER_2:80000,HISTORY:0,LOSING_CAPTURE:-10000}),
  TTEntryType: enumeration({EXACT:0,LOWERBOUND:1,UPPERBOUND:2}),
};
