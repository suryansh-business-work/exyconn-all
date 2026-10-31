import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import { DeliveryDialog } from '../../../../src/pages/deliveries/DeliveryDialog';
import { delivery } from './delivery.fixtures';

describe('DeliveryDialog', () => {
  it('stays closed without a delivery', () => {
    renderWithProviders(<DeliveryDialog delivery={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the endpoint, outcome, error and the payload pretty-printed', async () => {
    renderWithProviders(<DeliveryDialog delivery={delivery()} onClose={vi.fn()} />);
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('invoice.paid')).toBeInTheDocument();
    expect(within(dialog).getByText('CRM bridge')).toBeInTheDocument();
    expect(within(dialog).getByText('FAILED')).toBeInTheDocument();
    expect(within(dialog).getByText('2')).toBeInTheDocument();
    expect(within(dialog).getByText('Bad gateway')).toBeInTheDocument();
    expect(within(dialog).getByText(/2026/)).toBeInTheDocument();
    const payload = within(dialog).getByRole('region', { name: 'Payload' });
    expect(payload.textContent).toBe(
      JSON.stringify({ event: 'invoice.paid', data: { invoiceId: 'inv-1' } }, null, 2),
    );
  });

  it('shows a body that is not JSON exactly as sent, the endpoint id and no error line', async () => {
    renderWithProviders(
      <DeliveryDialog
        delivery={delivery({ webhookName: '', error: '', payload: 'not json {' })}
        onClose={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('hook-1')).toBeInTheDocument();
    expect(within(dialog).queryByText('Error')).toBeNull();
    expect(within(dialog).getByRole('region', { name: 'Payload' }).textContent).toBe('not json {');
  });

  it('closes through its close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<DeliveryDialog delivery={delivery()} onClose={onClose} />);
    await user.click(await screen.findByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
