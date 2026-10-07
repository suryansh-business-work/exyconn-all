import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TrackerSettingsPage } from '../../../../src/pages/tracker/TrackerSettingsPage';
import { renderWithProviders } from '../../test-utils';
import { queryResult, settingsRow } from './tracker.fixtures';

const state = vi.hoisted(() => ({ query: vi.fn(), initial: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerSettingsQuery: state.query,
}));
vi.mock('../../../../src/pages/tracker/forms/tracker-settings', () => ({
  TrackerSettingsForm: ({ initial }: Readonly<{ initial: unknown }>) => {
    state.initial = initial;
    return <form aria-label="Capture settings form" />;
  },
}));

describe('TrackerSettingsPage', () => {
  beforeEach(() => {
    state.query.mockReset();
    state.initial = null;
  });

  it('says it is loading the settings until they arrive, always fresh', () => {
    state.query.mockReturnValue(queryResult(undefined, true));
    renderWithProviders(<TrackerSettingsPage />);
    expect(state.query).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(screen.getByRole('heading', { name: 'Tracker Settings' })).toBeInTheDocument();
    expect(screen.getByText('Capture settings')).toBeInTheDocument();
    expect(screen.getByText('Applies to every enrolled desktop agent.')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Loading settings' })).toBeInTheDocument();
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('says there are no settings when the query answered with none', () => {
    state.query.mockReturnValue(queryResult(undefined, false));
    renderWithProviders(<TrackerSettingsPage />);
    expect(screen.getByRole('progressbar', { name: 'No settings' })).toBeInTheDocument();
  });

  it('prefills the form from the saved settings', () => {
    const saved = settingsRow({ intervalMinutes: 20 });
    state.query.mockReturnValue(queryResult({ trackerSettings: saved }, true));
    renderWithProviders(<TrackerSettingsPage />);
    expect(screen.getByRole('form', { name: 'Capture settings form' })).toBeInTheDocument();
    expect(state.initial).toBe(saved);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
