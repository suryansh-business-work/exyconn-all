import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSuggestSupportReplyMutation } from '@/graphql/generated';
import { SuggestReplyButton } from '@/pages/ticket-desk/forms/support-reply/SuggestReplyButton';
import { renderWithProviders } from '../../../test-utils';
import { mutationTuple } from '../../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSuggestSupportReplyMutation: vi.fn(),
}));

const suggest = vi.fn();

function renderButton(loading = false) {
  vi.mocked(useSuggestSupportReplyMutation).mockReturnValue(
    mutationTuple(suggest, loading) as never,
  );
  const onSuggest = vi.fn();
  renderWithProviders(<SuggestReplyButton ticketId="t-1" onSuggest={onSuggest} />);
  return { onSuggest };
}

const click = () => userEvent.click(screen.getByRole('button', { name: 'Suggest a reply' }));

beforeEach(() => {
  suggest.mockReset();
});

describe('SuggestReplyButton', () => {
  it('drops the draft into the form and names the articles it came from', async () => {
    suggest.mockResolvedValue({
      data: {
        suggestSupportReply: {
          body: 'We have refunded the charge.',
          articles: [
            { id: 'a-1', title: 'Refunds', slug: 'refunds' },
            { id: 'a-2', title: 'Invoices', slug: 'invoices' },
          ],
          cannedReplies: [],
        },
      },
    });
    const { onSuggest } = renderButton();

    await click();

    expect(suggest).toHaveBeenCalledWith({ variables: { ticketId: 't-1' } });
    expect(onSuggest).toHaveBeenCalledWith('We have refunded the charge.');
    expect(await screen.findByText('Drafted from: Refunds, Invoices')).toBeInTheDocument();
  });

  it('names no sources for a draft written without articles', async () => {
    suggest.mockResolvedValue({
      data: { suggestSupportReply: { body: 'Checking.', articles: [], cannedReplies: [] } },
    });
    const { onSuggest } = renderButton();

    await click();

    expect(onSuggest).toHaveBeenCalledWith('Checking.');
    expect(screen.queryByText(/Drafted from/)).not.toBeInTheDocument();
  });

  it('changes nothing when the server sends no draft back', async () => {
    suggest.mockResolvedValue({ data: null });
    const { onSuggest } = renderButton();

    await click();

    expect(onSuggest).not.toHaveBeenCalled();
  });

  it('tells the agent why a draft failed, such as a spent AI budget', async () => {
    suggest.mockRejectedValue(new Error('The monthly AI budget has been reached'));
    const { onSuggest } = renderButton();

    await click();

    expect(await screen.findByText('The monthly AI budget has been reached')).toBeInTheDocument();
    expect(onSuggest).not.toHaveBeenCalled();
  });

  it('is disabled while a draft is being written', () => {
    renderButton(true);

    expect(screen.getByRole('button', { name: 'Drafting…' })).toBeDisabled();
  });
});
