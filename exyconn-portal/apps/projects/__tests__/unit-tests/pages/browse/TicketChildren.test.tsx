import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { TicketChildren } from '../../../../src/pages/browse/TicketChildren';
import { renderWithProviders } from '../../test-utils';
import { taskRow } from '../../fixtures';

const STATUS = new Map([['todo', 'To do']]);

describe('TicketChildren', () => {
  it('says nothing is filed under the epic yet', () => {
    renderWithProviders(<TicketChildren issues={[]} statusOf={STATUS} />);

    expect(screen.getByRole('heading', { name: 'Child issues (0)' })).toBeInTheDocument();
    expect(
      screen.getByText('Nothing is filed under this epic yet. Pick it as the Epic on any ticket.'),
    ).toBeInTheDocument();
  });

  it('links each child to its page with its title and column', () => {
    renderWithProviders(
      <TicketChildren
        issues={[
          taskRow({ id: 'c1', key: 'EXY-7', title: 'Design the form', columnId: 'todo' }),
          taskRow({ id: 'c2', key: 'EXY 8', title: 'Wire it up', columnId: 'gone' }),
        ]}
        statusOf={STATUS}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Child issues (2)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'EXY-7' })).toHaveAttribute(
      'href',
      '/projects/browse/EXY-7',
    );
    expect(screen.getByRole('link', { name: 'EXY 8' })).toHaveAttribute(
      'href',
      '/projects/browse/EXY%208',
    );
    const first = screen.getByText('Design the form').parentElement as HTMLElement;
    expect(within(first).getByText('To do')).toBeInTheDocument();
    const second = screen.getByText('Wire it up').parentElement as HTMLElement;
    expect(within(second).queryByText('To do')).not.toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Type: Bug' })).toHaveLength(2);
  });
});
