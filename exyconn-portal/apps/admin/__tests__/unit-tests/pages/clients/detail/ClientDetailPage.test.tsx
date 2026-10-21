import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientDetailDocument, ClientSummaryDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../test-utils';
import { ClientDetailPage } from '../../../../../src/pages/clients';
import { CLIENT_ID, clientDetail, detailAnswer, summaryAnswer } from './client-detail.fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/crud')>();
  const { CrudDashboardStub } = await import('../../../crud-dashboard.stub');
  return { ...actual, CrudDashboard: CrudDashboardStub };
});

const renderPage = (mocks = [detailAnswer(), summaryAnswer()], route = `/clients/${CLIENT_ID}`) =>
  renderWithProviders(<ClientDetailPage />, { mocks, route, path: '/clients/:id/:tab?' });

describe('ClientDetailPage', () => {
  it('shows the client, their counts and every tab, opening on the overview', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText('Dana Reyes · billing@acme.example · +1 555 0100')).toBeInTheDocument();
    for (const tab of [
      'Overview',
      'Contacts',
      'Communication log',
      'Important links',
      'Contracts & documents',
      'Invoices',
      'Payments',
      'Support tickets',
      'Projects',
    ]) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
    expect(await screen.findByText('Logged communications')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX, United States')).toBeInTheDocument();
    expect(screen.getByText('EIN 12-3456789')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
  });

  it('names a client without a company by the person', async () => {
    renderPage([detailAnswer(clientDetail({ company: '', phone: '', taxId: '', country: '' }))]);

    expect(await screen.findByRole('heading', { name: 'Dana Reyes' })).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('says so when the client cannot be read, and tries again on Retry', async () => {
    const user = userEvent.setup();
    const failed = {
      request: { query: ClientDetailDocument, variables: { id: CLIENT_ID } },
      error: new Error('Client not found'),
    };
    renderPage([
      failed,
      failed,
      {
        ...summaryAnswer(),
        request: { query: ClientSummaryDocument, variables: { clientId: CLIENT_ID } },
      },
    ]);

    expect(await screen.findByText('Client not found')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Client not found')).toBeInTheDocument();
  });

  it('opens the Email client dialog from the header', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Email client' }));

    expect(await screen.findByRole('heading', { name: 'Email client' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
  });
});
