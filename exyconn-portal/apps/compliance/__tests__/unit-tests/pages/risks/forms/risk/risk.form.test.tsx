import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RiskForm } from '../../../../../../src/pages/risks/forms/risk';
import { riskRow } from '../../../compliance.fixtures';
import { fill, localIso, pickDate, pickOption, submitForm } from '../../../form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateRiskMutation: () => [gql.create],
  useUpdateRiskMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ReturnType<typeof riskRow> | null = null) =>
  renderWithProviders(<RiskForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('RiskForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('shows the band each default rating falls into', () => {
    renderForm();
    expect(screen.getByText('Inherent rating 9 — Medium')).toBeInTheDocument();
    expect(screen.getByText('Residual rating 4 — Low')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('asks what the risk is, who owns it and which standard it answers to', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Say what the risk is')).toBeInTheDocument();
    expect(screen.getByText('A risk with no owner is a note, not a risk')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one standard')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('files a new risk with its scores as numbers', async () => {
    renderForm();
    fill('Risk', 'Supplier outage');
    fill('Owner', 'Ravi');
    await pickOption(/Standards/, 'ISO 9001');
    submitForm();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Supplier outage',
          ownerName: 'Ravi',
          standards: ['ISO_9001'],
          likelihood: 3,
          impact: 3,
          residualLikelihood: 2,
          residualImpact: 2,
          reviewDueOn: null,
        }),
      },
    });
    expect(await screen.findByText('Risk created')).toBeInTheDocument();
  });

  it('loads a saved risk and rates it as it stands', () => {
    renderForm(riskRow());
    expect(screen.getByLabelText('Risk')).toHaveValue('Laptop theft');
    expect(screen.getByText('Inherent rating 20 — Critical')).toBeInTheDocument();
    expect(screen.getByText('Residual rating 3 — Low')).toBeInTheDocument();
  });

  it('updates the risk it was opened on, with a date changed in the picker', async () => {
    renderForm(riskRow());
    pickDate('identifiedOn', '04/15/2026');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'risk-1',
        input: expect.objectContaining({
          title: 'Laptop theft',
          likelihood: 4,
          impact: 5,
          identifiedOn: localIso(2026, 3, 15),
          reviewDueOn: '2026-12-01T00:00:00.000Z',
        }),
      },
    });
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('The register is read-only'));
    renderForm(riskRow());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('The register is read-only')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.create).not.toHaveBeenCalled();
  });
});
