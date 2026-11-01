import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VendorAccessDialog } from '../../../../../src/pages/suppliers/vendor-access/VendorAccessDialog';
import { renderWithProviders } from '../../../test-utils';
import { vendorContactRow } from '../../../vendor-fixtures';

const gql = vi.hoisted(() => ({
  contacts: vi.fn(),
  refetch: vi.fn(),
  setActive: vi.fn(),
  remove: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useVendorContactsQuery: (options: unknown) => gql.contacts(options),
  useSetVendorContactActiveMutation: () => [gql.setActive],
  useDeleteVendorContactMutation: () => [gql.remove],
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));

vi.mock('../../../../../src/pages/suppliers/vendor-access/forms/vendor-contact', () => ({
  VendorContactForm: ({
    supplierId,
    onAdded,
  }: Readonly<{ supplierId: string; onAdded: () => void }>) => (
    <button type="button" onClick={onAdded}>
      {`Add contact to ${supplierId}`}
    </button>
  ),
}));

const SUPPLIER = { id: 'supplier-1', name: 'Acme Supplies' };
const active = vendorContactRow({ id: 'vc-1', name: 'Sam Lee', email: 'sam@acme.test' });
const switchedOff = vendorContactRow({
  id: 'vc-2',
  name: 'Kim Roe',
  email: 'kim@acme.test',
  active: false,
  lastSignInAt: '2026-10-15T10:00:00.000Z',
});

function renderDialog(supplier: typeof SUPPLIER | null = SUPPLIER) {
  const onClose = vi.fn();
  renderWithProviders(<VendorAccessDialog supplier={supplier} onClose={onClose} />);
  return { onClose };
}

const rowOf = (name: string) => screen.getByRole('row', { name: new RegExp(name) });

describe('VendorAccessDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.confirm.mockResolvedValue(true);
    gql.setActive.mockResolvedValue({ data: {} });
    gql.remove.mockResolvedValue({ data: { deleteVendorContact: true } });
    gql.contacts.mockReturnValue({
      data: { vendorContacts: [active, switchedOff] },
      loading: false,
      refetch: gql.refetch,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays closed and asks for nothing without a supplier', () => {
    renderDialog(null);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(gql.contacts).not.toHaveBeenCalled();
  });

  it("lists the supplier's people with their access and last sign-in", () => {
    renderDialog();

    expect(
      screen.getByRole('heading', { name: 'Vendor portal access — Acme Supplies' }),
    ).toBeVisible();
    expect(gql.contacts).toHaveBeenCalledWith({ variables: { supplierId: 'supplier-1' } });
    expect(within(rowOf('Sam Lee')).getByText('Never')).toBeVisible();
    expect(within(rowOf('Kim Roe')).queryByText('Never')).not.toBeInTheDocument();
    expect(
      within(rowOf('Sam Lee')).getByRole('button', { name: 'Email sam@acme.test' }),
    ).toBeVisible();
  });

  it('says nobody has access yet while the list is empty', () => {
    gql.contacts.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    renderDialog();

    expect(screen.getByText('Nobody at this supplier has access yet.')).toBeVisible();
  });

  it('switches an active contact off, and offers only the matching toggle per row', async () => {
    renderDialog();
    const samRow = within(rowOf('Sam Lee'));
    expect(samRow.queryByRole('button', { name: 'switch vendor portal access on' })).toBeNull();

    await userEvent.click(samRow.getByRole('button', { name: 'switch vendor portal access off' }));

    await waitFor(() =>
      expect(gql.setActive).toHaveBeenCalledWith({ variables: { id: 'vc-1', active: false } }),
    );
    expect(await screen.findByText('Access switched off')).toBeVisible();
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('switches a contact back on', async () => {
    renderDialog();
    const kimRow = within(rowOf('Kim Roe'));
    expect(kimRow.queryByRole('button', { name: 'switch vendor portal access off' })).toBeNull();

    await userEvent.click(kimRow.getByRole('button', { name: 'switch vendor portal access on' }));

    await waitFor(() =>
      expect(gql.setActive).toHaveBeenCalledWith({ variables: { id: 'vc-2', active: true } }),
    );
    expect(await screen.findByText('Access restored')).toBeVisible();
  });

  it('reports a change the server refused and does not reload', async () => {
    gql.setActive.mockRejectedValueOnce(new Error('Vendor contact not found'));
    renderDialog();

    await userEvent.click(
      within(rowOf('Sam Lee')).getByRole('button', { name: 'switch vendor portal access off' }),
    );

    expect(await screen.findByText('Vendor contact not found')).toBeVisible();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('uses a plain message when the failure is not an Error', async () => {
    gql.setActive.mockRejectedValueOnce('offline');
    renderDialog();

    await userEvent.click(
      within(rowOf('Sam Lee')).getByRole('button', { name: 'switch vendor portal access off' }),
    );

    expect(await screen.findByText('Something went wrong')).toBeVisible();
  });

  it('removes access after a destructive confirm', async () => {
    renderDialog();

    await userEvent.click(within(rowOf('Kim Roe')).getByRole('button', { name: 'delete' }));

    expect(gql.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Remove access',
        messageValues: { email: 'kim@acme.test' },
        destructive: true,
      }),
    );
    await waitFor(() => expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'vc-2' } }));
    expect(await screen.findByText('Access removed')).toBeVisible();
  });

  it('keeps access when the removal is not confirmed', async () => {
    gql.confirm.mockResolvedValueOnce(false);
    renderDialog();

    await userEvent.click(within(rowOf('Kim Roe')).getByRole('button', { name: 'delete' }));

    await waitFor(() => expect(gql.confirm).toHaveBeenCalled());
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('logs a confirm dialog that failed', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    gql.confirm.mockRejectedValueOnce(new Error('dialog gone'));
    renderDialog();

    await userEvent.click(within(rowOf('Kim Roe')).getByRole('button', { name: 'delete' }));

    await waitFor(() => expect(log).toHaveBeenCalledWith(expect.any(Error)));
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('reloads the list once a contact is added for this supplier', async () => {
    renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Add contact to supplier-1' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('closes from its close button', async () => {
    const { onClose } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
