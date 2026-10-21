import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappChannelDocument, WhatsappChannelSecret } from '@exyconn/shell/graphql/generated';
import { WhatsappNumberForm } from '../../../../../../../src/pages/demos/whatsapp/forms/whatsapp-number';
import { renderWithProviders } from '../../../../../test-utils';
import { channelRow } from '../../whatsapp.fixtures';

const api = vi.hoisted(() => ({
  save: vi.fn(),
  options: null as unknown,
  warn: vi.fn(),
  test: vi.fn(),
  reveal: vi.fn(),
  revealOptions: null as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSaveWhatsappChannelMutation: (options: unknown) => {
    api.options = options;
    return [api.save];
  },
  useTestWhatsappChannelMutation: () => [api.test],
  useRevealWhatsappChannelSecretMutation: (options: unknown) => {
    api.revealOptions = options;
    return [api.reveal];
  },
}));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({
  portalLogger: { warn: api.warn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

const credential = (length: number) => 'k'.repeat(length);
const KEEP = 'Leave blank to keep the current value';
const SAVED = 'Saved. Use the eye to see it, or type a new one to replace it.';

beforeEach(() => {
  api.save.mockReset().mockResolvedValue({});
  api.warn.mockReset();
  api.test.mockReset();
  api.reveal.mockReset();
});

describe('WhatsappNumberForm — first connection', () => {
  it('explains each credential and starts with a fresh verify token, switched on', () => {
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    expect(screen.getByText(/A permanent System User token/)).toBeInTheDocument();
    expect(screen.getByText(/Checks every delivery came from Meta/)).toBeInTheDocument();
    expect(screen.queryByText(KEEP)).not.toBeInTheDocument();
    const verify = screen.getByRole<HTMLInputElement>('textbox', { name: 'Verify token' });
    expect(verify.value).toMatch(/^[\da-f]{32}$/);
    expect(screen.getByRole('switch', { name: 'Answer messages on this number' })).toBeChecked();
    expect(api.options).toEqual({ refetchQueries: [WhatsappChannelDocument] });
  });

  it('says what is missing instead of saving', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    await user.click(screen.getByRole('button', { name: 'Connect number' }));
    expect(await screen.findByText('Phone number ID is required')).toBeInTheDocument();
    expect(screen.getByText('Access token is required')).toBeInTheDocument();
    expect(screen.getByText('App secret is required')).toBeInTheDocument();
    expect(api.save).not.toHaveBeenCalled();
  });

  it('connects the number, then clears the credentials it sent', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    await user.type(screen.getByRole('textbox', { name: /^Phone number ID\s*\*?$/ }), '1234567890');
    await user.type(screen.getByLabelText(/^Access token\s*\*?$/), credential(24));
    await user.type(screen.getByLabelText(/^App secret\s*\*?$/), credential(16));
    const verify = screen.getByRole('textbox', { name: /^Verify token\s*\*?$/ });
    await user.clear(verify);
    await user.type(verify, 'my-verify-token');
    await user.click(screen.getByRole('button', { name: 'Connect number' }));

    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(1));
    expect(api.save).toHaveBeenCalledWith({
      variables: {
        input: {
          phoneNumberId: '1234567890',
          displayPhone: '',
          accessToken: credential(24),
          appSecret: credential(16),
          verifyToken: 'my-verify-token',
          enabled: true,
        },
      },
    });
    expect(await screen.findByText('WhatsApp number connected')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Access token\s*\*?$/)).toHaveValue('');
    expect(screen.getByLabelText(/^App secret\s*\*?$/)).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /^Phone number ID\s*\*?$/ })).toHaveValue(
      '1234567890',
    );
  });
});

