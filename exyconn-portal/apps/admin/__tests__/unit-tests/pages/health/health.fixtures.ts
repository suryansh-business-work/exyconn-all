import type { SystemHealthQuery } from '@exyconn/shell/graphql/generated';

type Health = SystemHealthQuery['systemHealth'];
export type Backup = Health['backup'];
export type HealthJob = Health['jobs'][number];

/** A formatter that shows exactly what it was handed, so a test can see it was used. */
export const formatDateTime = (value: string | null | undefined) => `at ${value ?? ''}`;

export const backup = (overrides: Partial<Backup> = {}): Backup => ({
  __typename: 'HealthBackup',
  configured: true,
  ok: true,
  lastRunAt: '2026-10-01T02:00:00.000Z',
  archive: 'exyconn-2026-10-01.gz',
  sizeMb: 12.5,
  retainDays: 14,
  message: '',
  ...overrides,
});

export const job = (overrides: Partial<HealthJob> = {}): HealthJob => ({
  __typename: 'HealthJob',
  key: 'payslips',
  label: 'Payslip schedule',
  enabled: true,
  lastRunAt: '2026-10-01T03:00:00.000Z',
  lastRunSummary: 'Sent 4 payslips',
  ...overrides,
});

export const health = (overrides: Partial<Health> = {}): Health => ({
  __typename: 'SystemHealth',
  serverVersion: '1.9.0',
  nodeVersion: 'v22.3.0',
  uptimeSeconds: 750,
  mongo: {
    __typename: 'HealthMongo',
    ok: true,
    dbName: 'exyconn',
    collections: 42,
    dataSizeMb: 81.2,
  },
  jobs: [job()],
  counts: [{ __typename: 'HealthCount', label: 'Open tickets', value: 7 }],
  backup: backup(),
  ...overrides,
});
