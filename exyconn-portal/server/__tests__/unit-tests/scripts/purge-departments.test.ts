import { asArg } from '../../mockAs';
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockPurge = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();

jest.mock('../../../src/lib/tenant/install', () => ({}));
jest.mock('../../../src/graphql', () => ({}));
jest.mock('../../../src/config/database', () => ({
  database: { connect: () => mockConnect(), disconnect: () => mockDisconnect() },
}));
jest.mock('../../../src/modules/hr/department.purge', () => ({
  purgeDepartments: (...args: unknown[]) => mockPurge(...args),
}));
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: (...args: unknown[]) => mockLogInfo(...args),
    error: (...args: unknown[]) => mockLogError(...args),
  },
}));

const counts = { departments: 3, positions: 5, organization: 'Exyconn' };
const originalArgv = process.argv;

/** Runs the script with these arguments; it starts on import. */
async function runScript(...args: string[]): Promise<void> {
  process.argv = ['node', 'purge-departments.js', ...args];
  jest.isolateModules(() => {
    jest.requireActual('../../../src/scripts/purge-departments');
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
});

afterEach(() => {
  exit.mockRestore();
  process.argv = originalArgv;
});

describe('purge-departments script', () => {
  it('only counts what it would delete without --confirm', async () => {
    mockPurge.mockResolvedValue({ ...counts, deleted: false });

    await runScript('--organization', 'exyconn');

    expect(mockPurge).toHaveBeenCalledWith('exyconn', false);
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Would delete (run again with --confirm): 3 departments and 5 positions of Exyconn',
    );
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
  });

  it('deletes with --confirm, wherever the flag is given', async () => {
    mockPurge.mockResolvedValue({ ...counts, deleted: true });

    await runScript('--confirm', '--organization', 'exyconn');

    expect(mockPurge).toHaveBeenCalledWith('exyconn', true);
    expect(mockLogInfo).toHaveBeenCalledWith('Deleted: 3 departments and 5 positions of Exyconn');
  });

  const withoutHandle: Array<[string[]]> = [[[]], [['exyconn']], [['--organization']]];

  it.each(withoutHandle)(
    'refuses to run without an organization handle (%j)',
    async (args: string[]) => {
      await runScript(...args);

      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockPurge).not.toHaveBeenCalled();
      expect(mockLogError).toHaveBeenCalledWith(
        new Error('Pass --organization <handle>, e.g. --organization exyconn'),
        'Purging departments failed',
      );
      expect(exit).toHaveBeenCalledWith(1);
    },
  );

  it('exits with an error code when the purge fails', async () => {
    const failure = new Error('No organization has the handle "nope"');
    mockPurge.mockRejectedValue(failure);

    await runScript('--organization', 'nope');

    expect(mockLogError).toHaveBeenCalledWith(failure, 'Purging departments failed');
    expect(exit).toHaveBeenCalledWith(1);
    expect(mockDisconnect).not.toHaveBeenCalled();
  });
});
