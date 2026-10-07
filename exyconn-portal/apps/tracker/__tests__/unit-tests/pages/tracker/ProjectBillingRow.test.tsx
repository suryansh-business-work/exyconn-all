import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectBillingRow } from '../../../../src/pages/tracker/ProjectBillingRow';
import type { ProjectBillingRow as Row } from '../../../../src/pages/tracker/tracker.billing';
import { renderWithProviders } from '../../test-utils';
import { projectRow } from './tracker.fixtures';

const money = { format: (value: number) => `$${value.toFixed(2)}` } as Intl.NumberFormat;

function renderRow(row: Row, invoicing = false, onInvoice = vi.fn()) {
  renderWithProviders(
    <table>
      <tbody>
        <ProjectBillingRow row={row} money={money} onInvoice={onInvoice} invoicing={invoicing} />
      </tbody>
    </table>,
  );
  return onInvoice;
}

const invoiceButton = () => screen.getByRole('button', { name: 'Create invoice' });

describe('ProjectBillingRow', () => {
  it('sets hours and amount beside the budget the project agreed', () => {
    renderRow(projectRow({ hours: 100 }));
    expect(screen.getByText('Website rebuild')).toBeInTheDocument();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('100 h of 100 h')).toBeInTheDocument();
    expect(screen.getByText('$1200.00 of $5000.00')).toBeInTheDocument();
    expect(screen.queryByText('Over budget')).not.toBeInTheDocument();
    expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument();
    expect(invoiceButton()).toBeEnabled();
  });

  it('flags a project that ran past its budget', () => {
    renderRow(projectRow({ hours: 120, amount: 6000 }));
    expect(screen.getAllByText('Over budget')).toHaveLength(2);
  });

  it('shows a dash where no budget was set', () => {
    renderRow(projectRow({ budgetHours: null, budgetAmount: undefined }));
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('expands to the employees whose time it bills, and folds them away again', async () => {
    renderRow(
      projectRow({
        employees: [
          { employeeId: 'e1', employeeName: 'Asha Rao', hours: 20, rate: 40, amount: 800 },
          { employeeId: 'e2', employeeName: 'Dev Mehta', hours: 2.5, rate: 0, amount: 0 },
        ],
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'expand employees' }));
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('20 h')).toBeInTheDocument();
    expect(screen.getByText('$40.00')).toBeInTheDocument();
    expect(screen.getByText('$800.00')).toBeInTheDocument();
    expect(screen.getByText('Dev Mehta')).toBeInTheDocument();
    expect(screen.getByText('2.5 h')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'collapse employees' }));
    await waitFor(() => expect(screen.queryByText('Asha Rao')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'expand employees' })).toBeInTheDocument();
  });

  it('invoices the row it belongs to', async () => {
    const row = projectRow();
    const onInvoice = renderRow(row);
    await userEvent.click(invoiceButton());
    expect(onInvoice).toHaveBeenCalledWith(row);
  });

  it('cannot invoice a project with no client, and says there is none', () => {
    renderRow(projectRow({ clientId: null, clientName: '' }));
    expect(screen.getByText('No client')).toBeInTheDocument();
    expect(invoiceButton()).toBeDisabled();
  });

  it('cannot invoice time that somebody has no rate for', () => {
    renderRow(
      projectRow({
        employees: [{ employeeId: 'e1', employeeName: 'Asha Rao', hours: 5, rate: 0, amount: 0 }],
      }),
    );
    expect(invoiceButton()).toBeDisabled();
  });

  it('cannot invoice time booked to no project', () => {
    renderRow(projectRow({ projectId: '', projectName: 'No project' }));
    expect(invoiceButton()).toBeDisabled();
  });

  it('holds every invoice button while one is being raised', () => {
    renderRow(projectRow(), true);
    expect(invoiceButton()).toBeDisabled();
  });
});
