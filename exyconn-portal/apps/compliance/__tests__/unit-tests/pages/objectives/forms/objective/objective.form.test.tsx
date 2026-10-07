import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ObjectiveForm } from '../../../../../../src/pages/objectives/forms/objective';
import { objectiveRow } from '../../../compliance.fixtures';
import { fill, localIso, pickDate, pickOption, submitForm } from '../../../form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateObjectiveMutation: () => [gql.create],
  useUpdateObjectiveMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ReturnType<typeof objectiveRow> | null = null) =>
  renderWithProviders(<ObjectiveForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('ObjectiveForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a target that differs from the baseline before anything is typed', () => {
    renderForm();
    expect(screen.getByText('Set a target that differs from the baseline')).toBeInTheDocument();
  });

  it('asks what the objective is, who owns it and how it is measured', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Say what the objective is')).toBeInTheDocument();
    expect(screen.getByText('An objective needs an owner')).toBeInTheDocument();
    expect(screen.getByText('Say how it is measured')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one standard')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('says how far the current value has come as it is typed', () => {
    renderForm(objectiveRow());
    expect(screen.getByText('50% of the way from 20 to 10')).toBeInTheDocument();
    fill('Current value', '12');
    expect(screen.getByText('80% of the way from 20 to 10')).toBeInTheDocument();
  });

  it('sets a new objective with its figures as numbers', async () => {
    renderForm();
    fill('Objective', 'Zero lost-time injuries');
    fill('Owner', 'Asha');
    fill('Measured by', 'Lost-time injuries');
    fill('Baseline', '4');
    fill('Target', '0');
    await pickOption(/Standards/, 'ISO 45001');
    submitForm();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Zero lost-time injuries',
          ownerName: 'Asha',
          measure: 'Lost-time injuries',
          standards: ['ISO_45001'],
          baseline: 4,
          target: 0,
          actual: 0,
        }),
      },
    });
  });

  it('updates the objective it was opened on, with a new end to its period', async () => {
    renderForm(objectiveRow());
    pickDate('periodEnd', '06/30/2027');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'objective-1',
        input: expect.objectContaining({
          title: 'Fewer complaints',
          periodStart: '2026-01-01T00:00:00.000Z',
          periodEnd: localIso(2027, 5, 30),
        }),
      },
    });
    expect(await screen.findByText('Objective updated')).toBeInTheDocument();
  });

  it('refuses a period that ends before it starts', async () => {
    renderForm(objectiveRow());
    pickDate('periodEnd', '12/31/2025');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('The period cannot end before it starts')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
