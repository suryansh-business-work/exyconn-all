import { runAsPlatform } from '../../../lib/tenant';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TableQueryInput,
} from '../../../utils/tableQuery';
import { registerTable } from '../../table-transfer/registry';
import { IntegrationCallModel } from './call-log.model';

/** Environment Variables > Usage history: every integration call, searchable on the server. */
const CALL_TABLE: TableConfig = {
  searchFields: ['action', 'actorEmail', 'source', 'error'],
  filterFields: ['provider', 'action', 'ok', 'companyId', 'actorEmail', 'source', 'createdAt'],
  sortFields: ['createdAt', 'provider', 'action', 'durationMs', 'costUsd', 'inputTokens'],
  defaultSort: { field: 'createdAt', dir: 'DESC' },
};
registerTable('listIntegrationCallsPaged', CALL_TABLE);

const CALL_STATS: StatsConfig = {
  countBy: ['provider', 'ok'],
  sum: ['costUsd', 'inputTokens', 'outputTokens', 'durationMs'],
};

export const callLog = {
  page: (input: TableQueryInput) =>
    runAsPlatform(() => tableQuery(IntegrationCallModel, input, CALL_TABLE)),
  stats: () => runAsPlatform(() => tableStats(IntegrationCallModel, CALL_STATS)),
};
