import { createContext, useContext } from 'react';
import type { DocumentAttachment, RenderedOption, Ticket } from '@exyconn/wa-flow';

/** What a message can ask the chat to do — tapped options, opened attachments. */
export interface ChatActions {
  /** A tapped button / row / card; `quoted` is the text of the message it answers. */
  choose: (option: RenderedOption, quoted: string) => void;
  openDocument: (document: DocumentAttachment) => void;
  openTicket: (ticket: Ticket) => void;
  /** Explains a link or call that would leave the demo. */
  explainExternal: (target: string) => void;
}

const ChatActionsContext = createContext<ChatActions | null>(null);

export const ChatActionsProvider = ChatActionsContext.Provider;

export function useChatActions(): ChatActions {
  const actions = useContext(ChatActionsContext);
  if (!actions) {
    throw new Error('useChatActions must be used inside a ChatActionsProvider');
  }
  return actions;
}
