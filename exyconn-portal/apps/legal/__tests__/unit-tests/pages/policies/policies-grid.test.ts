import { describe, expect, it } from 'vitest';
import type { ColDef, ValueFormatterParams, ValueGetterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import type { Interpolations } from '@exyconn/i18n';
import { PolicyStatus } from '@exyconn/shell/graphql/generated';
import { POLICY_COLUMNS, type PagedPolicyRow } from '../../../../src/pages/policies/policies-grid';
import { policyRow } from './policy.fixtures';

type Formatter = (params: ValueFormatterParams<PagedPolicyRow>) => string;
type Getter = (params: ValueGetterParams<PagedPolicyRow>) => string | null;
type Hidden = (row: PagedPolicyRow) => boolean;

/** A translator that fills in {placeholders}, the way the viewer's own would in English. */
const t = (source: string, values: Interpolations = {}) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    source,
  );

const column = (id: string): ColDef<PagedPolicyRow> => {
  const found = POLICY_COLUMNS.find((col) => (col.colId ?? col.field) === id);
  if (!found) {
    throw new Error(`No column ${id}`);
  }
  return found;
};

const shown = (id: string, data: PagedPolicyRow) =>
  (column(id).valueFormatter as Formatter)({
    data,
    context: { t },
  } as ValueFormatterParams<PagedPolicyRow>);

const reviewOf = (data: PagedPolicyRow) =>
  (column('reviewState').valueGetter as Getter)({
    data,
    context: { t },
  } as ValueGetterParams<PagedPolicyRow>);

const action = (key: string): RowActionSpec => {
  const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
  const found = specs.find((spec) => spec.key === key);
  if (!found) {
    throw new Error(`No action ${key}`);
  }
  return found;
};

describe('POLICY_COLUMNS', () => {
  it('lists the register columns, then the row actions', () => {
    expect(POLICY_COLUMNS.map((col) => col.colId ?? col.field)).toEqual([
      'title',
      'slug',
      'audience',
      'status',
      'version',
      'classification',
      'requiresAcknowledgement',
      'signed',
      'effectiveDate',
      'nextReviewOn',
      'reviewState',
      'actions',
    ]);
  });

  it('writes the version the way people say it', () => {
    expect(shown('version', policyRow({ version: 4 }))).toBe('v4');
  });

  it('counts signatures, or says none are asked for', () => {
    expect(shown('signed', policyRow({ acknowledgedCount: 7 }))).toBe('7 signed');
    expect(shown('signed', policyRow({ requiresAcknowledgement: false }))).toBe('Not required');
  });

  it('says where a policy stands against its review date', () => {
    expect(reviewOf(policyRow({ reviewOverdue: true }))).toBe('OVERDUE');
    expect(reviewOf(policyRow())).toBe('SCHEDULED');
    expect(reviewOf(policyRow({ nextReviewOn: null }))).toBe('NOT SET');
  });

  it('leads with publish and the signers, then edit and delete', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['publish', 'signers', 'edit', 'delete']);
  });

  it('hides publish on an archived policy only', () => {
    const hidden = action('publish').hidden as Hidden;
    expect(hidden(policyRow({ status: PolicyStatus.Archived }))).toBe(true);
    expect(hidden(policyRow())).toBe(false);
  });

  it('offers the signer list only on a policy people are asked to sign', () => {
    const hidden = action('signers').hidden as Hidden;
    expect(hidden(policyRow({ requiresAcknowledgement: false }))).toBe(true);
    expect(hidden(policyRow())).toBe(false);
    expect(action('signers').label).toBe('who has signed');
  });
});
