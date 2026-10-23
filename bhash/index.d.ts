export * from './types';
export type Color = 'white' | 'black';
export type PieceSymbol = 'P'|'N'|'B'|'R'|'Q'|'K'|'p'|'n'|'b'|'r'|'q'|'k';
export type Square = string;
export type AILevel = 1|2|3|4|5;
export interface CastlingRights { whiteShort: boolean; whiteLong: boolean; blackShort: boolean; blackLong: boolean; }
export interface BoardConfig {
  pieces: Record<Square, PieceSymbol>; turn: Color; castling: CastlingRights;
  enPassant: Square|null; halfMove: number; fullMove: number;
  check: boolean; checkMate: boolean; staleMate: boolean; isFinished: boolean;
}
export type HistoryEntry = Record<Square, Square>;
export type MovesMap = Record<Square, Square[]>;
export interface ScoredHistoryMove { move: HistoryEntry; score: number; }
export interface AIResult { move: HistoryEntry; board: BoardConfig; analysis?: ScoredHistoryMove[]; depth?: number; nodesSearched?: number; bestScore?: number; }
export interface AIOptions {
  level?: number; play?: boolean; analysis?: boolean; ttSizeMB?: number; randomness?: number;
  depth?: { base?: number; extended?: number; check?: boolean; quiescence?: number };
}
export class Game {
  constructor(configuration?: BoardConfig|string);
  move(from: Square, to: Square, promotion?: 'Q'|'R'|'B'|'N'|'q'|'r'|'b'|'n'): BoardConfig;
  moves(from?: Square): MovesMap;
  setPiece(square: Square, piece: PieceSymbol): void;
  removePiece(square: Square): void;
  getHistory(): Array<BoardConfig & {move: HistoryEntry}>;
  exportJson(): BoardConfig;
  exportFEN(): string;
  printToConsole(): void;
  aiMove(level?: number): HistoryEntry;
  ai(options?: AIOptions): AIResult;
}
export function moves(configuration: BoardConfig|string): MovesMap;
export function status(configuration: BoardConfig|string): BoardConfig;
export function getFen(configuration: BoardConfig|string): string;
export function move(configuration: BoardConfig|string, from: Square, to: Square): BoardConfig;
export function ai(configuration: BoardConfig|string, options?: AIOptions): AIResult;
export function aiMove(configuration: BoardConfig|string, level?: number): HistoryEntry;
