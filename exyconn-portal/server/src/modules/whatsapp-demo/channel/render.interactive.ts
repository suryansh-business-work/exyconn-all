import { LIMITS, type BotContent, type RenderedOption } from '@exyconn/wa-flow';
import type { WaPayload } from './channel.graph';

/**
 * Engine buttons and lists as WhatsApp interactive messages. A tapped button or row comes
 * back carrying only its id, so every option is registered first and sent under the short
 * id `register` returns; the conversation turns that id back into the engine option.
 */
export type Register = (option: RenderedOption) => string;

type Buttons = Extract<BotContent, { type: 'buttons' }>;
type List = Extract<BotContent, { type: 'list' }>;
type Row = { id: string; title: string; description?: string };
type Section = { title: string; rows: Row[] };

/** WhatsApp refuses an interactive message whose body is longer than this. */
const BODY_MAX = 1024;

export const clip = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

const header = (text?: string) =>
  text ? { type: 'text', text: clip(text, LIMITS.header) } : undefined;
const footer = (text?: string) => (text ? { text: clip(text, LIMITS.footer) } : undefined);

function row(option: RenderedOption, register: Register): Row {
  return {
    id: register(option),
    title: clip(option.title, LIMITS.rowTitle),
    ...(option.description ? { description: clip(option.description, LIMITS.rowDescription) } : {}),
  };
}

/** Sections cut so no message carries more than the ten rows WhatsApp allows. */
function chunk(sections: Section[]): Section[][] {
  const pages: Section[][] = [[]];
  let used = 0;
  for (const section of sections) {
    for (let i = 0; i < section.rows.length; i += 1) {
      if (used === LIMITS.listRows) {
        pages.push([]);
        used = 0;
      }
      const page = pages.at(-1) ?? [];
      const last = page.at(-1);
      if (last?.title === section.title && i > 0) {
        last.rows.push(section.rows[i]);
      } else {
        page.push({ title: section.title, rows: [section.rows[i]] });
      }
      used += 1;
    }
  }
  return pages.filter((page) => page.length > 0);
}

function listPayloads(content: Omit<List, 'type'>, register: Register): WaPayload[] {
  const sections = content.sections.map((s) => ({
    title: clip(s.title, LIMITS.rowTitle),
    rows: s.rows.map((o) => row(o, register)),
  }));
  return chunk(sections).map((page, index) => ({
    type: 'interactive',
    interactive: {
      type: 'list',
      header: index === 0 ? header(content.header) : undefined,
      body: { text: clip(content.text, BODY_MAX) },
      footer: footer(content.footer),
      action: { button: clip(content.button, LIMITS.buttonTitle), sections: page },
    },
  }));
}

/** Up to three buttons as reply buttons; more than WhatsApp allows become a list. */
function buttonPayloads(content: Buttons, register: Register, more: string): WaPayload[] {
  if (content.buttons.length > LIMITS.buttons) {
    return listPayloads(
      {
        ...content,
        button: more,
        sections: [{ id: 'options', title: more, rows: content.buttons }],
      },
      register,
    );
  }
  return [
    {
      type: 'interactive',
      interactive: {
        type: 'button',
        header: header(content.header),
        body: { text: clip(content.text, BODY_MAX) },
        footer: footer(content.footer),
        action: {
          buttons: content.buttons.map((o) => ({
            type: 'reply',
            reply: { id: register(o), title: clip(o.title, LIMITS.buttonTitle) },
          })),
        },
      },
    },
  ];
}

/** One option offered under a card: a single reply button. */
export function oneButton(text: string, option: RenderedOption, register: Register): WaPayload {
  return buttonPayloads({ type: 'buttons', text, buttons: [option] }, register, option.title)[0];
}

export const interactive = {
  buttons: buttonPayloads,
  list: (content: List, register: Register) => listPayloads(content, register),
};
