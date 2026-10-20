import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { MARK_ORDER, MARK_WORDS } from '@exyconn/tracker-core';
import { TrackerStatusChip } from '@/pages/tracker-view/TrackerStatusChip';
import { renderWithProviders } from '../../test-utils';

describe('TrackerStatusChip', () => {
  it.each(MARK_ORDER)('names a %s day in words beside a hidden icon', (status) => {
    const { container } = renderWithProviders(<TrackerStatusChip status={status} />);

    expect(screen.getByText(MARK_WORDS[status])).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden] svg')).toBeInTheDocument();
  });

  it('translates the status word', () => {
    renderWithProviders(<TrackerStatusChip status="SHORT" />, {
      messages: { Short: 'Corto' },
    });

    expect(screen.getByText('Corto')).toBeInTheDocument();
  });

  it('colours a short day apart from a completed one', () => {
    const border = (status: 'SHORT' | 'COMPLETED') => {
      const { container, unmount } = renderWithProviders(<TrackerStatusChip status={status} />);
      const value = getComputedStyle(container.firstElementChild as Element).borderColor;
      unmount();
      return value;
    };

    expect(border('SHORT')).not.toBe(border('COMPLETED'));
  });
});
