import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CallingBotAvailabilityDocument } from '@exyconn/shell/graphql/generated';
import { CallPage } from '../../../src/pages/CallPage';
import { renderWithProviders } from '../test-utils';

const choice = vi.hoisted(() => ({
  value: {
    scenarios: [] as Array<{ id: string; title: string; description: string; languageCode: string }>,
    selected: null as { id: string; title: string; description: string; languageCode: string } | null,
    select: () => undefined,
    failed: false,
  },
}));
vi.mock('../../../src/call/useScenarioChoice', () => ({ useScenarioChoice: () => choice.value }));
vi.mock('../../../src/components/BrowserCallPanel', () => ({
  BrowserCallPanel: ({ scenarioId }: Readonly<{ scenarioId: string | null }>) => (
    <p>{`Browser phone for ${scenarioId ?? 'no example'}`}</p>
  ),
}));
vi.mock('../../../src/components/PhoneCallPanel', () => ({
  PhoneCallPanel: ({ scenarioId }: Readonly<{ scenarioId: string | null }>) => (
    <p>{`Phone card for ${scenarioId ?? 'no example'}`}</p>
  ),
}));

interface Availability {
  available: boolean;
  phoneEnabled: boolean;
  languageCode: string | null;
  maxCallSeconds: number | null;
}

const availability = (value: Availability) => ({
  request: { query: CallingBotAvailabilityDocument },
  result: {
    data: { callingBotAvailability: { __typename: 'CallingBotAvailability', ...value } },
  },
});

const CLINIC = { id: 's1', title: 'Clinic', description: 'Book a visit', languageCode: 'en-IN' };

describe('the calling bot page', () => {
  afterEach(() => {
    choice.value = { scenarios: [], selected: null, select: () => undefined, failed: false };
  });

  it('offers the browser call, the picker and the phone call when all are set up', async () => {
    choice.value = { ...choice.value, scenarios: [CLINIC], selected: CLINIC };
    renderWithProviders(<CallPage />, {
      mocks: [
        availability({
          available: true,
          phoneEnabled: true,
          languageCode: 'hi-IN',
          maxCallSeconds: 300,
        }),
      ],
    });
    expect(await screen.findByText('Browser phone for s1')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Pick a call to try' })).toBeInTheDocument();
    expect(screen.getByText('Phone card for s1')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Talk to our AI calling bot', level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Which languages does it speak?' }));
    expect(screen.getByText(/This demo speaks Hindi \(India\)\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'How long can a call last?' }));
    expect(screen.getByText(/after 5 minutes/)).toBeInTheDocument();
  });

  it('hides the picker and phone call while the bot is not set up, and the settings questions', async () => {
    renderWithProviders(<CallPage />, {
      mocks: [
        availability({ available: false, phoneEnabled: false, languageCode: null, maxCallSeconds: null }),
      ],
    });
    expect(await screen.findByText('The calling bot is not set up yet')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByText(/Phone card/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Which languages does it speak?' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Is the call recorded?' })).toBeInTheDocument();
  });

  it('names a language code it cannot translate by the code itself', async () => {
    renderWithProviders(<CallPage />, {
      mocks: [
        availability({ available: true, phoneEnabled: false, languageCode: 'not a code!', maxCallSeconds: 90 }),
      ],
    });
    await screen.findByText('Browser phone for no example');
    await userEvent.click(screen.getByRole('button', { name: 'Which languages does it speak?' }));
    expect(screen.getByText(/This demo speaks not a code!\./)).toBeInTheDocument();
    expect(screen.getByText(/after 2 minutes/)).toBeInTheDocument();
  });

  it('keeps the code when the browser has no name for it', async () => {
    const of = vi.spyOn(Intl.DisplayNames.prototype, 'of').mockReturnValue(undefined);
    renderWithProviders(<CallPage />, {
      mocks: [
        availability({ available: true, phoneEnabled: false, languageCode: 'xx-YY', maxCallSeconds: 60 }),
      ],
    });
    await screen.findByText('Browser phone for no example');
    await userEvent.click(screen.getByRole('button', { name: 'Which languages does it speak?' }));
    expect(screen.getByText(/This demo speaks xx-YY\./)).toBeInTheDocument();
    of.mockRestore();
  });

  it('shows a loading state before the settings arrive', async () => {
    renderWithProviders(<CallPage />, {
      mocks: [availability({ available: true, phoneEnabled: false, languageCode: null, maxCallSeconds: null })],
    });
    expect(screen.queryByText(/Browser phone/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Browser phone for no example')).toBeInTheDocument();
    });
  });
});
