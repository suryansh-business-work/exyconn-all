// Runs before any module (and env.ts) is imported, so config validation passes
// against deterministic test values. The real Mongo connection is replaced by an
// in-memory server in setup.ts.
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
