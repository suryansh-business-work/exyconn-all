/**
 * Turns a node into the messages a customer sees: templates translated and filled, prices
 * resolved, dynamic rows generated, every option stamped with where it leads.
 */
import { HANDLE } from '../handles';
import type { BotContent, RenderedOption, RenderedProduct } from '../messages';
import type { NodeOf, Product, WaNode } from '../schema';
import type { DummyData } from './dummy';
import { amountOf, evaluateAll, fill, say, type Scope } from './template';
import type { EngineContext } from './types';

export interface RenderInput {
  workflow: string;
  scope: Scope;
  ctx: EngineContext;
  data: DummyData;
}

const optional = (value: string | undefined, input: RenderInput) =>
  value ? say(value, input.scope, input.ctx) : undefined;

function option(
  node: WaNode,
  handle: string,
  source: {
    id: string;
    title: string;
    description?: string;
    set?: Readonly<Record<string, string>>;
  },
  input: RenderInput,
): RenderedOption {
  return {
    id: source.id,
    title: say(source.title, input.scope, input.ctx),
    description: optional(source.description, input),
    set: source.set ? evaluateAll(source.set, input.scope, input.ctx, input.data) : undefined,
    ref: { workflow: input.workflow, node: node.id, handle },
  };
}

function product(source: Product, input: RenderInput): RenderedProduct {
  return {
    id: source.id,
    title: say(source.title, input.scope, input.ctx),
    subtitle: optional(source.subtitle, input),
    price: amountOf(source.price, input.scope, input.ctx),
    mrp: source.mrp === undefined ? undefined : amountOf(source.mrp, input.scope, input.ctx),
    badge: optional(source.badge, input),
    image: fillDeep(source.image, input),
  };
}

/** Rows a `dynamic` list generates: upcoming days, or free slots on the chosen day. */
function dynamicRows(node: NodeOf<'list'>, input: RenderInput): RenderedOption[] {
  const dynamic = node.data.dynamic;
  if (!dynamic) {
    return [];
  }
  const { ctx, data, scope } = input;
  const values =
    dynamic.kind === 'days'
      ? data.nextDays(dynamic.count, dynamic.skipSundays)
      : data.slots(
          Number(scope[dynamic.dayVar]),
          dynamic.from,
          dynamic.to,
          dynamic.stepMin,
          dynamic.take,
        );
  const label = dynamic.kind === 'days' ? ctx.format.day : ctx.format.time;
  return values.map((ms) => ({
    id: `${dynamic.var}-${ms}`,
    title: label(ms),
    set: { [dynamic.var]: String(ms), [`${dynamic.var}Label`]: label(ms) },
    ref: { workflow: input.workflow, node: node.id, handle: HANDLE.pick },
  }));
}

function renderList(node: NodeOf<'list'>, input: RenderInput): BotContent {
  const generated = dynamicRows(node, input);
  const sections = node.data.sections.map((s) => ({
    id: s.id,
    title: say(s.title, input.scope, input.ctx),
    rows: s.rows.map((r) => option(node, r.id, r, input)),
  }));
  const all =
    generated.length > 0
      ? [
          {
            id: 'generated',
            title: say(node.data.button, input.scope, input.ctx),
            rows: generated,
          },
          ...sections,
        ]
      : sections;
  return {
    type: 'list',
    header: optional(node.data.header, input),
    text: say(node.data.text, input.scope, input.ctx),
    footer: optional(node.data.footer, input),
    button: say(node.data.button, input.scope, input.ctx),
    sections: all,
  };
}

function renderOrder(node: NodeOf<'order'>, input: RenderInput): BotContent {
  const { order } = node.data;
  const items = order.items.map((i) => ({
    id: i.id,
    name: say(i.name, input.scope, input.ctx),
    qty: i.qty,
    price: amountOf(i.price, input.scope, input.ctx),
  }));
  const adjustments = (order.adjustments ?? []).map((a) => ({
    id: a.id,
    label: say(a.label, input.scope, input.ctx),
    amount: amountOf(a.amount, input.scope, input.ctx),
  }));
  const total =
    items.reduce((sum, i) => sum + i.qty * i.price, 0) +
    adjustments.reduce((sum, a) => sum + a.amount, 0);
  const pay =
    order.status === 'pending' && order.payTitle
      ? option(node, HANDLE.pay, { id: HANDLE.pay, title: order.payTitle }, input)
      : undefined;
  return {
    type: 'order',
    order: {
      orderId: fill(order.orderId, input.scope, input.ctx),
      title: say(order.title, input.scope, input.ctx),
      items,
      adjustments,
      total,
      status: order.status,
    },
    pay,
  };
}

