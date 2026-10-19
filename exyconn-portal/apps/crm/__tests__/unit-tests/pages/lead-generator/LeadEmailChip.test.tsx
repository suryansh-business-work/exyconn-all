import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadEmailStatus } from '@exyconn/shell/graphql/generated';
import { LeadEmailChip } from '../../../../src/pages/lead-generator/LeadEmailChip';
import { renderWithProviders } from '../../test-utils';
import { foundLookup, missLookup } from './lead-fixtures';

describe('LeadEmailChip', () => {
  it('shows nothing before the website is looked up', () => {
    const { container } = renderWithProviders(<LeadEmailChip lookup={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('says the website is being read while the lookup runs', () => {
    renderWithProviders(<LeadEmailChip lookup={{ status: 'PENDING' }} />);

    expect(screen.getByText('Reading website…')).toBeInTheDocument();
  });

  it('counts the addresses found', () => {
    renderWithProviders(<LeadEmailChip lookup={foundLookup(['a@x.example', 'b@x.example'])} />);

    expect(screen.getByText('2 emails found')).toBeInTheDocument();
  });

  it.each([LeadEmailStatus.None, LeadEmailStatus.Blocked, LeadEmailStatus.Unreachable])(
    'explains why no email was found (%s), also as a tooltip',
    async (status) => {
      renderWithProviders(<LeadEmailChip lookup={missLookup('The site blocks robots', status)} />);

      const chip = screen.getByRole('img', { name: 'No email found: The site blocks robots' });
      expect(chip).toHaveTextContent('No email found');

      await userEvent.hover(chip);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('The site blocks robots');
    },
  );
});
