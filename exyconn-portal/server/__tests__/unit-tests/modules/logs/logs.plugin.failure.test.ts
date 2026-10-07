import { GraphQLError } from 'graphql';
import {
  serverErrorLogPlugin,
  settleServerErrorLogs,
} from '../../../../src/modules/logs/logs.plugin';
import { recordServerErrors } from '../../../../src/modules/logs/logs.ingest';
import { logger } from '../../../../src/utils/logger';
import type { GraphQLContext } from '../../../../src/middleware/auth';

// The write itself is what fails here, so the store is replaced and nothing reaches Mongo.
jest.mock('../../../../src/modules/logs/logs.ingest', () => ({
  ...jest.requireActual('../../../../src/modules/logs/logs.ingest'),
  recordServerErrors: jest.fn(),
}));

const recorded = recordServerErrors as jest.Mock;

const signedIn: GraphQLContext = {
  user: { id: 'u1', roles: ['EMPLOYEE'], email: 'u1@exyconn.com' },
  ip: '10.0.0.5',
  userAgent: 'jest',
};

async function encounter(errors: GraphQLError[]) {
  const hooks = await serverErrorLogPlugin.requestDidStart?.({} as never);
  await hooks?.didEncounterErrors?.({
    errors,
    contextValue: signedIn,
    operationName: 'SaveThing',
  } as never);
}

describe('a server error log write that fails', () => {
  it('is logged to pino instead of breaking the response', async () => {
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    recorded.mockRejectedValueOnce(new Error('Mongo unreachable'));

    await encounter([new GraphQLError('Bad input', { extensions: { code: 'BAD_USER_INPUT' } })]);
    await settleServerErrorLogs();

    expect(recorded).toHaveBeenCalledWith(
      [expect.objectContaining({ level: 'WARN', route: 'SaveThing' })],
      { user: signedIn.user, ip: '10.0.0.5', userAgent: 'jest' },
    );
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Could not store a server error log',
    );
    logged.mockRestore();
  });

  it('does not wait for the write before the request moves on', async () => {
    let finish: () => void = () => undefined;
    recorded.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );

    await encounter([new GraphQLError('Bad input', { extensions: { code: 'BAD_USER_INPUT' } })]);
    const settled = settleServerErrorLogs();
    let done = false;
    const watched = settled.then(() => {
      done = true;
    });
    await Promise.resolve();

    expect(done).toBe(false);
    finish();
    await watched;
    expect(done).toBe(true);
  });
});
