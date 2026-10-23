import { Game } from '../bhash/index.mjs';
const game = new Game();
console.log('भाष शतरंज / Bhash chess');
game.printToConsole();
console.log('E2 moves:', game.moves('E2'));
game.move('E2', 'E4');
console.log('AI reply:', game.ai({ level: 1, analysis: true }));
console.log('FEN:', game.exportFEN());
game.printToConsole();
