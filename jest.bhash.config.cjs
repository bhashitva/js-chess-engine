const base = require('./jest.config.js');
module.exports = {
  ...base,
  testMatch: ['**/test/integration/api.test.ts', '**/test/integration/fen.test.ts'],
  moduleNameMapper: { '^\\.\\./\\.\\./src$': '<rootDir>/bhash/index.cjs' },
  testTimeout: 300000,
};
