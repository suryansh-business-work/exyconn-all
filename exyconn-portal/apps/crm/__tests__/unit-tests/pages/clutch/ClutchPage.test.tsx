import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ClutchEngine } from '@exyconn/shell/graphql/generated';
import { ClutchPage } from '../../../../src/pages/clutch';
import {
  CLUTCH_RUN_COLUMNS,
  type ClutchRunsContext,
} from '../../../../src/pages/clutch/clutch-runs-grid';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { run } from './clutchFixtures';

const gql = vi.hoisted(() => ({
  config: vi.fn(),
  start: vi.fn(),
  save: vi.fn(),
  clear: vi.fn(),
  remove: vi.fn(),
  grid: vi.fn(),
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLeadSourceConfigQuery: gql.config,
  useStartClutchSearchMutation: () => [gql.start],
  useSaveLeadSourceConfigMutation: () => [gql.save],
  useClearApifyTokenMutation: () => [gql.clear],
  useDeleteClutchRunMutation: () => [gql.remove],
}));
vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: Record<string, unknown>) => {
    gql.grid(props);
    return <p>Past searches</p>;
  },
}));
vi.mock('../../../../src/pages/clutch/ClutchRunView', () => ({
  ClutchRunView: ({ runId }: Readonly<{ runId: string }>) => <p>{`Results of ${runId}`}</p>,
}));

const SETTINGS = {
  hasApifyToken: false,
  apifyTokenHint: '',
  clutchActorId: 'scrapeai/clutch-co-scraper',
  updatedByName: '',
};
const label = (text: string) => new RegExp(`^${text}\\s*\\*?$`);

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

function renderPage(route = '/tools/lead-generators/clutch', settings: unknown = SETTINGS) {
  gql.config.mockReturnValue({
    data: settings ? { leadSourceConfig: settings } : undefined,
    error: undefined,
  });
  renderWithProviders(
    <>
      <Routes>
        <Route path="/tools/lead-generators/clutch/:runId?" element={<ClutchPage />} />
      </Routes>
      <Url />
    </>,
    { route },
  );
  return userEvent.setup();
}

beforeEach(() => {
  vi.clearAllMocks();
  gql.start.mockResolvedValue({ data: { startClutchSearch: { id: 'r9' } } });
  for (const fn of [gql.save, gql.clear, gql.remove]) fn.mockResolvedValue({});
});

describe('ClutchPage', () => {
  it('starts a free Clutch search and opens its results', async () => {
    const user = renderPage();
    expect(screen.getByText(/Apify is not set up/)).toBeInTheDocument();
    expect(screen.getByText('Past searches')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'New search' }));
    await user.type(await screen.findByLabelText(label('Service or keyword')), 'Web Development');
    await user.type(screen.getByLabelText(label('Location')), 'Pune');
    await user.click(screen.getByRole('button', { name: 'Search Clutch' }));

    await waitFor(() =>
      expect(gql.start).toHaveBeenCalledWith({
        variables: {
          input: expect.objectContaining({
            engine: ClutchEngine.Mcp,
            keyword: 'Web Development',
            location: 'Pune',
            maxItems: 20,
            profileUrls: [],
          }),
        },
      }),
    );
    expect(await screen.findByText('Results of r9')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent('/tools/lead-generators/clutch/r9');
  });

  it('asks for a keyword or a profile, says Apify brings portfolios, and reports a failed start', async () => {
    gql.start.mockRejectedValueOnce(new Error('Too many searches'));
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'New search' }));
    await user.click(await screen.findByRole('button', { name: 'Search Clutch' }));
    expect(
      await screen.findByText('Type what to search for, or paste a Clutch profile link'),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText('Portfolio and case studies'));
    expect(
      screen.getByText('Portfolio items come with Apify; Clutch’s own server does not list them.'),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(label('Service or keyword')), 'SEO');
    await user.click(screen.getByRole('button', { name: 'Search Clutch' }));
    expect(await screen.findByText('Too many searches')).toBeInTheDocument();
  });

  it('sets up Apify, then offers it as an engine, and removes the token once confirmed', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('button', { name: 'Set up Apify' }));
    await user.type(await screen.findByLabelText(label('Apify API token')), 'apify_api_x');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(gql.save).toHaveBeenCalledWith({
        variables: {
          input: { apifyToken: 'apify_api_x', clutchActorId: 'scrapeai/clutch-co-scraper' },
        },
      }),
    );
  });

  it('shows a stored token’s tail, removes it once confirmed, and goes back to all searches', async () => {
    const user = renderPage('/tools/lead-generators/clutch/r1', {
      ...SETTINGS,
      hasApifyToken: true,
      apifyTokenHint: '9f2a',
    });
    expect(screen.getByText(/token ending 9f2a/)).toBeInTheDocument();
    expect(screen.getByText('Results of r1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    await user.click(await screen.findByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(gql.clear).toHaveBeenCalled());

    await user.click(await screen.findByRole('button', { name: 'All searches' }));
    expect(screen.getByLabelText('url')).toHaveTextContent(/\/clutch$/);
  });

  it('deletes a past search once confirmed and formats its time', async () => {
    renderPage();
    const props = gql.grid.mock.calls.at(-1)?.[0] as {
      context: ClutchRunsContext;
      onRowClick: (row: unknown) => void;
    };
    act(() => {
      props.context.actions.delete(run());
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'r1' } }));

    const when = CLUTCH_RUN_COLUMNS[0].valueFormatter as (p: unknown) => string;
    expect(when({ data: run(), context: { formatDateTime: (v: string) => `at ${v}` } })).toBe(
      'at 2026-10-26T10:00:00.000Z',
    );
    expect(when({ data: undefined, context: {} })).toBe('');
    act(() => props.onRowClick(run()));
    expect(screen.getByLabelText('url')).toHaveTextContent('/clutch/r1');
  });

  it('says why the settings could not be read', () => {
    gql.config.mockReturnValue({ data: undefined, error: new Error('Forbidden') });
    renderWithProviders(<ClutchPage />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New search' })).toBeDisabled();
  });
});
