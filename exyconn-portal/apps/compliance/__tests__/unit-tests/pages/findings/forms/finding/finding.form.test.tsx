import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FindingStatus } from '@exyconn/shell/graphql/generated';
import { FindingForm } from '../../../../../../src/pages/findings/forms/finding';
import { findingRow } from '../../../compliance.fixtures';
import { fill, pickOption, submitForm } from '../../../form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  audits: vi.fn(),
  risks: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateFindingMutation: () => [gql.create],
  useUpdateFindingMutation: () => [gql.update],
  useListInternalAuditsQuery: gql.audits,
  useListRisksQuery: gql.risks,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ReturnType<typeof findingRow> | null = null) =>
  renderWithProviders(<FindingForm initial={initial} onDone={onDone} onCancel={onCancel} />);

const optionsOf = async (name: RegExp) => {
  await userEvent.click(screen.getByRole('combobox', { name }));
  return within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent);
};

describe('FindingForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.audits.mockReturnValue({
      data: { listInternalAudits: [{ id: 'audit-1', reference: 'AUD-0001', title: 'Access' }] },
    });
    gql.risks.mockReturnValue({
      data: { listRisks: [{ id: 'risk-1', reference: 'RISK-0001', title: 'Laptop theft' }] },
    });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('links a finding to any audit on the programme, or to none', async () => {
    renderForm();
    expect(await optionsOf(/^Audit/)).toEqual(['None', 'AUD-0001 — Access']);
  });

  it('links a finding to any risk on the register, or to none', async () => {
    renderForm();
    expect(await optionsOf(/^Related risk/)).toEqual(['None', 'RISK-0001 — Laptop theft']);
  });

  it('offers only "None" until the audits and risks have loaded', async () => {
    gql.audits.mockReturnValue({ data: undefined });
    gql.risks.mockReturnValue({ data: undefined });
    renderForm();
    expect(await optionsOf(/^Related risk/)).toEqual(['None']);
  });

  it('asks what was found, against which standard, and who owns putting it right', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Say what was found')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one standard')).toBeInTheDocument();
    expect(screen.getByText('Somebody has to own putting it right')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('raises a new finding, its effectiveness not yet checked', async () => {
    renderForm();
    fill('Finding', 'Fire door propped open');
    fill('Owner', 'Kiran');
    await pickOption(/Standards/, 'ISO 45001');
    submitForm();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Fire door propped open',
          ownerName: 'Kiran',
          standards: ['ISO_45001'],
          effective: null,
          evidence: [],
          closedOn: null,
        }),
      },
    });
    expect(await screen.findByText('Finding created')).toBeInTheDocument();
  });

  it('loads a saved finding with its links, its answer and its evidence', () => {
    renderForm(findingRow());
    expect(screen.getByRole('combobox', { name: /^Audit/ })).toHaveTextContent('AUD-0001 — Access');
    expect(screen.getByRole('combobox', { name: /^Was it effective/ })).toHaveTextContent(
      'Yes — it worked',
    );
    expect(screen.getByText('checklist.pdf')).toBeInTheDocument();
  });

  it('updates the finding it was opened on, keeping its evidence', async () => {
    renderForm(findingRow());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'finding-1',
        input: expect.objectContaining({
          effective: true,
          verifiedOn: '2026-11-10T00:00:00.000Z',
          evidence: [
            {
              url: 'https://cdn.example.com/checklist.pdf',
              name: 'checklist.pdf',
              contentType: 'application/pdf',
            },
          ],
        }),
      },
    });
  });

  it('will not close a finding whose corrective action nobody has verified', async () => {
    renderForm(findingRow({ status: FindingStatus.Closed, verifiedOn: null, effective: null }));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('A finding closes once its corrective action has been verified'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