describe('WhatsappNumberForm — connected number', () => {
  it('saves changes while keeping the stored credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    expect(screen.getAllByText(SAVED)).toHaveLength(2);
    await user.click(screen.getByRole('switch', { name: 'Answer messages on this number' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(api.save).toHaveBeenCalledTimes(1));
    expect(api.save).toHaveBeenCalledWith({
      variables: {
        input: {
          phoneNumberId: '1234567890',
          displayPhone: '+1 555 010 0000',
          accessToken: '',
          appSecret: '',
          verifyToken: 'verify-token-123',
          enabled: false,
        },
      },
    });
    expect(await screen.findByText('WhatsApp number updated')).toBeInTheDocument();
  });

  it('logs and reports a failed save', async () => {
    const user = userEvent.setup();
    const failure = new Error('Meta rejected the token');
    api.save.mockRejectedValue(failure);
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Meta rejected the token')).toBeInTheDocument();
    expect(api.warn).toHaveBeenCalledWith('tech: saving the WhatsApp number failed', failure);
  });

  it('falls back to a plain reason for a failure without a message', async () => {
    const user = userEvent.setup();
    api.save.mockRejectedValue({ code: 500 });
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Could not save the WhatsApp number')).toBeInTheDocument();
  });

  it('puts the stored values back on Cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    const display = screen.getByRole('textbox', { name: /^Phone number\s*\*?$/ });
    await user.clear(display);
    await user.type(display, '+44 20 7946 0000');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(display).toHaveValue('+1 555 010 0000');
  });
});

describe('WhatsappNumberForm — Test and the eye buttons', () => {
  it('tests the typed number and token with Meta, and says what worked', async () => {
    const user = userEvent.setup();
    api.test.mockResolvedValue({ data: { testWhatsappChannel: 'Meta knows +1 555 010 0000' } });
    renderWithProviders(<WhatsappNumberForm initial={null} />);
    await user.type(screen.getByRole('textbox', { name: /^Phone number ID\s*\*?$/ }), '1234567890');
    await user.type(screen.getByLabelText(/^Access token\s*\*?$/), credential(24));
    await user.click(screen.getByRole('button', { name: 'Test the Access token' }));
    expect(await screen.findByText('Meta knows +1 555 010 0000')).toBeInTheDocument();
    expect(api.test).toHaveBeenCalledWith({
      variables: { input: { phoneNumberId: '1234567890', accessToken: credential(24) } },
    });
  });

  it('tests the saved token when the field is left blank, with an empty answer as success', async () => {
    const user = userEvent.setup();
    api.test.mockResolvedValue({ data: null });
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Test the Access token' }));
    await waitFor(() =>
      expect(api.test).toHaveBeenCalledWith({
        variables: { input: { phoneNumberId: '1234567890', accessToken: '' } },
      }),
    );
  });

  it('fetches a saved secret for its eye button, never from the cache', async () => {
    const user = userEvent.setup();
    api.reveal.mockResolvedValue({ data: { revealWhatsappChannelSecret: 'saved-app-secret' } });
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    expect(api.revealOptions).toEqual({ fetchPolicy: 'no-cache' });
    await user.click(screen.getByRole('button', { name: 'Show App secret' }));
    await waitFor(() =>
      expect(screen.getByLabelText(/^App secret\s*\*?$/)).toHaveValue('saved-app-secret'),
    );
    expect(api.reveal).toHaveBeenCalledWith({
      variables: { secret: WhatsappChannelSecret.AppSecret },
    });
  });

  it('shows an empty field when the server has no saved token to reveal', async () => {
    const user = userEvent.setup();
    api.reveal.mockResolvedValue({ data: null });
    renderWithProviders(<WhatsappNumberForm initial={channelRow()} />);
    await user.click(screen.getByRole('button', { name: 'Show Access token' }));
    expect(await screen.findByRole('button', { name: 'Hide Access token' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Access token\s*\*?$/)).toHaveValue('');
    expect(api.reveal).toHaveBeenCalledWith({
      variables: { secret: WhatsappChannelSecret.AccessToken },
    });
  });
});
