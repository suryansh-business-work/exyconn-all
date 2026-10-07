import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
} from '@exyconn/shell/graphql/generated';
import {
  incidentSchema,
  toIncidentInput,
  toIncidentValues,
} from '../../../../../../src/pages/incidents/forms/incident';
import { incidentRow } from '../../../../core/rows.fixtures';

const firstError = (value: object) => {
  const result = incidentSchema.safeParse(value);
  return result.success ? null : result.error.issues[0]?.message;
};

const valid = toIncidentValues(incidentRow());

describe('incidentSchema', () => {
  it('accepts an ongoing incident with no root cause yet', () => {
    expect(firstError(valid)).toBeNull();
  });

  it('needs the root cause once the incident is closed', () => {
    expect(firstError({ ...valid, status: ItIncidentStatus.Closed })).toBe(
      'A resolved incident needs its root cause written down',
    );
    expect(
      firstError({ ...valid, status: ItIncidentStatus.Closed, rootCause: 'Expired certificate' }),
    ).toBeNull();
  });

  it('needs a start time and a real action on every follow-up', () => {
    expect(firstError({ ...valid, startedAt: '' })).toBe('When did it start?');
    expect(
      firstError({
        ...valid,
        followUps: [{ title: 'Do', ownerName: '', dueAt: '', done: false }],
      }),
    ).toBe('Say what has to be done');
  });
});

describe('toIncidentInput', () => {
  it('sends an undated follow-up as null and keeps a set date', () => {
    const input = toIncidentInput(valid);
    expect(input.followUps).toEqual([
      { title: 'Renew certificate', ownerName: 'Ravi', dueAt: null, done: false },
      { title: 'Add monitoring', ownerName: '', dueAt: '2026-11-01T00:00:00.000Z', done: true },
    ]);
  });
});

describe('toIncidentValues', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts a new incident as a SEV3 outage under investigation, from now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-07T09:00:00.000Z'));
    expect(toIncidentValues(null)).toEqual({
      title: '',
      description: '',
      severity: ItIncidentSeverity.Sev3,
      category: ItIncidentCategory.Outage,
      status: ItIncidentStatus.Investigating,
      startedAt: '2026-10-07T09:00:00.000Z',
      impact: '',
      affectedSystems: [],
      commanderName: '',
      rootCause: '',
      followUps: [],
    });
  });

  it('loads a saved incident, turning an undated follow-up into a blank date', () => {
    expect(valid).toMatchObject({
      title: 'VPN down',
      severity: ItIncidentSeverity.Sev2,
      affectedSystems: ['VPN', 'Firewall'],
      followUps: [
        { title: 'Renew certificate', ownerName: 'Ravi', dueAt: '', done: false },
        { title: 'Add monitoring', ownerName: '', dueAt: '2026-11-01T00:00:00.000Z', done: true },
      ],
    });
  });
});
