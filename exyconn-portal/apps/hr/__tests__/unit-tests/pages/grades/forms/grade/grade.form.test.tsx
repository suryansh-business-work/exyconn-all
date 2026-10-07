import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GradeForm, type GradeRow } from '../../../../../../src/pages/grades/forms/grade';
import { renderWithProviders } from '../../../../test-utils';
import { press, setNumber, typeInto } from '../../../../harness/forms';

vi.setConfig({ testTimeout: 20_000 });

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateGradeMutation: () => [gql.create],
  useUpdateGradeMutation: () => [gql.update],
}));

const row: GradeRow = {
  id: 'grade-3',
  name: 'Senior engineer',
  code: 'E3',
  level: 3,
  minSalary: 1800000,
  maxSalary: 2600000,
  active: true,
};

function renderForm(initial: GradeRow | null = null) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<GradeForm initial={initial} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel };
}

describe('GradeForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({});
    gql.update.mockReset().mockResolvedValue({});
  });

  it('asks for a name and a code', async () => {
    renderForm();

    await press('Create');

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('refuses a negative level or salary', async () => {
    renderForm();

    setNumber('Level', '-1');
    setNumber('Minimum salary', '-5');
    await press('Create');

    expect(await screen.findAllByText('Must be ≥ 0')).toHaveLength(2);
  });

  it('creates a grade with its band as numbers', async () => {
    const { onDone } = renderForm();

    await typeInto('Name', 'Associate');
    await typeInto('Code', 'E1');
    setNumber('Level', '1');
    setNumber('Minimum salary', '600000');
    setNumber('Maximum salary', '900000');
    await userEvent.click(screen.getByLabelText('Active'));
    await press('Create');

    await waitFor(() =>
      expect(gql.create).toHaveBeenCalledWith({
        variables: {
          input: {
            name: 'Associate',
            code: 'E1',
            level: 1,
            minSalary: 600000,
            maxSalary: 900000,
            active: true,
          },
        },
      }),
    );
    expect(await screen.findByText('Grade created')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('updates an existing grade by id', async () => {
    renderForm(row);

    expect(screen.getByRole('spinbutton', { name: 'Level' })).toHaveValue(3);
    setNumber('Maximum salary', '2800000');
    await press('Update');

    await waitFor(() =>
      expect(gql.update).toHaveBeenCalledWith({
        variables: {
          id: 'grade-3',
          input: {
            name: 'Senior engineer',
            code: 'E3',
            level: 3,
            minSalary: 1800000,
            maxSalary: 2800000,
            active: true,
          },
        },
      }),
    );
    expect(await screen.findByText('Grade updated')).toBeInTheDocument();
  });

  it('says why the save failed', async () => {
    gql.update.mockRejectedValueOnce(new Error('Code E3 is taken'));
    const { onDone } = renderForm(row);

    await press('Update');

    expect(await screen.findByText('Code E3 is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
