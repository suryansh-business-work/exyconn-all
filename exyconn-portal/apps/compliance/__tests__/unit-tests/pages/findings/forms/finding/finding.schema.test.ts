import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ComplianceCategory,
  FindingSource,
  FindingStatus,
  FindingType,
} from '@exyconn/shell/graphql/generated';
import {
  EFFECTIVE_NO,
  EFFECTIVE_UNANSWERED,
  EFFECTIVE_YES,
  findingSchema,
  toFindingInput,
  toFindingValues,
} from '../../../../../../src/pages/findings/forms/finding';
import { findingRow } from '../../../compliance.fixtures';

const NOW = new Date('2026-10-07T09:00:00.000Z');
const saved = () => toFindingValues(findingRow());
const messages = (values: unknown) =>
  findingSchema.safeParse(values).error?.issues.map((issue) => issue.message) ?? [];

afterEach(() => vi.useRealTimers());

describe('toFindingValues', () => {
  it('raises a new minor nonconformity from an internal audit today, unverified', () => {
    vi.useFakeTimers({ now: NOW });
    expect(toFindingValues(null)).toMatchObject({
      title: '',
      source: FindingSource.InternalAudit,
      auditId: '',
      riskId: '',
      standards: [],
      category: ComplianceCategory.Quality,
      type: FindingType.MinorNonconformity,
      raisedOn: NOW,
      dueOn: null,
      status: FindingStatus.Open,
      verifiedOn: null,
      effective: EFFECTIVE_UNANSWERED,
      evidence: [],
    });
  });

  it('loads a saved finding, keeping only what the evidence picker holds', () => {
    expect(saved()).toMatchObject({
      title: 'Leaver account still active',
      raisedOn: new Date('2026-10-05T00:00:00.000Z'),
      dueOn: new Date('2026-11-05T00:00:00.000Z'),
      verifiedOn: new Date('2026-11-10T00:00:00.000Z'),
    });
    expect(saved().evidence).toEqual([
      {
        url: 'https://cdn.example.com/checklist.pdf',
        name: 'checklist.pdf',
        contentType: 'application/pdf',
      },
    ]);
  });

  it('reads "was it effective?" as yes, no, or not checked yet', () => {
    expect(saved().effective).toBe(EFFECTIVE_YES);
    expect(toFindingValues(findingRow({ effective: false })).effective).toBe(EFFECTIVE_NO);
    expect(toFindingValues(findingRow({ effective: null })).effective).toBe(EFFECTIVE_UNANSWERED);
    expect(toFindingValues(findingRow({ effective: undefined })).effective).toBe('');
  });

  it('leaves the optional dates empty when the row has none', () => {
    const values = toFindingValues(findingRow({ dueOn: null, verifiedOn: null }));
    expect(values.dueOn).toBeNull();
    expect(values.verifiedOn).toBeNull();
  });
});

describe('findingSchema', () => {
  it('accepts a saved finding as it loads', () => {
    expect(findingSchema.safeParse(saved()).success).toBe(true);
  });

  it('asks what was found, against which standard, and who owns putting it right', () => {
    expect(messages(toFindingValues(null))).toEqual([
      'Say what was found',
      'Pick at least one standard',
      'Somebody has to own putting it right',
    ]);
  });

  it('closes a finding only once its action is verified and judged', () => {
    const closed = { ...saved(), status: FindingStatus.Closed };
    expect(findingSchema.safeParse(closed).success).toBe(true);
    const unverified = { ...closed, verifiedOn: '' };
    expect(findingSchema.safeParse(unverified).error?.issues[0]).toMatchObject({
      message: 'A finding closes once its corrective action has been verified',
      path: ['verifiedOn'],
    });
    expect(messages({ ...closed, effective: EFFECTIVE_UNANSWERED })).toEqual([
      'A finding closes once its corrective action has been verified',
    ]);
  });

  it('refuses an answer to "was it effective?" that is not one of the three', () => {
    expect(findingSchema.safeParse({ ...saved(), effective: 'MAYBE' }).success).toBe(false);
  });
});

describe('toFindingInput', () => {
  it('sends the answer as a boolean or null, the dates as ISO, and no close date while open', () => {
    const input = toFindingInput(findingSchema.parse(saved()));
    expect(input).toMatchObject({
      effective: true,
      raisedOn: '2026-10-05T00:00:00.000Z',
      dueOn: '2026-11-05T00:00:00.000Z',
      verifiedOn: '2026-11-10T00:00:00.000Z',
      closedOn: null,
    });
    const open = findingSchema.parse({ ...saved(), dueOn: null, verifiedOn: null, effective: '' });
    expect(toFindingInput(open)).toMatchObject({ effective: null, dueOn: null, verifiedOn: null });
    expect(toFindingInput({ ...open, effective: EFFECTIVE_NO }).effective).toBe(false);
  });

  it('stamps the close date when the finding is closed', () => {
    vi.useFakeTimers({ now: NOW });
    const closed = findingSchema.parse({ ...saved(), status: FindingStatus.Closed });
    expect(toFindingInput(closed).closedOn).toBe(NOW.toISOString());
  });
});
