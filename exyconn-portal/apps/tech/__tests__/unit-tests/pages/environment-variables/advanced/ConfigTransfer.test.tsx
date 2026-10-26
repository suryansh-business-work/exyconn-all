import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportTechConfigsDocument } from '@exyconn/shell/graphql/generated';
import { ConfigTransfer } from '../../../../../src/pages/environment-variables/advanced/ConfigTransfer';
import { GlobalTransferBar } from '../../../../../src/pages/environment-variables/advanced/GlobalTransferBar';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ items: vi.fn(), importConfigs: vi.fn(), query: vi.fn() }));
const download = vi.hoisted(() => vi.fn());

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTechConfigItemsQuery: gql.items,
  useImportTechConfigsMutation: () => [gql.importConfigs],
}));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: gql.query }),
}));
vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  downloadTextFile: download,
}));

const ITEMS = [
  { id: 'c1', kind: 'StripeConfig', label: 'Live' },
  { id: 'c2', kind: 'StripeConfig', label: 'Test' },
];
/** The import result's own Close, not the notification's. */
const closeResult = () =>
  within(screen.getByText(/added, \d+ updated/).closest('[role="alert"]') as HTMLElement).getByRole(
    'button',
    { name: 'Close' },
  );

const jsonFile = (text: string) => new File([text], 'export.json', { type: 'application/json' });

beforeEach(() => {
  vi.clearAllMocks();
  gql.items.mockReturnValue({ data: { techConfigItems: ITEMS } });
  gql.query.mockResolvedValue({ data: { exportTechConfigs: '{"format":"x"}' } });
  gql.importConfigs.mockResolvedValue({
    data: {
      importTechConfigs: { created: 1, updated: 0, skipped: 1, messages: ['Skipped X: why'] },
    },
  });
});

describe('ConfigTransfer', () => {
  it('exports the section, never from the cache, and warns that the file holds secrets', async () => {
    renderWithProviders(<ConfigTransfer section="stripe" />);
    await userEvent.click(screen.getByRole('button', { name: 'Export section' }));

    await waitFor(() => expect(download).toHaveBeenCalled());
    expect(gql.query).toHaveBeenCalledWith({
      query: ExportTechConfigsDocument,
      variables: { section: 'stripe', ids: null },
      fetchPolicy: 'no-cache',
    });
    const [name, type, text] = download.mock.calls[0];
    expect(name).toMatch(/^environment-variables-stripe-\d{4}-\d{2}-\d{2}\.json$/);
    expect([type, text]).toEqual(['application/json', '{"format":"x"}']);
    expect(await screen.findByText(/holds every secret in full/)).toBeInTheDocument();
  });

  it('exports one config on its own', async () => {
    renderWithProviders(<ConfigTransfer section="stripe" />);
    await userEvent.click(screen.getByRole('button', { name: 'Export Test' }));

    await waitFor(() =>
      expect(gql.query).toHaveBeenCalledWith(
        expect.objectContaining({ variables: { section: 'stripe', ids: ['c2'] } }),
      ),
    );
    expect(download.mock.calls[0][0]).toMatch(/^environment-variables-stripe-c2-/);
  });

  it('imports a file into the section and says what was added and skipped', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConfigTransfer section="stripe" />);

    await user.upload(
      screen.getByLabelText('Choose an Environment Variables JSON file'),
      jsonFile('{"a":1}'),
    );

    await waitFor(() =>
      expect(gql.importConfigs).toHaveBeenCalledWith({
        variables: { section: 'stripe', json: '{"a":1}' },
      }),
    );
    expect(await screen.findByText(/1 added, 0 updated, 1 skipped/)).toBeInTheDocument();
    expect(screen.getByText('Skipped X: why')).toBeInTheDocument();
    await user.click(closeResult());
    expect(screen.queryByText('Skipped X: why')).toBeNull();
  });

  it('says why an export or import failed', async () => {
    gql.query.mockRejectedValueOnce(new Error('Locked'));
    gql.importConfigs.mockRejectedValueOnce(new Error('Not an export'));
    const user = userEvent.setup();
    renderWithProviders(<ConfigTransfer section="stripe" />);

    await user.click(screen.getByRole('button', { name: 'Export section' }));
    expect(await screen.findByText('Locked')).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText('Choose an Environment Variables JSON file'),
      jsonFile('x'),
    );
    expect(await screen.findByText('Not an export')).toBeInTheDocument();
    expect(download).not.toHaveBeenCalled();
  });

  it('waits for the section’s configs before offering anything', () => {
    gql.items.mockReturnValue({ data: undefined });
    renderWithProviders(<ConfigTransfer section="stripe" />);
    expect(screen.queryByRole('button', { name: 'Export section' })).toBeNull();
  });
});

describe('GlobalTransferBar', () => {
  it('exports and imports every section at once', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GlobalTransferBar />);

    await user.click(screen.getByRole('button', { name: 'Export everything' }));
    await waitFor(() => expect(download.mock.calls[0][0]).toMatch(/^environment-variables-all-/));
    await user.upload(
      screen.getByLabelText('Choose an Environment Variables JSON file'),
      jsonFile('{}'),
    );
    await waitFor(() =>
      expect(gql.importConfigs).toHaveBeenCalledWith({ variables: { section: null, json: '{}' } }),
    );
    expect(await screen.findByText(/1 added/)).toBeInTheDocument();
    await user.click(closeResult());
  });

  it('ignores a file picker closed without a file', async () => {
    renderWithProviders(<GlobalTransferBar />);
    const input = screen.getByLabelText('Choose an Environment Variables JSON file');
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(gql.importConfigs).not.toHaveBeenCalled();
  });
});
