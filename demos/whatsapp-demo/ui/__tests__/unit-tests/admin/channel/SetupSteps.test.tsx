import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { SetupSteps } from '../../../../src/admin/channel/SetupSteps';
import { renderWithProviders } from '../../test-utils';

const WEBHOOK = 'https://api.example.com/whatsapp/webhook';

describe('SetupSteps', () => {
  it('walks through the five steps in Meta, in order', () => {
    renderWithProviders(<SetupSteps webhookUrl={WEBHOOK} verifyToken="token-123456" />);
    expect(
      screen.getByRole('heading', { name: 'Connect a real WhatsApp number' }),
    ).toBeInTheDocument();
    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(steps[0]).toHaveTextContent(/^In Meta for Developers, create a Business app/);
    expect(steps[4]).toHaveTextContent(/^Send "hi" to the number from WhatsApp/);
  });

  it('gives the callback URL and verify token read-only, selected on focus', () => {
    renderWithProviders(<SetupSteps webhookUrl={WEBHOOK} verifyToken="token-123456" />);
    const callback = screen.getByRole<HTMLInputElement>('textbox', { name: 'Callback URL' });
    expect(callback).toHaveValue(WEBHOOK);
    expect(callback).toHaveAttribute('readonly');
    fireEvent.focus(callback);
    expect(callback.selectionStart).toBe(0);
    expect(callback.selectionEnd).toBe(WEBHOOK.length);
    expect(screen.getByRole('textbox', { name: 'Verify token' })).toHaveValue('token-123456');
  });

  it('leaves out the verify token until the number has one', () => {
    renderWithProviders(<SetupSteps webhookUrl={WEBHOOK} verifyToken={null} />);
    expect(screen.queryByRole('textbox', { name: 'Verify token' })).not.toBeInTheDocument();
  });

  it('translates the steps', () => {
    renderWithProviders(<SetupSteps webhookUrl={WEBHOOK} verifyToken={null} />, {
      messages: {
        'In Meta for Developers, create a Business app and add the WhatsApp product.':
          'Crea una app en Meta.',
      },
    });
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Crea una app en Meta.');
  });
});
