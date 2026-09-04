/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/__tests__/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 30000,
  clearMocks: true,
  // Every suite boots its own mongodb-memory-server, so jest's default of one worker
  // per core starves them on a developer machine and the slowest suites time out.
  // A share of the cores keeps that bounded without changing CI, where two cores
  // already resolve to a single worker.
  maxWorkers: '25%',
};
