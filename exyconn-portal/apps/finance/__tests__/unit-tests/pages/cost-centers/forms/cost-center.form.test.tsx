import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CostCenterForm } from '../../../../../src/pages/cost-centers/forms/cost-center';
import { costCenterRow } from '../../../fixtures';
import { field, renderForm } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateCostCenterMutation: () => [gql.create],
  useUpdateCostCenterMutation: () => [gql.update],
}));

const codeField = () => screen.getByLabelText('Code');

async function submitCode(code: string) {
  await userEvent.clear(codeField());
  await userEvent.type(codeField(), code);
  await userEvent.click(screen.getByRole('button', { name: 'Update' }));
}

describe('CostCenterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createCostCenter: { id: 'centre-9' } } });
    gql.update.mockResolvedValue({ data: { updateCostCenter: { id: 'centre-1' } } });
  });

  it('creates an active centre from a short code and a name', async () => {
    const onDone = vi.fn();
    renderForm(<CostCenterForm initial={null} onDone={onDone} onCancel={vi.fn()} />);
    expect(field('isActive')).toBeChecked();

    await userEvent.type(codeField(), 'MKT-1');
    await userEvent.type(screen.getByLabelText('Name'), '  Marketing  ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: { input: { code: 'MKT-1', name: 'Marketing', description: '', isActive: true } },
    });
    expect(await screen.findByText('Cost centre created')).toBeInTheDocument();
  });

  it('requires a code and a name', async () => {
    renderForm(<CostCenterForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Code must be at least 2 characters')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the code between 2 and 12 letters, digits or hyphens', async () => {
    renderForm(<CostCenterForm initial={costCenterRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await submitCode('E');
    expect(await screen.findByText('Code must be at least 2 characters')).toBeInTheDocument();

    await submitCode('ENGINEERING-1');
    expect(
      await screen.findByText('Keep the code short — it is quoted, not read'),
    ).toBeInTheDocument();

    await submitCode('ENG_1');
    expect(await screen.findByText('Letters, digits and hyphens only')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();

    await submitCode('ENGINEERING1');
    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
  });

  it('retires a centre by switching it off, keeping the rest of the record', async () => {
    const onDone = vi.fn();
    renderForm(<CostCenterForm initial={costCenterRow()} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(field('isActive'));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'centre-1',
        input: {
          code: 'ENG',
          name: 'Engineering',
          description: 'Product and platform',
          isActive: false,
        },
      },
    });
    expect(await screen.findByText('Cost centre updated')).toBeInTheDocument();
  });

  it('says why a save failed and keeps the form open', async () => {
    gql.update.mockRejectedValueOnce(new Error('Code ENG is taken'));
    const onDone = vi.fn();
    renderForm(<CostCenterForm initial={costCenterRow()} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Code ENG is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on cancel', async () => {
    const onCancel = vi.fn();
    renderForm(<CostCenterForm initial={null} onDone={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
