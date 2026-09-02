import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Email delivery is an external side effect; stub it so user creation works
// deterministically in tests without configured SMTP credentials.
jest.mock('../src/utils/mailer', () => ({
  mailer: {
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendCredentialsEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
