import { AppLogLevel, AppLogSource, AppLogStatus } from '@exyconn/shell/graphql/generated';

/** One quick filter above the grid: the field it scopes and the values the API accepts. */
export interface LogFilterSpec {
  field: 'source' | 'level' | 'status';
  label: string;
  /** Straight from the generated enums, so the options are exactly what the API accepts. */
  values: readonly string[];
}

export const LOG_FILTERS: readonly LogFilterSpec[] = [
  { field: 'source', label: 'Source', values: Object.values(AppLogSource) },
  { field: 'level', label: 'Level', values: Object.values(AppLogLevel) },
  { field: 'status', label: 'Status', values: Object.values(AppLogStatus) },
];

export type LogFilterValues = Record<LogFilterSpec['field'], string>;

/** Open problems first: what Tech lands on is what still needs fixing. */
export const DEFAULT_LOG_FILTERS: LogFilterValues = {
  source: '',
  level: '',
  status: AppLogStatus.Open,
};

/** "MOBILE" → "Mobile". */
export function enumLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}
