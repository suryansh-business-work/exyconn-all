import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskPriority, TaskType } from '@exyconn/shell/graphql/generated';
import {
  TICKET_PRIORITIES,
  TICKET_TYPES,
  TicketFacetIcon,
} from '../../../../../src/pages/projects/ticket';
import { renderWithProviders } from '../../../test-utils';

describe('TicketFacetIcon', () => {
  it('names the facet for a screen reader and in a tooltip', async () => {
    renderWithProviders(
      <TicketFacetIcon facet={TICKET_PRIORITIES[TaskPriority.High]} kind="Priority" />,
    );

    const icon = screen.getByRole('img', { name: 'Priority: High' });
    expect(icon).toHaveAttribute('tabindex', '0');
    expect(icon).toHaveAttribute('data-testid', 'KeyboardArrowUpIcon');

    await userEvent.hover(icon);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Priority: High');
  });

  it('translates both the kind and the facet name', () => {
    renderWithProviders(
      <TicketFacetIcon facet={TICKET_TYPES[TaskType.Bug]} kind="Type" size={18} />,
      { messages: { Type: 'Typ', Bug: 'Fehler' }, locale: 'de' },
    );

    expect(screen.getByRole('img', { name: 'Typ: Fehler' })).toBeInTheDocument();
  });

  it('stays out of the accessibility tree when its name is written beside it', () => {
    const { container } = renderWithProviders(
      <TicketFacetIcon facet={TICKET_TYPES[TaskType.Epic]} kind="Type" decorative />,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('[data-testid="BoltIcon"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
