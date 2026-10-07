import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TicketColumnSelect } from '../../../../../src/pages/projects/ticket/TicketColumnSelect';
import { renderWithProviders } from '../../../test-utils';
import { optionsOf, pickOption } from '../../../helpers/form-helpers';

const COLUMNS = [
  { id: 'todo', name: 'To do' },
  { id: 'doing', name: 'In progress' },
  { id: 'done', name: 'Done' },
];

describe('TicketColumnSelect', () => {
  it('shows the column the ticket is in and offers every board column', async () => {
    renderWithProviders(<TicketColumnSelect columns={COLUMNS} value="doing" onChange={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: /Column/ })).toHaveTextContent('In progress');
    expect(await optionsOf(/Column/)).toEqual(['To do', 'In progress', 'Done']);
  });

  it('moves the ticket by handing back the chosen column id', async () => {
    const onChange = vi.fn();
    renderWithProviders(<TicketColumnSelect columns={COLUMNS} value="todo" onChange={onChange} />);

    await pickOption(/Column/, 'Done');

    expect(onChange).toHaveBeenCalledWith('done');
  });
});
