import type { ChatMessage, DocumentAttachment, RenderedOption, Ticket } from '@exyconn/wa-flow';
import { useChatActions } from '../../../../../src/components/wa/ChatActions';

export const PROBE_OPTION: RenderedOption = {
  id: 'yes',
  title: 'Yes',
  ref: { workflow: 'book', node: 'n1', handle: 'yes' },
};

export const PROBE_DOC: DocumentAttachment = {
  fileName: 'invoice.pdf',
  fileType: 'PDF',
  pages: 1,
  sizeKb: 20,
  preview: { title: 'Invoice', sections: [] },
};

export const PROBE_PASS: Ticket = {
  ticketId: 'TKT-1',
  title: 'Gate pass',
  fields: [],
  qrData: 'TKT-1',
};

/** Stands in for MessageView: one button per chat action, so a test can fire each one. */
export function MessageActionsProbe({ message }: Readonly<{ message: ChatMessage }>) {
  const actions = useChatActions();
  return (
    <div>
      <button type="button" onClick={() => actions.choose(PROBE_OPTION, message.id)}>
        probe choose
      </button>
      <button type="button" onClick={() => actions.openDocument(PROBE_DOC)}>
        probe document
      </button>
      <button type="button" onClick={() => actions.openTicket(PROBE_PASS)}>
        probe ticket
      </button>
      <button type="button" onClick={() => actions.explainExternal('https://example.com')}>
        probe external
      </button>
    </div>
  );
}
