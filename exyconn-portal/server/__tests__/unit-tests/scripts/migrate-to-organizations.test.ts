import { asArg } from '../../mockAs';
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockMigrate = jest.fn();
const mockLogError = jest.fn();

jest.mock('../../../src/lib/tenant/install', () => ({}));
jest.mock('../../../src/graphql', () => ({}));
jest.mock('../../../src/config/database', () => ({
  database: { connect: () => mockConnect(), disconnect: () => mockDisconnect() },
}));
jest.mock('../../../src/modules/organizations', () => ({
  migrateLegacyDataIntoFirstOrganization: () => mockMigrate(),
}));
jest.mock('../../../src/utils/logger', () => ({
  logger: { error: (...args: unknown[]) => mockLogError(...args) },
}));

/** Runs the script, which starts on import, and lets its promise chain settle. */
async function runScript(): Promise<void> {
  jest.isolateModules(() => {
    jest.requireActual('../../../src/scripts/migrate-to-organizations');
  });
  for (let tick = 0; tick < 5; tick += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

let exit: jest.SpyInstance;

beforeEach(() => {
  exit = jest.spyOn(process, 'exit').mockImplementation(asArg(() => undefined));
  mockConnect.mockResolvedValue(undefined);
  mockDisconnect.mockResolvedValue(undefined);
  mockMigrate.mockResolvedValue(undefined);
});

afterEach(() => exit.mockRestore());

describe('migrate-to-organizations script', () => {
  it('connects, moves the legacy data into the first organization, then disconnects', async () => {
    await runScript();

    expect(mockConnect).toHaveBeenCalledTimes(1);
    expect(mockMigrate).toHaveBeenCalledTimes(1);
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockConnect.mock.invocationCallOrder[0]).toBeLessThan(
      mockMigrate.mock.invocationCallOrder[0],
    );
    expect(mockMigrate.mock.invocationCallOrder[0]).toBeLessThan(
      mockDisconnect.mock.invocationCallOrder[0],
    );
    expect(exit).not.toHaveBeenCalled();
  });

  it('logs a failed migration and exits with an error code', async () => {
    const failure = new Error('duplicate key');
    mockMigrate.mockRejectedValue(failure);

    await runScript();

    expect(mockLogError).toHaveBeenCalledWith(failure, 'Migration failed');
    expect(exit).toHaveBeenCalledWith(1);
    expect(mockDisconnect).not.toHaveBeenCalled();
  });
});
