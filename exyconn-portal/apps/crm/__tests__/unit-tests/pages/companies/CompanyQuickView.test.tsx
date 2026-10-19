import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { CompanyQuickView } from '../../../../src/pages/companies/CompanyQuickView';
import { renderWithProviders } from '../../test-utils';
import { companyRow } from '../../fixtures';

const gql = vi.hoisted(() => ({ company: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetCompanyQuery: (options: unknown) => gql.company(options),
}));

vi.mock('../../../../src/records/comms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../../src/records/comms')>()),
  ReachOutActions: (await import('../record-detail-stubs')).ReachOutStub,
}));

vi.mock('../../../../src/maps/GoogleMapCard', async () => ({
  GoogleMapCard: (await import('../record-detail-stubs')).MapCardStub,
}));

vi.mock('../../../../src/email-verification', async () => ({
  EmailVerifyButton: (await import('../record-detail-stubs')).VerifyButtonStub,
}));

vi.mock('../../../../src/pages/companies/forms/company', async () => ({
  CompanyForm: (await import('../../form-stub')).FormStub,
}));

function renderView(id = 'company-1') {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  renderWithProviders(<CompanyQuickView id={id} onClose={onClose} onSaved={onSaved} />);
  return { onClose, onSaved };
}

describe('CompanyQuickView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.company.mockReturnValue({ data: { getCompany: companyRow() }, refetch: gql.refetch });
  });

  it('stays closed and reads nothing without a company', () => {
    renderView('');

    expect(screen.queryByRole('dialog', { name: 'Company preview' })).not.toBeInTheDocument();
    expect(gql.company).not.toHaveBeenCalled();
  });

  it('opens on the company, linking to its full page', () => {
    renderView();

    expect(screen.getByRole('dialog', { name: 'Company preview' })).toBeInTheDocument();
    expect(gql.company).toHaveBeenCalledWith({
      variables: { id: 'company-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('heading', { level: 2, name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Full view' })).toHaveAttribute(
      'href',
      '/companies/company-1',
    );
    expect(screen.getByText('Map of Acme')).toBeInTheDocument();
  });

  it('shows the loading state without an Edit button until the company arrives', () => {
    gql.company.mockReturnValue({ data: undefined, refetch: gql.refetch });
    renderView();

    expect(screen.getByText('Loading the company')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit company' })).not.toBeInTheDocument();
  });

  it('says why the company could not load and retries, logging a failed retry', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.company.mockReturnValue({ error: new Error('Company not found'), refetch: gql.refetch });
    renderView();

    expect(screen.getByRole('alert')).toHaveTextContent('Company not found');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(gql.refetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('crm: reloading the company preview failed', failure),
    );
  });

  it('reloads the preview and the list after an edit is saved', async () => {
    const { onSaved } = renderView();

    await userEvent.click(screen.getByRole('button', { name: 'Edit company' }));
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
});
