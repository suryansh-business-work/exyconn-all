import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { ContactDetailPage } from '../../../../../src/pages/contacts/detail';
import { renderWithProviders } from '../../../test-utils';
import { contactRow } from '../../../fixtures';
import { UrlProbe } from '../../../form-stub';

const gql = vi.hoisted(() => ({ contact: vi.fn(), gmail: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetContactQuery: (options: unknown) => gql.contact(options),
  useCrmGmailReadyQuery: () => gql.gmail(),
}));

vi.mock('../../../../../src/records/detail', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/detail')>()),
  ...(await import('../../record-detail-stubs')).detailStubs,
}));

vi.mock('../../../../../src/records/comms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/comms')>()),
  ReachOutActions: (await import('../../record-detail-stubs')).ReachOutStub,
}));

vi.mock('../../../../../src/maps/GoogleMapCard', async () => ({
  GoogleMapCard: (await import('../../record-detail-stubs')).MapCardStub,
}));

vi.mock('../../../../../src/email-verification/EmailVerifyButton', async () => ({
  EmailVerifyButton: (await import('../../record-detail-stubs')).VerifyButtonStub,
}));

vi.mock('../../../../../src/pages/contacts/forms/contact', async () => ({
  ContactForm: (await import('../../../form-stub')).FormStub,
}));

// The tab's own tests cover it; here it only shows whose cold emails it was given.
vi.mock('../../../../../src/records/cold-email', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../../src/records/cold-email')>()),
  RecordColdEmails: ({
    target,
  }: Readonly<{ target: { object: string; id: string; emails: string[]; website: string } }>) => (
    <p>
      Cold emails of {target.object} {target.id} to [{target.emails.join(', ')}] at {target.website}
    </p>
  ),
}));

function renderPage(tab = 'overview') {
  return renderWithProviders(
    <>
      <ContactDetailPage />
      <UrlProbe />
    </>,
    { route: `/contacts/contact-1/${tab}`, path: '/contacts/:id/*' },
  );
}

const tabNames = () => screen.getAllByRole('tab').map((tab) => tab.textContent);

describe('ContactDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.contact.mockReturnValue({ data: { getContact: contactRow() }, refetch: gql.refetch });
    gql.gmail.mockReturnValue({ data: { crmGmailReady: false } });
  });

  it('reads the contact named in the URL, fresh from the network', () => {
    renderPage();

    expect(gql.contact).toHaveBeenCalledWith({
      variables: { id: 'contact-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows the page skeleton while the contact loads, titled generically', async () => {
    gql.contact.mockReturnValue({ data: undefined, refetch: gql.refetch });
    renderPage();

    expect(screen.getByText('Loading the contact')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Contact'));
  });

  it('says why the contact could not load and logs a retry that fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.contact.mockReturnValue({ error: new Error('Contact not found'), refetch: gql.refetch });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Contact not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: reloading the contact failed', failure),
    );
  });

  it('keeps showing a loaded contact when a later reload fails', () => {
    gql.contact.mockReturnValue({
      data: { getContact: contactRow() },
      error: new Error('offline'),
      refetch: gql.refetch,
    });
    renderPage();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Asha Rao' })).toBeInTheDocument();
  });

  it('titles the tab with the person and has no Emails tab without Gmail', async () => {
    renderPage();

    await waitFor(() => expect(document.title).toBe('Asha Rao'));
    expect(tabNames()).toEqual(['Overview', 'Activity', 'Cold emails']);
    expect(screen.getByText('AI summary of Asha Rao')).toBeInTheDocument();
  });

  it('adds Emails once Gmail is connected, addressed to the contact', async () => {
    gql.gmail.mockReturnValue({ data: { crmGmailReady: true } });
    renderPage('emails');

    expect(tabNames()).toEqual(['Overview', 'Activity', 'Cold emails', 'Emails']);
    expect(screen.getByText('Email threads of contact-1 to [asha@acme.io]')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByText('Timeline of CONTACT contact-1, last 200')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent('/contacts/contact-1/activity');
  });

  it('starts an email with no recipient when the contact has no address', () => {
    gql.contact.mockReturnValue({
      data: { getContact: contactRow({ email: '' }) },
      refetch: gql.refetch,
    });
    gql.gmail.mockReturnValue({ data: { crmGmailReady: true } });
    renderPage('emails');

    expect(screen.getByText('Email threads of contact-1 to []')).toBeInTheDocument();
  });

  it('reloads the contact after an edit from the profile is saved', async () => {
    renderPage();
    const profile = screen.getByRole('complementary');

    await userEvent.click(within(profile).getByRole('button', { name: 'Edit contact' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('drafts and lists cold emails on their own tab', async () => {
    gql.contact.mockReturnValue({
      data: { getContact: contactRow({ website: 'asha.dev' }) },
      refetch: gql.refetch,
    });
    renderPage();

    await userEvent.click(screen.getByRole('tab', { name: 'Cold emails' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/contacts/contact-1/cold-emails',
    );
    expect(
      screen.getByText('Cold emails of CONTACT contact-1 to [asha@acme.io] at asha.dev'),
    ).toBeInTheDocument();
  });
});
