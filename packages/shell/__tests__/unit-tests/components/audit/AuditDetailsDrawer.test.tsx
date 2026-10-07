import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@exyconn/i18n';
import { AuditDetailsDrawer, type AuditLogRow } from '@/components/audit';
import { AuditAction } from '@/graphql/generated';

const row: AuditLogRow = {
  id: 'a1',
  actorId: 'u1',
  actorName: 'Asha',
  actorEmail: 'asha@example.com',
  action: AuditAction.Update,
  module: 'Invoice',
  entityId: 'i1',
  entityLabel: 'INV-001',
  summary: 'Payment recorded on Invoice INV-001',
  changes: JSON.stringify({ status: { from: 'SENT', to: 'PAID' } }),
  ip: '192.0.2.10',
  createdAt: '2026-09-01T10:00:00.000Z',
};

function renderDrawer(value: AuditLogRow | null, onClose = vi.fn()) {
  render(
    <I18nProvider locale="en" messages={{ 'Change details': 'Detalles', Actor: 'Autor' }}>
      <AuditDetailsDrawer
        row={value}
        title="Change details"
        onClose={onClose}
        formatDateTime={(at) => `on ${at}`}
      />
    </I18nProvider>,
  );
  return onClose;
}

describe('AuditDetailsDrawer', () => {
  it('shows who changed what, when, from where, and the field diff', async () => {
    const user = userEvent.setup();
    const onClose = renderDrawer(row);

    expect(screen.getByRole('heading', { name: 'Detalles' })).toBeInTheDocument();
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    expect(screen.getByText('Invoice')).toBeInTheDocument();
    expect(screen.getByText('Payment recorded on Invoice INV-001')).toBeInTheDocument();
    expect(screen.getByText('Autor').nextElementSibling).toHaveTextContent(
      'Asha (asha@example.com)',
    );
    expect(screen.getByText('When').nextElementSibling).toHaveTextContent(
      'on 2026-09-01T10:00:00.000Z',
    );
    expect(screen.getByText('Entity').nextElementSibling).toHaveTextContent('INV-001 · i1');
    expect(screen.getByText('IP address').nextElementSibling).toHaveTextContent('192.0.2.10');

    const table = screen.getByRole('table', { name: 'changed fields' });
    const [, change] = within(table).getAllByRole('row');
    expect(
      within(change)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['status', 'SENT', 'PAID']);

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to the email, the bare id and a dash, and drops the table with no diff', () => {
    renderDrawer({ ...row, actorName: '', entityLabel: '', ip: '', changes: '' });

    expect(screen.getByText('Autor').nextElementSibling).toHaveTextContent(/^asha@example\.com$/);
    expect(screen.getByText('Entity').nextElementSibling).toHaveTextContent(/^i1$/);
    expect(screen.getByText('IP address').nextElementSibling).toHaveTextContent('—');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders nothing without a row', () => {
    renderDrawer(null);
    expect(screen.queryByText('Detalles')).not.toBeInTheDocument();
  });
});
