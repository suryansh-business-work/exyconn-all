import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMAIL_VERIFIER_PATH, EmailVerifierPage } from '../../../../src/pages/email-verifier';
import { renderWithProviders } from '../../test-utils';

vi.mock('../../../../src/pages/email-verifier/SingleCheckPanel', () => ({
  SingleCheckPanel: () => <p>Single check panel</p>,
}));
vi.mock('../../../../src/pages/email-verifier/BulkCheckPanel', () => ({
  BulkCheckPanel: () => <p>Bulk check panel</p>,
}));
vi.mock('../../../../src/pages/email-verifier/RecordsPanel', () => ({
  RecordsPanel: () => <p>Records panel</p>,
}));

function renderPage(slug: string) {
  renderWithProviders(<EmailVerifierPage />, {
    route: `${EMAIL_VERIFIER_PATH}/${slug}`,
    path: `${EMAIL_VERIFIER_PATH}/*`,
  });
}

describe('EmailVerifierPage', () => {
  it('lives under CRM tools', () => {
    expect(EMAIL_VERIFIER_PATH).toBe('/tools/email-verifier');
  });

  it('opens the tab named in the URL', () => {
    renderPage('records');

    expect(screen.getByRole('heading', { name: 'Email verifier' })).toBeInTheDocument();
    expect(screen.getByText('Records panel')).toBeInTheDocument();
    expect(screen.queryByText('Single check panel')).not.toBeInTheDocument();
  });

  it('switches between a single check and a bulk upload', async () => {
    renderPage('check');
    expect(screen.getByText('Single check panel')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Bulk CSV' }));

    expect(await screen.findByText('Bulk check panel')).toBeInTheDocument();
    expect(screen.queryByText('Single check panel')).not.toBeInTheDocument();
  });
});
