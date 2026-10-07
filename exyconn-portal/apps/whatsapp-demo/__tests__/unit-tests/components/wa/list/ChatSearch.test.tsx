import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSearch, type ChatFilter } from '../../../../../src/components/wa/list/ChatSearch';
import { renderWithProviders } from '../../../test-utils';

function Harness({ onQuery }: Readonly<{ onQuery: (query: string) => void }>) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ChatFilter>('all');
  return (
    <ChatSearch
      query={query}
      onQuery={(next) => {
        setQuery(next);
        onQuery(next);
      }}
      filter={filter}
      onFilter={setFilter}
    />
  );
}

describe('ChatSearch', () => {
  it('reports what is typed in the search box', async () => {
    const user = userEvent.setup();
    const onQuery = vi.fn();
    renderWithProviders(<Harness onQuery={onQuery} />);
    const box = screen.getByRole('textbox', { name: 'Search chats' });
    expect(box).toHaveAttribute('placeholder', 'Search or start a new chat');
    await user.type(box, 'spa');
    expect(box).toHaveValue('spa');
    expect(onQuery).toHaveBeenLastCalledWith('spa');
  });

  it('marks the active filter as pressed and switches between All and Unread', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness onQuery={vi.fn()} />);
    const all = screen.getByRole('button', { name: 'All' });
    const unread = screen.getByRole('button', { name: 'Unread' });
    expect(all).toHaveAttribute('aria-pressed', 'true');
    expect(unread).toHaveAttribute('aria-pressed', 'false');
    await user.click(unread);
    expect(unread).toHaveAttribute('aria-pressed', 'true');
    expect(all).toHaveAttribute('aria-pressed', 'false');
  });

  it('groups the filters under a translated label', () => {
    renderWithProviders(<Harness onQuery={vi.fn()} />, {
      messages: { 'Filter chats': 'Filtrer', Unread: 'Non lus' },
    });
    expect(screen.getByRole('group', { name: 'Filtrer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non lus' })).toBeInTheDocument();
  });
});
