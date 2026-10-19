import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PhoneCallForm, phoneCallSchema } from '../../../src/forms/phone-call';
import { renderWithProviders } from '../test-utils';

describe('the phone call form', () => {
  it('asks for a number before ringing', async () => {
    const onCall = vi.fn();
    renderWithProviders(<PhoneCallForm defaultPhone="" busy={false} onCall={onCall} />);
    await userEvent.click(screen.getByRole('button', { name: 'Call me' }));
    expect(await screen.findByText('Enter the number to call')).toBeInTheDocument();
    expect(onCall).not.toHaveBeenCalled();
  });

  it('wants the country code and digits only', async () => {
    const onCall = vi.fn();
    renderWithProviders(<PhoneCallForm defaultPhone="" busy={false} onCall={onCall} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Your phone number' }), '98765 43210');
    await userEvent.click(screen.getByRole('button', { name: 'Call me' }));
    expect(
      await screen.findByText('Use the country code and digits only, e.g. +919876543210'),
    ).toBeInTheDocument();
    expect(onCall).not.toHaveBeenCalled();
  });

  it('rings a valid number, trimmed', async () => {
    const onCall = vi.fn();
    renderWithProviders(<PhoneCallForm defaultPhone="" busy={false} onCall={onCall} />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Your phone number' }), ' +14155550100 ');
    await userEvent.click(screen.getByRole('button', { name: 'Call me' }));
    await vi.waitFor(() => {
      expect(onCall).toHaveBeenCalledWith('+14155550100');
    });
  });

  it('cannot ring while busy', () => {
    renderWithProviders(<PhoneCallForm defaultPhone="+14155550100" busy onCall={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Call me' })).toBeDisabled();
  });

  it('validates numbers by length as well as shape', () => {
    expect(phoneCallSchema.safeParse({ phone: '+1234567' }).success).toBe(false);
    expect(phoneCallSchema.safeParse({ phone: '+12345678' }).success).toBe(true);
    expect(phoneCallSchema.safeParse({ phone: `+1${'2'.repeat(15)}` }).success).toBe(false);
  });
});
