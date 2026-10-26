import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VaultLocationState } from '@exyconn/shell/graphql/generated';
import { UnlockVaultForm } from '../../../../../src/pages/environment-variables/vault/forms/unlock-vault';
import { browserLocation } from '../../../../../src/pages/environment-variables/vault/browserLocation';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ request: vi.fn(), unlock: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRequestTechVaultCodeMutation: () => [gql.request, { loading: false }],
  useUnlockTechVaultMutation: () => [gql.unlock],
}));

type Geo = Pick<Geolocation, 'getCurrentPosition'>;
const withGeolocation = (geolocation: Geo | undefined) =>
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    value: geolocation,
    configurable: true,
  });

const label = (text: string) => new RegExp(`^${text}\\s*\\*?$`);

function renderForm() {
  const onUnlocked = vi.fn();
  renderWithProviders(<UnlockVaultForm email="tech@exyconn.com" onUnlocked={onUnlocked} />);
  return { onUnlocked, user: userEvent.setup() };
}

async function sendAndFill(user: ReturnType<typeof userEvent.setup>, code: string, reason: string) {
  await user.click(screen.getByRole('button', { name: 'Email me a code' }));
  await user.type(await screen.findByLabelText(label('Code from the email')), code);
  await user.type(screen.getByLabelText(label('Why do you need the credentials\\?')), reason);
  await user.click(screen.getByRole('button', { name: 'Unlock' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  gql.request.mockResolvedValue({});
  gql.unlock.mockResolvedValue({});
});
afterEach(() => withGeolocation(undefined));

describe('UnlockVaultForm', () => {
  it('emails a code to the signed-in address, then unlocks with it, the reason and the location', async () => {
    withGeolocation({
      getCurrentPosition: (ok) =>
        ok({ coords: { latitude: 18.52, longitude: 73.85, accuracy: 20 } } as GeolocationPosition),
    });
    const { onUnlocked, user } = renderForm();
    expect(screen.getByText(/tech@exyconn\.com/)).toBeInTheDocument();

    await sendAndFill(user, '123456', 'Rotating the SMTP password');

    await waitFor(() => expect(onUnlocked).toHaveBeenCalled());
    expect(gql.unlock).toHaveBeenCalledWith({
      variables: {
        input: {
          code: '123456',
          reason: 'Rotating the SMTP password',
          location: {
            state: VaultLocationState.Granted,
            latitude: 18.52,
            longitude: 73.85,
            accuracy: 20,
          },
        },
      },
    });
    expect(
      await screen.findByText('Environment Variables unlocked for 30 minutes'),
    ).toBeInTheDocument();
  });

  it('asks for a six-digit code and a reason before trying', async () => {
    const { user } = renderForm();
    await sendAndFill(user, '12', 'ok');

    expect(await screen.findByText('The code is 6 digits')).toBeInTheDocument();
    expect(screen.getByText('Say in a few words why you need the credentials')).toBeInTheDocument();
    expect(gql.unlock).not.toHaveBeenCalled();
  });

  it('says why a code could not be sent or the vault could not open', async () => {
    gql.request.mockRejectedValueOnce(new Error('Too many codes'));
    const { user } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    expect(await screen.findByText('Too many codes')).toBeInTheDocument();
    expect(screen.queryByLabelText(label('Code from the email'))).toBeNull();

    gql.unlock.mockRejectedValueOnce(new Error('That code is not right.'));
    await sendAndFill(user, '654321', 'Checking a key');
    expect(await screen.findByText('That code is not right.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeInTheDocument();
  });

  it('can start over, hiding the code form until a new code is sent', async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText(label('Code from the email'))).toBeNull();
  });
});

describe('browserLocation', () => {
  it('reports a refusal, an unavailable position, and a browser without location', async () => {
    withGeolocation({
      getCurrentPosition: (_ok, fail) =>
        fail?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    });
    expect(await browserLocation()).toEqual({ state: VaultLocationState.Denied });

    withGeolocation({
      getCurrentPosition: (_ok, fail) =>
        fail?.({ code: 3, PERMISSION_DENIED: 1 } as GeolocationPositionError),
    });
    expect(await browserLocation()).toEqual({ state: VaultLocationState.Unavailable });

    withGeolocation(undefined);
    expect(await browserLocation()).toEqual({ state: VaultLocationState.Unavailable });
  });
});