/** Keys holding names the screen maps (icons, colours, kinds) — never translated or filled. */
const VERBATIM = new Set(['icon', 'accent', 'kind', 'fileType', 'flag', 'id']);
/** Keys holding data rather than prose — filled with variables but never translated. */
const UNTRANSLATED = new Set(['url', 'phone', 'qrData', 'ticketId', 'fileName', 'email']);

/** Deep-fills every string in a JSON value (documents, tickets, contacts, locations). */
function fillDeep<T>(value: T, input: RenderInput, key = ''): T {
  if (typeof value === 'string') {
    if (VERBATIM.has(key)) {
      return value;
    }
    const filled = UNTRANSLATED.has(key)
      ? fill(value, input.scope, input.ctx)
      : say(value, input.scope, input.ctx);
    return filled as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => fillDeep(v, input, key)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, fillDeep(v, input, k)]),
    ) as T;
  }
  return value;
}

/** The messages a node sends. Logic nodes (condition, delay, reminder, jump) send none. */
export function renderNode(node: WaNode, input: RenderInput): BotContent[] {
  const s = (text: string) => say(text, input.scope, input.ctx);
  switch (node.type) {
    case 'text':
      return [{ type: 'text', text: s(node.data.text) }];
    case 'notice':
      return [{ type: 'system', text: s(node.data.text) }];
    case 'buttons':
      return [
        {
          type: 'buttons',
          header: optional(node.data.header, input),
          text: s(node.data.text),
          footer: optional(node.data.footer, input),
          buttons: node.data.buttons.map((b) => option(node, b.id, b, input)),
        },
      ];
    case 'list':
      return [renderList(node, input)];
    case 'cta':
      return [
        {
          type: 'cta',
          header: optional(node.data.header, input),
          text: s(node.data.text),
          footer: optional(node.data.footer, input),
          actions: node.data.actions.map((a) =>
            a.kind === 'calendar'
              ? {
                  kind: 'calendar',
                  title: s(a.title),
                  event: {
                    title: s(a.event.title),
                    start: Number(fill(a.event.start, input.scope, input.ctx)),
                    durationMin: a.event.durationMin,
                    location: optional(a.event.location, input),
                  },
                }
              : { ...fillDeep(a, input), title: s(a.title) },
          ),
        },
      ];
    case 'image':
      return [
        {
          type: 'image',
          image: fillDeep(node.data.image, input),
          caption: optional(node.data.caption, input),
        },
      ];
    case 'document':
      return [
        {
          type: 'document',
          document: fillDeep(node.data.document, input),
          caption: optional(node.data.caption, input),
        },
      ];
    case 'location':
      return [
        {
          type: 'location',
          location: fillDeep(node.data.location, input),
          caption: optional(node.data.caption, input),
        },
      ];
    case 'contact':
      return [{ type: 'contact', contact: fillDeep(node.data.contact, input) }];
    case 'ticket':
      return [
        {
          type: 'ticket',
          ticket: fillDeep(node.data.ticket, input),
          caption: optional(node.data.caption, input),
        },
      ];
    case 'product': {
      const p = node.data.product;
      const pick = p.buttonTitle
        ? option(node, p.id, { id: p.id, title: p.buttonTitle, set: p.set }, input)
        : undefined;
      return [{ type: 'product', product: product(p, input), option: pick }];
    }
    case 'carousel':
      return [
        {
          type: 'carousel',
          text: optional(node.data.text, input),
          cards: node.data.cards.map((c) => ({
            product: product(c, input),
            option: c.buttonTitle
              ? option(node, c.id, { id: c.id, title: c.buttonTitle, set: c.set }, input)
              : undefined,
          })),
        },
      ];
    case 'order':
      return [renderOrder(node, input)];
    case 'input':
    case 'ai':
      return node.data.prompt ? [{ type: 'text', text: s(node.data.prompt) }] : [];
    case 'handoff':
      return [
        {
          type: 'system',
          text: fill(
            input.ctx.t('{{agent}} joined the conversation'),
            { agent: node.data.agentName },
            input.ctx,
          ),
        },
        { type: 'text', text: s(node.data.text), sender: node.data.agentName },
      ];
    case 'end':
      return node.data.text ? [{ type: 'text', text: s(node.data.text) }] : [];
    default:
      return [];
  }
}
