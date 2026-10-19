import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionButtons, OptionList } from '../../../../src/widget/parts/OptionButtons';
import { option, renderPart } from '../widget.fixtures';

describe('OptionButtons', () => {
  it('sends the tapped quick reply with the message it answers', async () => {
    const yes = option('yes', 'Yes please');
    const { actions } = renderPart(
      <OptionButtons options={[yes, option('no', 'No thanks')]} quoted="Book a visit?" />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Yes please',
      'No thanks',
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Yes please' }));
    expect(actions.choose).toHaveBeenCalledWith(yes, 'Book a visit?');
  });
});

describe('OptionList', () => {
  it('lays every row open under its caption and sends the tapped row', async () => {
    const cleaning = { ...option('clean', 'Cleaning'), description: '30 minutes' };
    const { actions } = renderPart(
      <OptionList
        caption="View services"
        sections={[{ id: 's-1', title: 'Services', rows: [cleaning] }]}
        quoted="What do you need?"
      />,
    );
    expect(screen.getByText('View services')).toBeInTheDocument();
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
    // A single section needs no title of its own; the list is still named for screen readers.
    expect(screen.queryByText('Services')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Services' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Cleaning/ }));
    expect(actions.choose).toHaveBeenCalledWith(cleaning, 'What do you need?');
  });

  it('titles each section when there are several', () => {
    renderPart(
      <OptionList
        caption="View options"
        sections={[
          { id: 's-1', title: 'Morning', rows: [option('9am')] },
          { id: 's-2', title: 'Evening', rows: [option('6pm')] },
        ]}
        quoted="Pick a slot"
      />,
    );
    expect(screen.getByText('Morning')).toBeInTheDocument();
    expect(screen.getByText('Evening')).toBeInTheDocument();
  });
});
