import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupportCategory, useListActiveCannedRepliesQuery } from '@/graphql/generated';
import { CannedReplyPicker } from '@/pages/ticket-desk/forms/support-reply/CannedReplyPicker';
import { renderWithProviders } from '../../../test-utils';
import { queryResult } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useListActiveCannedRepliesQuery: vi.fn(),
}));

const snippets = [
  { id: 'c-1', title: 'Greeting', category: SupportCategory.It, body: 'Hi there,', isActive: true },
  { id: 'c-2', title: 'Sign-off', category: SupportCategory.It, body: 'Thanks!', isActive: true },
];

function renderPicker(list: unknown[] | null) {
  vi.mocked(useListActiveCannedRepliesQuery).mockReturnValue(
    queryResult(list ? { listActiveCannedReplies: list } : undefined) as never,
  );
  const onPick = vi.fn();
  const { container } = renderWithProviders(<CannedReplyPicker onPick={onPick} />);
  return { onPick, container };
}

describe('CannedReplyPicker', () => {
  it('renders nothing when the desk has saved no snippets', () => {
    expect(renderPicker([]).container).toBeEmptyDOMElement();
    expect(renderPicker(null).container).toBeEmptyDOMElement();
  });

  it("hands over the chosen snippet's text and goes back to the prompt", async () => {
    const { onPick } = renderPicker(snippets);
    const picker = screen.getByRole('combobox', { name: 'Insert a canned reply' });

    await userEvent.click(picker);
    await userEvent.click(within(screen.getByRole('listbox')).getByText('Sign-off'));

    expect(onPick).toHaveBeenCalledWith('Thanks!');
    expect(picker).not.toHaveTextContent('Sign-off');
    expect(
      screen.getByText('Drops the text in so you can edit it before sending'),
    ).toBeInTheDocument();
  });
});
