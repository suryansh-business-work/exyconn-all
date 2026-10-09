import { GraphQLError } from 'graphql';
import {
  foldRequestErrors,
  serverErrorLogPlugin,
  settleServerErrorLogs,
  withoutVariableValues,
} from '../../../../src/modules/logs/logs.plugin';
import { resetLogIngestLimits } from '../../../../src/modules/logs/logs.ingest';
import { AppLogGroupModel } from '../../../../src/modules/logs/app-log-group.model';
import { MAX_SERVER_ERRORS_PER_REQUEST } from '../../../../src/modules/logs/logs.constants';
import { logger } from '../../../../src/utils/logger';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

const refused = (code: string, message = 'You do not have access to this resource') =>
  new GraphQLError(message, { extensions: { code } });

let logged: jest.SpyInstance;

beforeEach(() => {
  resetLogIngestLimits();
  logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
});

afterEach(() => logged.mockRestore());

describe('withoutVariableValues', () => {
  it('drops every rejected value but keeps the sentence', () => {
    expect(
      withoutVariableValues(
        'Variable "$a" got invalid value "x"; Expected Int. Variable "$b" got invalid value 9; Bad.',
      ),
    ).toBe(
      'Variable "$a" got an invalid value; Expected Int. Variable "$b" got an invalid value; Bad.',
    );
    expect(withoutVariableValues('Nothing to hide')).toBe('Nothing to hide');
  });
});

describe('foldRequestErrors', () => {
  it('stores no expected refusal from somebody who is not signed in', () => {
    expect(foldRequestErrors([refused('FORBIDDEN'), refused('NOT_FOUND')], 'Q', false)).toEqual([]);
    expect(logged).not.toHaveBeenCalled();
  });

  it('keeps an expected refusal from a signed-in caller as a warning, without logging it', () => {
    const [entry] = foldRequestErrors([refused('BAD_USER_INPUT')], 'SaveThing', true);

    expect(entry).toMatchObject({ level: 'WARN', route: 'SaveThing', errorName: 'GraphQLError' });
    expect(JSON.parse(entry.context ?? '')).toEqual({ path: [], code: 'BAD_USER_INPUT' });
    expect(logged).not.toHaveBeenCalled();
  });

  it('folds identical faults into one counted entry, logged once', () => {
    const fault = () => new GraphQLError('Item 7 exploded', { path: ['items', 0] });

    const entries = foldRequestErrors(
      [fault(), new GraphQLError('Item 8 exploded'), fault()],
      'ListItems',
      false,
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ level: 'ERROR', count: 3, message: 'Item 7 exploded' });
    expect(JSON.parse(entries[0].context ?? '')).toEqual({ path: ['items', 0], code: null });
    expect(logged).toHaveBeenCalledTimes(1);
  });

  it('names the cause rather than the GraphQL wrapper, and the operation when there is one', () => {
    const cause = new RangeError('Invalid time value');
    const [entry] = foldRequestErrors(
      [new GraphQLError('Invalid time value', { originalError: cause })],
      undefined,
      true,
    );

    expect(entry).toMatchObject({
      errorName: 'RangeError',
      stack: cause.stack,
      route: 'anonymous operation',
    });
    expect(logged).toHaveBeenCalledWith(
      expect.objectContaining({ err: cause, operationName: undefined }),
      'Invalid time value',
    );
  });

  it('stores a null stack for a cause that has none', () => {
    const cause = new Error('no stack');
    cause.stack = undefined;

    const [entry] = foldRequestErrors(
      [new GraphQLError('no stack', { originalError: cause })],
      null,
      true,
    );

    expect(entry.stack).toBeNull();
  });

  it('treats a non-string code as a fault', () => {
    const [entry] = foldRequestErrors(
      [new GraphQLError('odd', { extensions: { code: 500 } })],
      'Q',
      false,
    );

    expect(entry.level).toBe('ERROR');
  });

  it('keeps at most the per-request number of distinct errors', () => {
    const errors = Array.from(
      { length: MAX_SERVER_ERRORS_PER_REQUEST + 3 },
      (_, index) => new GraphQLError(`Failure ${'x'.repeat(index + 1)}`),
    );

    const entries = foldRequestErrors(errors, 'Q', true);

    expect(entries).toHaveLength(MAX_SERVER_ERRORS_PER_REQUEST);
    expect(logged).toHaveBeenCalledTimes(MAX_SERVER_ERRORS_PER_REQUEST);
  });
});

describe('serverErrorLogPlugin', () => {
  it('writes nothing when every error is an anonymous refusal', async () => {
    const hooks = await serverErrorLogPlugin.requestDidStart?.(asArg({}));
    const contextValue: GraphQLContext = { user: null };

    await hooks?.didEncounterErrors?.(
      asArg({
        errors: [refused('UNAUTHENTICATED')],
        contextValue,
        operationName: 'Me',
      }),
    );
    await settleServerErrorLogs();

    expect(await AppLogGroupModel.countDocuments()).toBe(0);
  });
});
