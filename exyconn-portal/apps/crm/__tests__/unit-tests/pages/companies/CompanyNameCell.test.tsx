import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import {
  CompanyNameCell,
  type CompanyNameRow,
} from '../../../../src/pages/companies/CompanyNameCell';
import { COMPANY_COLUMNS } from '../../../../src/pages/companies/companies-grid';
import { renderWithProviders } from '../../test-utils';

const params = (data: CompanyNameRow | undefined) =>
  ({ data }) as unknown as ICellRendererParams<CompanyNameRow>;

describe('CompanyNameCell', () => {
  it('shows the company name after its avatar', () => {
    renderWithProviders(
      <CompanyNameCell {...params({ name: 'Acme Corp', logoUrl: '', domain: 'acme.io' })} />,
    );
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('renders nothing for a row still loading', () => {
    const { container } = renderWithProviders(<CompanyNameCell {...params(undefined)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is the Companies grid name cell', () => {
    expect(COMPANY_COLUMNS[0]).toMatchObject({ field: 'name', cellRenderer: CompanyNameCell });
  });
});
