import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { AudienceCountsGrid } from '../../../../src/pages/audiences/AudienceCountsGrid';
import { renderWithProviders } from '../../test-utils';
import { audienceCounts } from './audience.fixtures';

/** The grid container: the one element announcing whether the figures are current. */
const grid = () => document.querySelector('[aria-busy]') as HTMLElement;

describe('AudienceCountsGrid', () => {
  it('shows every figure from the server beside its label and what it means', () => {
    renderWithProviders(<AudienceCountsGrid counts={audienceCounts()} stale={false} />);

    expect(screen.getByText('Contacts').previousSibling).toHaveTextContent('120');
    expect(screen.getByText('Email addresses found').previousSibling).toHaveTextContent('1,500');
    expect(screen.getByText('Duplicates').previousSibling).toHaveTextContent('40');
    expect(screen.getByText('Unsubscribed / blocked').previousSibling).toHaveTextContent('9');
    expect(screen.getByText('Final eligible recipients').previousSibling).toHaveTextContent(
      '1,430',
    );
    expect(screen.getByText('Records without email').previousSibling).toHaveTextContent('7');
    expect(screen.getByText('Unique addresses that will be sent to')).toBeInTheDocument();
    expect(screen.getByText('Left company, excluded or filtered')).toBeInTheDocument();
  });

  it('shows eleven tiles, one per figure', () => {
    renderWithProviders(<AudienceCountsGrid counts={audienceCounts()} stale={false} />);

    expect(grid().children).toHaveLength(11);
    expect(grid()).toHaveAttribute('aria-busy', 'false');
    expect(grid()).toHaveStyle({ opacity: '1' });
  });

  it('shows a zero as a figure, not a placeholder', () => {
    renderWithProviders(
      <AudienceCountsGrid counts={audienceCounts({ eligible: 0 })} stale={false} />,
    );

    expect(screen.getByText('Final eligible recipients').previousSibling).toHaveTextContent(/^0$/);
  });

  it('holds a skeleton in every tile before the first figures arrive', () => {
    renderWithProviders(<AudienceCountsGrid counts={null} stale />);

    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(11);
    expect(screen.queryByText('120')).not.toBeInTheDocument();
    // Nothing to dim yet: the skeletons already say the figures are coming.
    expect(grid()).toHaveStyle({ opacity: '1' });
    expect(grid()).toHaveAttribute('aria-busy', 'true');
  });

  it('dims the old figures while new ones are on the way', () => {
    renderWithProviders(<AudienceCountsGrid counts={audienceCounts()} stale />);

    expect(grid()).toHaveStyle({ opacity: '0.55' });
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Contacts').previousSibling).toHaveTextContent('120');
  });
});
