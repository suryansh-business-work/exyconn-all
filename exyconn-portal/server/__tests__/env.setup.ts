// Runs before any module (and env.ts) is imported, so config validation passes
// against deterministic test values. The real Mongo connection is replaced by an
// in-memory server in setup.ts.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Installs the organization scope BEFORE any model is defined (see src/lib/tenant/install).
// The suites here predate the tenancy and drive services directly with no request to inherit
// a company from, so they run as the platform — the tenancy itself is tested in
// tenancy.test.ts, which sets its own scopes.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { setDefaultScope } = require('../src/lib/tenant') as typeof import('../src/lib/tenant');
setDefaultScope({ organizationId: null, platform: true });
