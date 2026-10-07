import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaxRegimePanel } from '../../../../src/pages/tax-slabs/TaxRegimePanel';
import { renderWithProviders } from '../../test-utils';
import { REGIMES } from './tax-slabs.fixtures';

const gql = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteTaxRegimeMutation: () => [gql.remove],
}));

vi.mock('../../../../src/pages/tax-slabs/forms/tax-regime', async () => ({
  TaxRegimeForm: (await import('../../harness/form-stub')).FormStub,
}));

const refetch = vi.fn();

const renderPanel = (regimes = REGIMES, loading = false) =>
  renderWithProviders(<TaxRegimePanel regimes={regimes} loading={loading} refetch={refetch} />);

/** The table row that shows the regime named `name`. */
const rowOf = (name: string) => {
  const row = screen.getByRole('cell', { name }).closest('tr');
  if (!row) {
    throw new Error(`No row for ${name}`);
  }
  return within(row);
};

describe('TaxRegimePanel', () => {
  beforeEach(() => {
    refetch.mockReset().mockResolvedValue({});
    gql.remove.mockReset().mockResolvedValue({ data: {} });
  });

  it('lists each regime with its figures and whether it is applied', () => {
    renderPanel();

    const applied = rowOf('New regime');
    expect(applied.getByText('NEW')).toBeInTheDocument();
    expect(applied.getByText('2026-27')).toBeInTheDocument();
    expect(applied.getByText((75000).toLocaleString())).toBeInTheDocument();
    expect(applied.getByText((1200000).toLocaleString())).toBeInTheDocument();
    expect(applied.getByText((60000).toLocaleString())).toBeInTheDocument();
    expect(applied.getByText('4%')).toBeInTheDocument();
    expect(applied.getByText('Yes')).toBeInTheDocument();
    expect(rowOf('Old regime').getByText('No')).toBeInTheDocument();
  });

  it('asks for a regime before any band when there are none', () => {
    renderPanel([]);

    expect(screen.getByText('No regimes yet — add one before entering bands.')).toBeInTheDocument();
  });

  it('holds the refresh back while the regimes load, and re-reads them on request', async () => {
    const { unmount } = renderPanel(REGIMES, true);
    expect(screen.getByRole('button', { name: 'Refresh table' })).toBeDisabled();
    unmount();

    renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('opens a blank regime form and closes it without reloading on cancel', async () => {
    renderPanel();

    await userEvent.click(screen.getByRole('button', { name: 'New regime' }));
    expect(screen.getByRole('heading', { name: 'New tax regime' })).toBeInTheDocument();
    expect(screen.getByText('Blank form')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await waitFor(() => expect(screen.queryByText('Blank form')).not.toBeInTheDocument());
    expect(refetch).not.toHaveBeenCalled();
  });

  it('edits a regime in the drawer and re-reads the list once it is saved', async () => {
    renderPanel();

    await userEvent.click(rowOf('Old regime').getByRole('button', { name: 'edit' }));
    expect(screen.getByRole('heading', { name: 'Edit tax regime' })).toBeInTheDocument();
    expect(screen.getByText(`Form for ${JSON.stringify(REGIMES[0])}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    await waitFor(() => expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument());
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('names the regime and its year before deleting it, then reloads', async () => {
    renderPanel();

    await userEvent.click(rowOf('New regime').getByRole('button', { name: 'delete' }));
    expect(
      await screen.findByText(
        'Delete "New regime" for 2026-27? Its bands stay on file and stop being applied.',
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'regime-new' } }),
    );
    expect(await screen.findByText('Tax regime deleted')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the regime and says why when the delete fails', async () => {
    gql.remove.mockRejectedValueOnce(new Error('Bands still point at this regime'));
    renderPanel();

    await userEvent.click(rowOf('Old regime').getByRole('button', { name: 'delete' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Bands still point at this regime')).toBeInTheDocument();
    expect(refetch).not.toHaveBeenCalled();
  });
});
