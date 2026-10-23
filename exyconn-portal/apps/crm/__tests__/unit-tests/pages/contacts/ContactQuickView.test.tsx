import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ContactQuickView } from '../../../../src/pages/contacts/ContactQuickView';
import { renderWithProviders } from '../../test-utils';
import { contactRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ contact: vi.fn(), refetch: vi.fn() }));

const comms = vi.hoisted(() => ({ compose: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetContactQuery: (options: unknown) => gql.contact(options),
}));

vi.mock('../../../../src/records/comms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/comms')>()),
  composeEmailTo: comms.compose,
  ReachOutActions: (await import('../record-detail-stubs')).ReachOutStub,
}));

vi.mock('../../../../src/maps/GoogleMapCard', async () => ({
  GoogleMapCard: (await import('../record-detail-stubs')).MapCardStub,
}));

vi.mock('../../../../src/email-verification/EmailVerifyButton', async () => ({
  EmailVerifyButton: (await import('../record-detail-stubs')).VerifyButtonStub,
}));

vi.mock('../../../../src/pages/contacts/forms/contact', async () => ({
  ContactForm: (await import('../../form-stub')).FormStub,
}));

function renderView(id = 'contact-1') {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  renderWithProviders(<ContactQuickView id={id} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
}

describe('ContactQuickView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.contact.mockReturnValue({ data: { getContact: contactRow() }, refetch: gql.refetch });
  });

  it('stays closed and reads nothing without a contact', () => {
    renderView('');

    expect(screen.queryByRole('dialog', { name: 'Contact preview' })).not.toBeInTheDocument();
    expect(gql.contact).not.toHaveBeenCalled();
  });

  it('opens on the contact, linking to its full page', () => {
    renderView();

    expect(screen.getByRole('dialog', { name: 'Contact preview' })).toBeInTheDocument();
    expect(gql.contact).toHaveBeenCalledWith({
      variables: { id: 'contact-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full view' })).toHaveAttribute(
      'href',
      '/contacts/contact-1',
    );
    expect(screen.getByText('Map of Asha Rao')).toBeInTheDocument();
  });

  it('shows the loading state without an Edit button until the contact arrives', () => {
    gql.contact.mockReturnValue({ data: undefined, refetch: gql.refetch });
    renderView();

    expect(screen.getByText('Loading the contact')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit contact' })).not.toBeInTheDocument();
  });

  it('says why the contact could not load and retries, logging a failed retry', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.contact.mockReturnValue({ error: new Error('Contact not found'), refetch: gql.refetch });
    renderView();

    expect(screen.getByRole('alert')).toHaveTextContent('Contact not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: reloading the contact preview failed', failure),
    );
  });

  it('reloads the preview and the list after an edit is saved', async () => {
    const { onSaved } = renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('closes when reaching out opens the comms dock, or on Close', async () => {
    const { onClose } = renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Reach out' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes the preview and opens the CRM email window to the address clicked', async () => {
    const { onClose } = renderView();

    await userEvent.click(screen.getByRole('button', { name: 'asha@acme.io' }));

    expect(onClose).toHaveBeenCalled();
    expect(comms.compose).toHaveBeenCalledWith(
      expect.objectContaining({ object: 'CONTACT' }),
      'asha@acme.io',
    );
  });
});
