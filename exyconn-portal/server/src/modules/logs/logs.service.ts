import { AppLogGroupModel } from './app-log-group.model';
import { AppLogEventModel } from './app-log-event.model';
import { RECENT_EVENTS_LIMIT, type AppLogStatus } from './logs.constants';
import { notFound } from '../../utils/errors';
import {
  tableQuery,
  tableStats,
  type StatsConfig,
  type TableConfig,
  type TableQueryInput,
} from '../../utils/tableQuery';

/** Whitelist of the columns the Tech > Logs grid may search / filter / sort. */
const LOGS_TABLE_CONFIG: TableConfig = {
  searchFields: ['message', 'errorName', 'app', 'route', 'lastUserName', 'lastUserEmail'],
  filterFields: [
    'source',
    'level',
    'status',
    'app',
    'message',
    'errorName',
    'route',
    'lastUserName',
    'platform',
    'appVersion',
  ],
  sortFields: [
    'lastSeenAt',
    'firstSeenAt',
    'count',
    'userCount',
    'level',
    'source',
    'app',
    'status',
    'message',
    'lastUserName',
    'platform',
    'appVersion',
  ],
  defaultSort: { field: 'lastSeenAt', dir: 'DESC' },
};

const LOGS_STATS_CONFIG: StatsConfig = { countBy: ['status', 'level', 'source'], sum: ['count'] };

export function listAppLogGroupsPaged(input: TableQueryInput) {
  return tableQuery(AppLogGroupModel, input, LOGS_TABLE_CONFIG);
}

export function listAppLogGroupsStats() {
  return tableStats(AppLogGroupModel, LOGS_STATS_CONFIG);
}

export async function getAppLogGroup(id: string) {
  const group = await AppLogGroupModel.findById(id).lean();
  if (!group) {
    notFound('Log');
  }
  return group;
}

/** The group's most recent occurrences, newest first. */
export function listAppLogEvents(groupId: string, limit = RECENT_EVENTS_LIMIT) {
  return AppLogEventModel.find({ groupId }).sort({ occurredAt: -1 }).limit(limit).lean();
}

export async function setAppLogGroupStatus(id: string, status: AppLogStatus) {
  const resolvedAt = status === 'OPEN' ? null : new Date();
  const group = await AppLogGroupModel.findByIdAndUpdate(
    id,
    { $set: { status, resolvedAt } },
    { new: true },
  ).lean();
  if (!group) {
    notFound('Log');
  }
  return group;
}

export async function deleteAppLogGroup(id: string): Promise<boolean> {
  const deleted = await AppLogGroupModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    notFound('Log');
  }
  await AppLogEventModel.deleteMany({ groupId: deleted._id });
  return true;
}
