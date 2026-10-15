import { createContext, useContext } from 'react';
import type { CtaAction, DocumentAttachment, RenderedOption } from '@exyconn/wa-flow';
import type { WidgetLook } from './widget.look';

/** What a message in the widget can ask for, and the business's look. */
export interface WidgetActions {
  /** A tapped button, row or card; `quoted` is the text of the message it answers. */
  choose: (option: RenderedOption, quoted: string) => void;
  openDocument: (document: DocumentAttachment) => void;
  /** A link or call action — on a client's site it would leave the chat. */
  followAction: (action: Pick<CtaAction, 'kind' | 'title'> & { target: string }) => void;
  look: WidgetLook;
}

const WidgetActionsContext = createContext<WidgetActions | null>(null);

export const WidgetActionsProvider = WidgetActionsContext.Provider;

export function useWidgetActions(): WidgetActions {
  const actions = useContext(WidgetActionsContext);
  if (!actions) {
    throw new Error('Widget messages must sit inside a ChatWidget.');
  }
  return actions;
}
