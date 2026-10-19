import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CompanyDetailPage } from '../../../../../src/pages/companies/detail';
import { renderWithProviders } from '../../../test-utils';
import { companyRow } from '../../../fixtures';
import { UrlProbe } from '../../../form-stub';

const gql = vi.hoisted(() => ({ company: vi.fn(), gmail: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetCompanyQuery: (options: unknown) => gql.company(options),
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

vi.mock('../../../../../src/pages/companies/forms/company', async () => ({
  CompanyForm: (await import('../../../form-stub')).FormStub,
}));

vi.mock('../../../../../src/pages/companies/detail/CompanyPeople', () => ({
  CompanyPeople: ({ companyId }: Readonly<{ companyId: string }>) => <p>People at {companyId}</p>,
}));

vi.mock('../../../../../src/pages/companies/detail/google-business/GoogleBusinessTab', () => ({
  GoogleBusinessTab: ({ companyId }: Readonly<{ companyId: string }>) => (
    <p>Google profile of {companyId}</p>
  ),
}));

function renderPage(tab = 'overview') {
  return renderWithProviders(
    <>
      <CompanyDetailPage />
      <UrlProbe />
    </>,
    { route: `/companies/company-1/${tab}`, path: '/companies/:id/*' },
  );
}

const tabNames = () => screen.getAllByRole('tab').map((tab) => tab.textContent);

describe('CompanyDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.company.mockReturnValue({ data: { getCompany: companyRow() }, refetch: gql.refetch });
    gql.gmail.mockReturnValue({ data: { crmGmailReady: false } });
  });

  it('reads the company named in the URL, fresh from the network', () => {
    renderPage();

    expect(gql.company).toHaveBeenCalledWith({
      variables: { id: 'company-1' },
      fetchPolicy: 'cache-and-network',
    });
  });

  it('shows the page skeleton while the company loads, titled generically', async () => {
    gql.company.mockReturnValue({ data: undefined, refetch: gql.refetch });
    renderPage();

    expect(screen.getByText('Loading the company')).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe('Company'));
  });

  it('says why the company could not load and retries on request', async () => {
    gql.company.mockReturnValue({ error: new Error('Company not found'), refetch: gql.refetch });
    renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('Company not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails instead of dropping it', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.company.mockReturnValue({ error: new Error('boom'), refetch: gql.refetch });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: reloading the company failed', failure),
    );
  });

  it('keeps showing a loaded company when a later reload fails', () => {
    gql.company.mockReturnValue({
      data: { getCompany: companyRow() },
      error: new Error('offline'),
      refetch: gql.refetch,
    });
    renderPage();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
  });

  it('titles the tab with the company and offers only the tabs it has data for', async () => {
    renderPage();

    await waitFor(() => expect(document.title).toBe('Acme'));
    expect(tabNames()).toEqual(['Overview', 'Activity', 'People']);
    expect(screen.getByText('AI summary of Acme')).toBeInTheDocument();
    expect(screen.getByText('Actions for COMPANY company-1 Acme')).toBeInTheDocument();
  });

  it('adds Google Business for a Places company and Emails once Gmail is connected', async () => {
    gql.company.mockReturnValue({
      data: { getCompany: companyRow({ placeId: 'place-7', email: 'hello@acme.io' }) },
      refetch: gql.refetch,
    });
    gql.gmail.mockReturnValue({ data: { crmGmailReady: true } });
    renderPage('emails');

    expect(tabNames()).toEqual(['Overview', 'Activity', 'People', 'Google Business', 'Emails']);
    expect(screen.getByText('Email threads of company-1 to [hello@acme.io]')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Google Business' }));
    expect(screen.getByText('Google profile of company-1')).toBeInTheDocument();
    expect(screen.getByLabelText('current url')).toHaveTextContent(
      '/companies/company-1/google-business',
    );
  });

  it('starts an email with no recipient when the company has no address', () => {
    gql.gmail.mockReturnValue({ data: { crmGmailReady: true } });
    renderPage('emails');

    expect(screen.getByText('Email threads of company-1 to []')).toBeInTheDocument();
  });

  it('shows the full timeline and the people on their own tabs', async () => {
    renderPage('activity');

    expect(screen.getByText('Timeline of COMPANY company-1, last 200')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'People' }));
    expect(screen.getByText('People at company-1')).toBeInTheDocument();
  });

  it('reloads the company after an edit from the profile is saved', async () => {
    renderPage();
    const profile = screen.getByRole('complementary');

    await userEvent.click(within(profile).getByRole('button', { name: 'Edit company' }));
    expect(screen.getByText(/"name":"Acme"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });
});
