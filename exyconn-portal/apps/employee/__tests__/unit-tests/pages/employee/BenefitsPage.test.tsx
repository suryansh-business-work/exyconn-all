import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMyBenefitsQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from './helpers/apollo';
import { BenefitsPage } from '../../../../src/pages/employee/BenefitsPage';

vi.mock('@exyconn/shell/hooks/useSettings', () => import('./helpers/settings'));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useMyBenefitsQuery: vi.fn(),
}));

const full = {
  id: 'b1',
  kind: 'HEALTH_INSURANCE',
  name: 'Group health cover',
  provider: 'Star Health',
  reference: 'POL-881',
  coverage: '5 lakh family floater',
  validTo: '2027-03-31',
  documentUrl: 'https://files.example.com/policy.pdf',
};

const bare = {
  id: 'b2',
  kind: 'PF',
  name: 'Provident fund',
  provider: '',
  reference: '',
  coverage: '',
  validTo: null,
  documentUrl: null,
};

describe('BenefitsPage', () => {
  it('shows each benefit, a dash for every detail HR left blank, and a link to the document', () => {
    vi.mocked(useMyBenefitsQuery).mockReturnValue(
      queryResult({ data: { myBenefits: [full, bare] } }),
    );
    renderWithProviders(<BenefitsPage />);

    const [, fullRow, bareRow] = screen.getAllByRole('row');
    expect(within(fullRow).getByText('Group health cover')).toBeInTheDocument();
    expect(within(fullRow).getByText('HEALTH INSURANCE')).toBeInTheDocument();
    expect(within(fullRow).getByText('Star Health')).toBeInTheDocument();
    expect(within(fullRow).getByText('POL-881')).toBeInTheDocument();
    expect(within(fullRow).getByText('5 lakh family floater')).toBeInTheDocument();
    expect(within(fullRow).getByText('on 2027-03-31')).toBeInTheDocument();
    const link = within(fullRow).getByRole('link', { name: 'Open' });
    expect(link).toHaveAttribute('href', full.documentUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    expect(within(bareRow).getByText('Provident fund')).toBeInTheDocument();
    expect(within(bareRow).getAllByText('—')).toHaveLength(5);
    expect(within(bareRow).queryByRole('link')).toBeNull();
  });

  it('says so when nothing is recorded, and reloads on Refresh', async () => {
    const refetch = vi.fn(() => Promise.resolve({}));
    vi.mocked(useMyBenefitsQuery).mockReturnValue(
      queryResult({ data: { myBenefits: [] }, refetch }),
    );
    renderWithProviders(<BenefitsPage />);

    expect(screen.getByText('No benefits recorded for you yet.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('holds the table busy and does not claim the list is empty while the first response loads', () => {
    vi.mocked(useMyBenefitsQuery).mockReturnValue(queryResult({ loading: true }));
    const { container } = renderWithProviders(<BenefitsPage />);
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('No benefits recorded for you yet.')).toBeNull();
  });
});
