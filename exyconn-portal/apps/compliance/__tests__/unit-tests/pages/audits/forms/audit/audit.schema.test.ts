import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuditKind, AuditStatus } from '@exyconn/shell/graphql/generated';
import {
  auditSchema,
  toAuditInput,
  toAuditValues,
} from '../../../../../../src/pages/audits/forms/audit';
import { auditRow } from '../../../compliance.fixtures';

const saved = () => toAuditValues(auditRow());
const issues = (values: unknown) =>
  auditSchema.safeParse(values).error?.issues.map(({ message, path }) => ({ message, path })) ?? [];

describe('toAuditValues', () => {
  afterEach(() => vi.useRealTimers());

  it('plans a new internal audit for today, not yet carried out', () => {
    const now = new Date('2026-10-07T09:00:00.000Z');
    vi.useFakeTimers({ now });
    expect(toAuditValues(null)).toEqual({
      title: '',
      kind: AuditKind.Internal,
      standards: [],
      scope: '',
      criteria: '',
      leadAuditorId: '',
      leadAuditorName: '',
      auditeeName: '',
      plannedOn: now,
      performedOn: null,
      status: AuditStatus.Planned,
      summary: '',
      conclusion: '',
    });
  });

  it('loads a reported audit with its dates', () => {
    expect(saved()).toMatchObject({ title: 'Access control audit', status: AuditStatus.Reported });
    expect(saved().plannedOn).toEqual(new Date('2026-10-01T00:00:00.000Z'));
    expect(saved().performedOn).toEqual(new Date('2026-10-05T00:00:00.000Z'));
    expect(toAuditValues(auditRow({ performedOn: null })).performedOn).toBeNull();
  });
});

describe('auditSchema', () => {
  it('accepts a reported audit that says when it ran and what it concluded', () => {
    expect(auditSchema.safeParse(saved()).success).toBe(true);
  });

  it('asks for a name, a standard, a scope and a lead auditor', () => {
    expect(issues(toAuditValues(null)).map((issue) => issue.message)).toEqual([
      'Name the audit',
      'Pick at least one standard',
      'Say what is being audited',
      'Name the lead auditor',
    ]);
  });

  it.each([AuditStatus.Reported, AuditStatus.Closed])(
    'will not let a %s audit leave out when it ran or what it found',
    (status) => {
      expect(issues({ ...saved(), status, performedOn: null, conclusion: '  ' })).toEqual([
        { message: 'A reported audit has to say when it was carried out', path: ['performedOn'] },
        { message: 'A reported audit has to say what it concluded', path: ['conclusion'] },
      ]);
    },
  );

  it.each([AuditStatus.Planned, AuditStatus.InProgress])(
    'lets a %s audit wait for its date and conclusion',
    (status) => {
      expect(issues({ ...saved(), status, performedOn: '', conclusion: '' })).toEqual([]);
    },
  );

  it('takes the date the picker writes back', () => {
    const parsed = auditSchema.parse({ ...saved(), plannedOn: '2026-04-15T00:00:00.000Z' });
    expect(parsed.plannedOn).toEqual(new Date('2026-04-15T00:00:00.000Z'));
  });
});

describe('toAuditInput', () => {
  it('sends the dates back as ISO strings, or null when it has not run', () => {
    const input = toAuditInput(auditSchema.parse(saved()));
    expect(input).toMatchObject({
      plannedOn: '2026-10-01T00:00:00.000Z',
      performedOn: '2026-10-05T00:00:00.000Z',
      conclusion: 'Effective with one minor finding',
    });
    const planned = auditSchema.parse({
      ...saved(),
      status: AuditStatus.Planned,
      performedOn: null,
    });
    expect(toAuditInput(planned).performedOn).toBeNull();
  });
});
