import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditForm } from '../../../../../../src/pages/audits/forms/audit';
import { auditRow } from '../../../compliance.fixtures';
import { fill, localIso, pickDate, pickOption, submitForm } from '../../../form.helpers';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateInternalAuditMutation: () => [gql.create],
  useUpdateInternalAuditMutation: () => [gql.update],
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const renderForm = (initial: ReturnType<typeof auditRow> | null = null) =>
  renderWithProviders(<AuditForm initial={initial} onDone={onDone} onCancel={onCancel} />);

describe('AuditForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('asks for a name, a standard, a scope and a lead auditor', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name the audit')).toBeInTheDocument();
    expect(screen.getByText('Pick at least one standard')).toBeInTheDocument();
    expect(screen.getByText('Say what is being audited')).toBeInTheDocument();
    expect(screen.getByText('Name the lead auditor')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('plans a new internal audit, not yet carried out', async () => {
    renderForm();
    fill('Audit', 'Supplier evaluation');
    fill('Scope', 'Purchasing');
    fill('Lead auditor', 'Meera');
    await pickOption(/Standards/, 'ISO 9001');
    submitForm();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: expect.objectContaining({
          title: 'Supplier evaluation',
          kind: 'INTERNAL',
          scope: 'Purchasing',
          leadAuditorName: 'Meera',
          standards: ['ISO_9001'],
          status: 'PLANNED',
          performedOn: null,
        }),
      },
    });
    expect(await screen.findByText('Audit created')).toBeInTheDocument();
  });

  it('writes the report onto the audit it was planned as', async () => {
    renderForm(auditRow());
    expect(screen.getByLabelText('Conclusion')).toHaveValue('Effective with one minor finding');
    pickDate('performedOn', '10/06/2026');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'audit-1',
        input: expect.objectContaining({
          plannedOn: '2026-10-01T00:00:00.000Z',
          performedOn: localIso(2026, 9, 6),
          conclusion: 'Effective with one minor finding',
        }),
      },
    });
  });

  it('will not report an audit without saying what it concluded', async () => {
    renderForm(auditRow());
    fill('Conclusion', '');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('A reported audit has to say what it concluded'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValue(new Error('Audit is locked'));
    renderForm(auditRow());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Audit is locked')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
