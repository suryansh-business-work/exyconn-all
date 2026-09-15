import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { UserModel } from '../../src/modules/admin/user.model';
import { createCrudService, MAX_LIST_ROWS } from '../../src/lib/crudService';
import { TABLE_QUERY_LIMITS, tableQuery, type TableConfig } from '../../src/utils/tableQuery';
import {
  AppLogGroupModel,
  recordServerErrors,
  resetLogIngestLimits,
  serverErrorLogPlugin,
} from '../../src/modules/logs';
import * as ingest from '../../src/modules/logs/logs.ingest';
import { foldRequestErrors, settleServerErrorLogs } from '../../src/modules/logs/logs.plugin';
import {
  MAX_SERVER_ERRORS_PER_REQUEST,
  SERVER_ERROR_WRITES_PER_MINUTE,
} from '../../src/modules/logs/logs.constants';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const CONFIG: TableConfig = {
  searchFields: ['name'],
  filterFields: ['department'],
  sortFields: ['name'],
  defaultSort: { field: 'name', dir: 'ASC' },
};

describe('tableQuery request caps', () => {
  const page = (overrides: object) =>
    tableQuery(UserModel, { page: 0, pageSize: 25, ...overrides }, CONFIG);
  const filter = (value: string) => ({ field: 'department', op: 'EQUALS' as const, value });

  it('accepts a request at every limit', async () => {
    await expect(
      page({
        search: 'a'.repeat(TABLE_QUERY_LIMITS.maxSearchLength),
        filters: Array.from({ length: TABLE_QUERY_LIMITS.maxFilters }, () =>
          filter('b'.repeat(TABLE_QUERY_LIMITS.maxFilterValueLength)),
        ),
        page: TABLE_QUERY_LIMITS.maxSkip / 25,
      }),
    ).resolves.toEqual({ rows: [], totalCount: 0 });
  });

  it.each([
    ['a long search', { search: 'a'.repeat(TABLE_QUERY_LIMITS.maxSearchLength + 1) }],
    [
      'too many filters',
      { filters: Array.from({ length: TABLE_QUERY_LIMITS.maxFilters + 1 }, () => filter('x')) },
    ],
    ['a long filter value', { filters: [filter('x'.repeat(201))] }],
    ['a page too deep', { page: TABLE_QUERY_LIMITS.maxSkip / 25 + 1 }],
  ])('refuses %s as bad input', async (_label, overrides) => {
    await expect(page(overrides)).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
  });
});

describe('crudService.list', () => {
  afterEach(() => jest.restoreAllMocks());

  it('never asks for more than MAX_LIST_ROWS', async () => {
    const limit = jest.spyOn(mongoose.Query.prototype, 'limit');
    await createCrudService(UserModel as never, 'User').list();
    expect(limit).toHaveBeenCalledWith(MAX_LIST_ROWS);
  });
});

describe('server error logging amplification', () => {
  const anonymous: GraphQLContext = { user: null, ip: '10.0.0.9' };
  const signedIn: GraphQLContext = {
    user: { id: new mongoose.Types.ObjectId().toHexString(), email: 'a@x.com', roles: [ROLES.HR] },
    ip: '10.0.0.1',
  };
  const refusal = (code: string) =>
    new GraphQLError('You do not have access', { extensions: { code } });

  async function runPlugin(errors: GraphQLError[], contextValue: GraphQLContext) {
    const hooks = await serverErrorLogPlugin.requestDidStart?.({} as never);
    await hooks?.didEncounterErrors?.({ errors, contextValue, operationName: 'Op' } as never);
    await settleServerErrorLogs();
  }

  beforeEach(() => resetLogIngestLimits());
  afterEach(() => jest.restoreAllMocks());

  it('stores no expected refusal from somebody who is not signed in', async () => {
    await runPlugin(
      ['UNAUTHENTICATED', 'FORBIDDEN', 'BAD_USER_INPUT', 'GRAPHQL_VALIDATION_FAILED'].map(refusal),
      anonymous,
    );
    expect(await AppLogGroupModel.countDocuments()).toBe(0);
  });

  it('folds repeats and caps distinct errors per request', () => {
    const errors = [
      ...Array.from({ length: 50 }, () => new GraphQLError('Order 41 exploded')),
      ...Array.from({ length: 50 }, () => refusal('FORBIDDEN')),
      ...Array.from(
        { length: 30 },
        (_, index) => new GraphQLError(`Failure ${'x'.repeat(index + 1)}`),
      ),
    ];
    const entries = foldRequestErrors(errors, 'Op', true);
    expect(entries).toHaveLength(MAX_SERVER_ERRORS_PER_REQUEST);
    expect(entries[0]).toMatchObject({ level: 'ERROR', count: 50 });
    expect(entries[1]).toMatchObject({ level: 'WARN', count: 50 });
  });

  it('answers without waiting for the log write', async () => {
    let finish = () => {};
    jest
      .spyOn(ingest, 'recordServerErrors')
      .mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
    const hooks = await serverErrorLogPlugin.requestDidStart?.({} as never);
    await expect(
      hooks?.didEncounterErrors?.({
        errors: [new GraphQLError('boom')],
        contextValue: signedIn,
        operationName: 'Op',
      } as never),
    ).resolves.toBeUndefined();
    finish();
    await settleServerErrorLogs();
  });

  it('stops writing once the per-minute budget is spent', async () => {
    const entries = Array.from({ length: SERVER_ERROR_WRITES_PER_MINUTE + 5 }, (_, index) => ({
      level: 'ERROR' as const,
      message: `Distinct failure ${'x'.repeat(index)}`,
      errorName: 'Error',
      occurredAt: new Date(),
    }));
    await recordServerErrors(entries, anonymous);
    expect(await AppLogGroupModel.countDocuments()).toBe(SERVER_ERROR_WRITES_PER_MINUTE);
  });
});
