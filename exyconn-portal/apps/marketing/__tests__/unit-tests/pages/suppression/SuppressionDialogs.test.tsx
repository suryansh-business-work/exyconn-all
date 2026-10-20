import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import {
  SuppressionDialogs,
  type SuppressionDialog,
} from '../../../../src/pages/suppression/SuppressionDialogs';
import { renderWithProviders } from '../../test-utils';
import { answered } from '../../fixtures';
import { fill, press } from '../../form-helpers';
import { pagedRow } from './suppression.fixtures';
import { typeInto } from './suppression.helpers';

const gql = vi.hoisted(() => ({
  history: vi.fn(),
  updateNote: vi.fn(),
  remove: vi.fn(),
  add: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useMarketingSuppressionHistoryQuery: () => gql.history(),
  useUpdateMarketingSuppressionNoteMutation: () => [gql.updateNote],
  useRemoveMarketingSuppressionMutation: () => [gql.remove],
  useAddMarketingSuppressionsMutation: () => [gql.add],
}));

const ROW = pagedRow({ id: 'suppression-7', note: 'Old note', reason: SuppressionReason.Manual });

function renderDialogs(dialog: SuppressionDialog) {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  renderWithProviders(
    <SuppressionDialogs dialog={dialog} onClose={onClose} onChanged={onChanged} />,
  );
  return { onClose, onChanged };
}

const heading = () => screen.getByRole('heading', { level: 2 });

describe('SuppressionDialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.history.mockReturnValue(answered({ marketingSuppressionHistory: [] }));
    gql.updateNote.mockResolvedValue({ data: {} });
    gql.remove.mockResolvedValue({ data: { removeMarketingSuppression: true } });
    gql.add.mockResolvedValue({ data: null });
  });

  it('shows nothing while no dialog is open', () => {
    renderDialogs(null);

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
  });

  it('shows the details of the chosen row', () => {
    renderDialogs({ kind: 'details', row: ROW });

    expect(heading()).toHaveTextContent('Suppression details');
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save note' })).not.toBeInTheDocument();
  });

  it('edits the row’s note and reports the change', async () => {
    const { onChanged } = renderDialogs({ kind: 'note', row: ROW });

    expect(heading()).toHaveTextContent('Edit note');
    expect(screen.getByLabelText('Internal note')).toHaveValue('Old note');
    fill('Internal note', 'New note');
    await press('Save note');

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(gql.updateNote).toHaveBeenCalledWith({
      variables: { id: 'suppression-7', note: 'New note' },
    });
  });

  it('removes the row only after the address is typed back', async () => {
    const { onChanged } = renderDialogs({ kind: 'remove', row: ROW });

    expect(heading()).toHaveTextContent('Remove suppression');
    typeInto('Why are you removing it?', 'Re-subscribed on the website');
    typeInto('Type the address to confirm', 'gone@acme.io');
    await press('Remove suppression');

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(gql.remove).toHaveBeenCalledWith({
      variables: { id: 'suppression-7', justification: 'Re-subscribed on the website' },
    });
  });

  it('adds several addresses at once and reports the change', async () => {
    const { onChanged } = renderDialogs({ kind: 'bulk' });

    expect(heading()).toHaveTextContent('Suppress several addresses');
    fill('Addresses', 'a@acme.io');
    await press('Suppress addresses');

    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
  });

  it.each<SuppressionDialog>([
    { kind: 'note', row: ROW },
    { kind: 'remove', row: ROW },
    { kind: 'bulk' },
  ])('closes the $kind form on cancel without changing anything', async (dialog) => {
    const { onClose, onChanged } = renderDialogs(dialog);

    await press('Cancel');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('closes from the panel’s close button', async () => {
    const { onClose } = renderDialogs({ kind: 'details', row: ROW });

    await press('Close');

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
