import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { useVariantActions } from '../../../../src/records/cold-email';
import { renderWithProviders } from '../../test-utils';
import { draft, variant } from './cold-email-fixtures';

const gql = vi.hoisted(() => ({ deleteVariant: vi.fn(), openComms: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteColdEmailVariantMutation: () => [gql.deleteVariant, { loading: false }],
}));
vi.mock('../../../../src/records/comms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/comms')>()),
  openComms: gql.openComms,
}));

const V1 = variant('v1');

/** Two buttons driving the hook, as a version card would. */
function Harness({ object }: Readonly<{ object: CrmTimelineObject }>) {
  const actions = useVariantActions(draft([V1], { object, recordId: 'rec-1' }));
  return (
    <>
      <button
        type="button"
        onClick={() => {
          actions.remove(V1).catch(() => undefined);
        }}
      >
        remove
      </button>
      <button type="button" onClick={() => actions.use(V1)}>
        use
      </button>
    </>
  );
}

const confirmDialog = () => screen.findByRole('dialog');

describe('useVariantActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('deletes nothing when the confirm is cancelled', async () => {
    renderWithProviders(<Harness object={CrmTimelineObject.Company} />);
    await userEvent.click(screen.getByRole('button', { name: 'remove' }));
    const dialog = await confirmDialog();
    expect(dialog).toHaveTextContent('Delete the version "Subject v1"? It cannot be brought back.');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(gql.deleteVariant).not.toHaveBeenCalled();
  });

  it('says, and logs, why a version could not be deleted', async () => {
    gql.deleteVariant.mockRejectedValue(new Error('Already sent'));
    renderWithProviders(<Harness object={CrmTimelineObject.Company} />);
    await userEvent.click(screen.getByRole('button', { name: 'remove' }));
    await userEvent.click(within(await confirmDialog()).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Already sent')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: deleting a cold email version failed',
      expect.any(Error),
    );
  });

  it("opens a contact's version in the email dock against the contact", async () => {
    renderWithProviders(<Harness object={CrmTimelineObject.Contact} />);
    await userEvent.click(screen.getByRole('button', { name: 'use' }));
    expect(gql.openComms).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'EMAIL', object: 'CONTACT', id: 'rec-1' }),
    );
  });
});
