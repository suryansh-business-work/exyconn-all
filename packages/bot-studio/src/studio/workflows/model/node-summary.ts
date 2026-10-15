/**
 * One line saying what a node does, for its card on the canvas. Author content (a message,
 * a file name) is shown as written; anything the editor phrases itself is an English source
 * with `{placeholders}`, translated by the card.
 */
import type { WaNode } from '@exyconn/wa-flow';

export type NodeSummary =
  | { kind: 'content'; text: string }
  | { kind: 'phrase'; text: string; values?: Readonly<Record<string, string | number>> };

const content = (text: string | undefined): NodeSummary => ({ kind: 'content', text: text ?? '' });
const phrase = (text: string, values?: Readonly<Record<string, string | number>>): NodeSummary => ({
  kind: 'phrase',
  text,
  values,
});

function messageSummary(node: WaNode): NodeSummary | undefined {
  switch (node.type) {
    case 'text':
    case 'notice':
    case 'buttons':
    case 'list':
    case 'cta':
    case 'handoff':
      return content(node.data.text);
    case 'image':
      return content(node.data.caption ?? node.data.image.title);
    case 'document':
      return content(node.data.document.fileName);
    case 'location':
      return content(node.data.location.name);
    case 'contact':
      return content(node.data.contact.name);
    case 'product':
      return content(node.data.product.title);
    case 'ticket':
      return content(node.data.ticket.title);
    case 'order':
      return content(node.data.order.title);
    default:
      return undefined;
  }
}

/** The summary shown under a node's title. */
export function nodeSummary(node: WaNode): NodeSummary {
  const message = messageSummary(node);
  if (message) {
    return message;
  }
  switch (node.type) {
    case 'carousel':
      return phrase('{count} cards', { count: node.data.cards.length });
    case 'input':
      return phrase('Saves a {kind} answer in "{name}"', {
        kind: node.data.kind,
        name: node.data.var,
      });
    case 'ai':
      return content(node.data.prompt);
    case 'condition':
      return phrase('{count} cases, then otherwise', { count: node.data.cases.length });
    case 'delay':
      return phrase('Waits {seconds} s', { seconds: node.data.ms / 1000 });
    case 'reminder':
      return phrase('After {seconds} s', { seconds: node.data.afterMs / 1000 });
    case 'jump':
      return phrase('Starts "{key}"', { key: node.data.workflowKey });
    case 'end':
      return node.data.showMenu ? phrase('Ends and shows the menu') : content(node.data.text);
    default:
      return content('');
  }
}
