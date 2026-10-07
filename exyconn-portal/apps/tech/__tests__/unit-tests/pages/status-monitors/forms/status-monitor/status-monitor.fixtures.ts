import { StatusCategory, StatusState } from '@exyconn/shell/graphql/generated';
import type { StatusMonitorRow } from '../../../../../../src/pages/status-monitors/forms/status-monitor';

/** A saved monitor as the list returns it. */
export const MONITOR: StatusMonitorRow = {
  id: 'mon-1',
  key: 'tools-api',
  name: 'Tools API',
  description: 'The public tools backend',
  category: StatusCategory.Api,
  url: 'https://tools-api.example.com/health',
  isActive: false,
  order: 4,
  state: StatusState.Operational,
  lastCheckedAt: '2026-10-04T08:00:00.000Z',
  lastResponseMs: 120,
  lastHttpStatus: 200,
  lastError: '',
};
