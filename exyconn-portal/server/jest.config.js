/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFiles: ['<rootDir>/__tests__/env.setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  // 79 suites each boot their own mongodb-memory-server, so the first test in a suite
  // pays for that startup while its neighbours are doing the same. 30s was enough at 55
  // suites and is not at 79.
  testTimeout: 60000,
  clearMocks: true,
  // Every suite boots its own mongodb-memory-server, so jest's default of one worker
  // per core starves them on a developer machine and the slowest suites time out.
  // A share of the cores keeps that bounded without changing CI, where two cores
  // already resolve to a single worker.
  maxWorkers: '25%',
  // sanitize-html (CommonJS) requires htmlparser2 12, which — with its dom* and entities
  // dependencies — ships only as ES modules. Node's require(esm) loads that at runtime, but
  // jest's module system cannot, so those packages (and only those) are transpiled to
  // CommonJS here. Everything else in node_modules stays untransformed.
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': ['ts-jest', { isolatedModules: true, tsconfig: { allowJs: true } }],
  },
  // pnpm keeps every package under node_modules/.pnpm/<name>@<version>/, so the exemption is
  // written against that layout: everything is ignored except those six packages.
  transformIgnorePatterns: [
    '/node_modules/\\.pnpm/(?!(htmlparser2|domhandler|domutils|domelementtype|entities|dom-serializer)@)',
    '/node_modules/(?!\\.pnpm/)(?!(htmlparser2|domhandler|domutils|domelementtype|entities|dom-serializer)/)',
  ],
};
