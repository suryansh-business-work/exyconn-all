import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  WebsiteChatFaqsPagedDocument,
  useDeleteWebsiteChatFaqMutation,
  type WebsiteChatFaqsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { ChatFaqForm, type ChatFaqRow } from '../forms/chat-faq';
import { CHAT_FAQ_COLUMNS, type ChatFaqPagedRow, type ChatFaqsGridContext } from './chat-faqs-grid';

/**
 * Website > Chatbot > FAQs — the questions and answers in the chat widget's FAQs tab. Saving
 * one updates every open widget straight away.
 */
export function ChatFaqsPage() {
  const { formatDate } = useSettings();
  const [deleteFaq] = useDeleteWebsiteChatFaqMutation();
  const crud = useCrudResource<ChatFaqRow, ChatFaqPagedRow>({
    label: 'FAQ',
    onDelete: (row) => deleteFaq({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the FAQ "{question}"?',
      values: { question: row.question },
    }),
  });
  const fetchRows = usePagedFetcher(
    WebsiteChatFaqsPagedDocument,
    (data: WebsiteChatFaqsPagedQuery) => data.listWebsiteChatFaqsPaged,
  );

  const gridContext: ChatFaqsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDate,
  };

  return (
    <CrudDashboard
      title="Chatbot FAQs"
      subtitle="Questions and answers in the chat widget's FAQs tab"
      entityLabel="FAQ"
      exportFileName="chatbot-faqs"
      stats={[]}
      crud={crud}
      renderForm={(initial) => (
        <ChatFaqForm initial={initial} onCancel={crud.close} onDone={crud.onDone} />
      )}
      columnDefs={CHAT_FAQ_COLUMNS}
      fetchRows={fetchRows}
      context={gridContext}
      searchPlaceholder="Search questions and answers…"
    />
  );
}
