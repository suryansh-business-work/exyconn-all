import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WebsiteChatFaqsPagedDocument } from '@exyconn/shell/graphql/generated';
import { ChatFaqsPage } from '../../../../../src/pages/chat/faqs/ChatFaqsPage';
import { CHAT_FAQ_COLUMNS } from '../../../../../src/pages/chat/faqs/chat-faqs-grid';
import { renderWithProviders } from '../../../test-utils';
import { faqRow } from '../chat-fixtures';
import { dashboardProps, paged } from '../crud-stubs';

const gql = vi.hoisted(() => ({ deleteFaq: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteWebsiteChatFaqMutation: () => [gql.deleteFaq],
}));
vi.mock('@exyconn/crud', async (importOriginal) => {
  const stub = await import('../crud-stubs');
  return {
    ...(await importOriginal<typeof import('@exyconn/crud')>()),
    CrudDashboard: stub.CrudDashboardStub,
    usePagedFetcher: stub.usePagedFetcherStub,
  };
});
vi.mock('../../../../../src/pages/chat/forms/chat-faq', async () => ({
  ChatFaqForm: (await import('../crud-stubs')).FormStub,
}));

describe('ChatFaqsPage', () => {
  beforeEach(() => {
    gql.deleteFaq.mockReset().mockResolvedValue({ data: { deleteWebsiteChatFaq: true } });
  });

  it('lists the widget’s FAQs from the paged query with the FAQ columns', () => {
    renderWithProviders(<ChatFaqsPage />);
    const page = { totalCount: 1, rows: [faqRow()] };

    expect(screen.getByRole('heading', { name: 'Chatbot FAQs' })).toBeInTheDocument();
    expect(paged.document).toBe(WebsiteChatFaqsPagedDocument);
    expect(paged.select?.({ listWebsiteChatFaqsPaged: page } as never)).toBe(page);
    expect(dashboardProps()).toMatchObject({
      subtitle: "Questions and answers in the chat widget's FAQs tab",
      entityLabel: 'FAQ',
      exportFileName: 'chatbot-faqs',
      stats: [],
      columnDefs: CHAT_FAQ_COLUMNS,
      searchPlaceholder: 'Search questions and answers…',
    });
    expect(typeof dashboardProps().context.formatDate).toBe('function');
  });

  it('opens the form blank for a new FAQ and with the row to edit one', async () => {
    renderWithProviders(<ChatFaqsPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
    expect(screen.getByText('Blank form')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    expect(screen.queryByText('Blank form')).not.toBeInTheDocument();

    await act(async () => {
      await dashboardProps().context.actions.edit(faqRow({ question: 'Where are you based?' }));
    });
    expect(screen.getByText(/"question":"Where are you based\?"/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
    expect(screen.queryByText(/Where are you based/)).not.toBeInTheDocument();
  });

  it('deletes an FAQ after confirming, naming its question', async () => {
    renderWithProviders(<ChatFaqsPage />);
    let pending: unknown;
    act(() => {
      pending = dashboardProps().context.actions.delete(faqRow({ id: 'faq-9' }));
    });

    expect(
      await screen.findByText('Delete the FAQ "Do you build AI agents?"?'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await act(async () => {
      await pending;
    });

    expect(gql.deleteFaq).toHaveBeenCalledWith({ variables: { id: 'faq-9' } });
    expect(await screen.findByText('FAQ deleted')).toBeInTheDocument();
  });
});
