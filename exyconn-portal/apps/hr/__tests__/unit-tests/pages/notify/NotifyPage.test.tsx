import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotifyPage } from '../../../../src/pages/notify';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/notify/forms/send-notification', async () => ({
  SendNotificationForm: (await import('./send-form-stub')).SendNotificationFormStub,
}));

describe('NotifyPage', () => {
  it('explains how a notification lands, before anything is sent', () => {
    renderWithProviders(<NotifyPage />);
    expect(screen.getByRole('heading', { name: 'Send Notification' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How it lands' })).toBeInTheDocument();
    expect(screen.queryByText(/^Last send reached/)).not.toBeInTheDocument();
  });

  it('says how many people the last send reached, in the right sentence', async () => {
    renderWithProviders(<NotifyPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Send to one' }));
    expect(screen.getByText('Last send reached 1 person.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send to five' }));
    expect(screen.getByText('Last send reached 5 people.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send to nobody' }));
    expect(screen.getByText('Last send reached 0 people.')).toBeInTheDocument();
  });
});
