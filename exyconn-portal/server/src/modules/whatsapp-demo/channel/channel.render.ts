import type { BotContent, RenderedCta, RenderedProduct } from '@exyconn/wa-flow';
import type { Formatters } from '@exyconn/wa-flow/engine';
import type { WaPayload } from './channel.graph';
import { clip, interactive, oneButton, type Register } from './render.interactive';

/**
 * What the engine sends, as WhatsApp messages. Text, buttons, lists, links, locations and
 * contacts are WhatsApp's own; the browser demo's mock-up cards (products, orders, tickets,
 * documents, illustrations) have no real file or catalogue behind them, so they go as
 * formatted text, with any option they offer as a reply button.
 */
export interface RenderTools {
  register: Register;
  format: Formatters;
  t: (source: string) => string;
}

const TEXT_MAX = 4096;

const text = (body: string): WaPayload => ({
  type: 'text',
  text: { body: clip(body, TEXT_MAX), preview_url: false },
});

const lines = (...parts: (string | undefined | false)[]) =>
  parts.filter((part): part is string => typeof part === 'string' && part !== '').join('\n');

function productText(product: RenderedProduct, format: Formatters): string {
  const mrp = product.mrp ? ` (${format.money(product.mrp)})` : '';
  return lines(
    `*${product.title}*`,
    product.subtitle,
    `${format.money(product.price)}${mrp}`,
    product.badge,
  );
}

function ctaPayload(action: RenderedCta, body: string, tools: RenderTools): WaPayload {
  if (action.kind === 'url') {
    return {
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: clip(body || action.title, 1024) },
        action: {
          name: 'cta_url',
          parameters: { display_text: clip(action.title, 20), url: action.url },
        },
      },
    };
  }
  if (action.kind === 'call') {
    return text(lines(body, `${action.title}: ${action.phone}`));
  }
  const when = `${tools.format.date(action.event.start)} ${tools.format.time(action.event.start)}`;
  return text(lines(body, `*${action.event.title}*`, when, action.event.location));
}

type Card = Exclude<BotContent, { type: 'buttons' | 'list' | 'text' | 'system' | 'cta' }>;

/** The mock-up cards and the native location and contact messages. */
function cardPayloads(content: Card, tools: RenderTools): WaPayload[] {
  const { format, register } = tools;
  switch (content.type) {
    case 'image':
      return [
        text(
          lines(
            content.image.title && `*${content.image.title}*`,
            content.image.subtitle,
            content.caption,
          ),
        ),
      ];
    case 'document': {
      const { fileName, fileType, pages } = content.document;
      return [
        text(lines(`*${fileName}*`, `${fileType} · ${pages} ${tools.t('pages')}`, content.caption)),
      ];
    }
    case 'location': {
      const { name, address, lat, lng } = content.location;
      const pin: WaPayload = {
        type: 'location',
        location: { latitude: lat, longitude: lng, name, address },
      };
      return content.caption ? [pin, text(content.caption)] : [pin];
    }
    case 'contact': {
      const { name, phone, role, organisation } = content.contact;
      return [
        {
          type: 'contacts',
          contacts: [
            {
              name: { formatted_name: name, first_name: name },
              phones: [{ phone }],
              org: { company: organisation, title: role },
            },
          ],
        },
      ];
    }
    case 'ticket': {
      const { ticket } = content;
      const fields = ticket.fields.map((f) => `${f.label}: ${f.value}`);
      return [
        text(
          lines(
            `*${ticket.title}*`,
            ticket.subtitle,
            `${tools.t('Ticket')}: ${ticket.ticketId}`,
            ...fields,
            content.caption,
          ),
        ),
      ];
    }
    case 'product':
      return content.option
        ? [oneButton(productText(content.product, format), content.option, register)]
        : [text(productText(content.product, format))];
    case 'carousel':
      return [
        ...(content.text ? [text(content.text)] : []),
        ...content.cards.flatMap((card) => cardPayloads({ type: 'product', ...card }, tools)),
      ];
    default: {
      const { order, pay } = content;
      const items = order.items.map(
        (i) => `${i.qty} × ${i.name} — ${format.money(i.price * i.qty)}`,
      );
      const adjustments = order.adjustments.map((a) => `${a.label}: ${format.money(a.amount)}`);
      const body = lines(
        `*${order.title}* (${order.orderId})`,
        ...items,
        ...adjustments,
        `*${tools.t('Total')}: ${format.money(order.total)}*`,
      );
      return pay ? [oneButton(body, pay, register)] : [text(body)];
    }
  }
}

export function toPayloads(content: BotContent, tools: RenderTools): WaPayload[] {
  switch (content.type) {
    case 'text':
      return [text(content.sender ? `*${content.sender}*\n${content.text}` : content.text)];
    case 'system':
      return [text(`_${content.text}_`)];
    case 'buttons':
      return interactive.buttons(content, tools.register, tools.t('Choose'));
    case 'list':
      return interactive.list(content, tools.register);
    case 'cta':
      return content.actions.map((action, index) =>
        ctaPayload(
          action,
          index === 0 ? lines(content.header, content.text, content.footer) : '',
          tools,
        ),
      );
    default:
      return cardPayloads(content, tools);
  }
}
