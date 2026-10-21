import mjml2html from 'mjml';
import { escapeHtml } from '../email/email.render';

/** One problem MJML reported, at the line of the source it came from. */
export interface MjmlIssue {
  line: number;
  message: string;
}

export interface CompiledMjml {
  html: string;
  issues: MjmlIssue[];
}

/** What the organization's footer says; links are added by the footer itself. */
export interface FooterContent {
  companyName: string;
  contactLine: string;
  postalAddress: string;
  privacyUrl: string;
  websiteUrl: string;
  textColor: string;
  linkColor: string;
}

const UNSUBSCRIBE_TOKEN = /\{\{\s*(unsubscribe_url|unsubscribeUrl)\s*(\|[^{}]*)?\}\}/;
const PREFERENCES_TOKEN = /\{\{\s*preferences_url\s*(\|[^{}]*)?\}\}/;
const HEX_COLOR = /^#[\da-f]{3,8}$/i;
const SAFE_LINK = /^https?:\/\//i;

const colorOr = (value: string, fallback: string) => (HEX_COLOR.test(value) ? value : fallback);

/** A link the editor may only add when it is a real web address. */
function footerLink(url: string, label: string, color: string): string {
  return SAFE_LINK.test(url)
    ? ` · <a href="${escapeHtml(url)}" style="color:${color}">${label}</a>`
    : '';
}

/**
 * The compliance footer: who sent it, where they are, and the two links the recipient is
 * owed. Branding can change; the links cannot be removed, because the footer is added at send
 * time whenever the design does not carry both links itself.
 */
export function footerMjml(footer: FooterContent): string {
  const text = colorOr(footer.textColor, '#6b7280');
  const link = colorOr(footer.linkColor, '#2563eb');
  const lines = [footer.companyName, footer.contactLine, footer.postalAddress]
    .map((line) => line.trim())
    .filter(Boolean)
    .map(escapeHtml)
    .join('<br/>');
  const links =
    `<a href="{{unsubscribe_url}}" style="color:${link}">Unsubscribe</a>` +
    ` · <a href="{{preferences_url}}" style="color:${link}">Manage preferences</a>` +
    footerLink(footer.privacyUrl, 'Privacy policy', link) +
    footerLink(footer.websiteUrl, 'Website', link);
  return `
    <mj-section padding="16px 0">
      <mj-column>
        <mj-divider border-width="1px" border-color="#e5e7eb" />
        <mj-text align="center" font-size="12px" line-height="18px" color="${text}">
          ${lines ? `${lines}<br/>` : ''}You received this email because you are on our marketing list.
        </mj-text>
        <mj-text align="center" font-size="12px" color="${text}">${links}</mj-text>
      </mj-column>
    </mj-section>`;
}

/** Whether the design already carries both links the recipient is owed. */
export const hasCompliantFooter = (mjml: string): boolean =>
  UNSUBSCRIBE_TOKEN.test(mjml) && PREFERENCES_TOKEN.test(mjml);

/** The preheader as MJML's inbox preview, replacing one the design set itself. */
function withPreheader(mjml: string, preheader: string): string {
  if (!preheader.trim()) {
    return mjml;
  }
  const preview = `<mj-preview>${escapeHtml(preheader.trim())}</mj-preview>`;
  const withoutOld = mjml.replace(/<mj-preview>[\s\S]*?<\/mj-preview>/, '');
  if (withoutOld.includes('<mj-head>')) {
    return withoutOld.replace('<mj-head>', `<mj-head>${preview}`);
  }
  return withoutOld.replace(/<mjml([^>]*)>/, `<mjml$1><mj-head>${preview}</mj-head>`);
}

/**
 * The MJML a send compiles: the design, its preheader, and the compliance footer unless the
 * design already has a compliant one. The one function previews, checks and sends share.
 */
export function prepareMjml(mjml: string, preheader: string, footer: FooterContent): string {
  const withFooter = hasCompliantFooter(mjml)
    ? mjml
    : mjml.replace('</mj-body>', `${footerMjml(footer)}</mj-body>`);
  return withPreheader(withFooter, preheader);
}

/** An MJML tag, opening, closing or self-closing. Raw HTML inside <mj-text> is not tracked. */
const MJ_TAG = /<(\/?)(mjml|mj-[\w-]+)\b[^>]*?(\/?)>/g;

const lineAt = (source: string, index: number): number => source.slice(0, index).split('\n').length;

/**
 * Tags that are not closed, or closed in the wrong place. MJML's parser forgives these
 * silently and renders something else than was written, so they are reported by line.
 */
export function tagProblems(mjml: string): MjmlIssue[] {
  const open: { name: string; line: number }[] = [];
  const problems: MjmlIssue[] = [];
  for (const match of mjml.matchAll(MJ_TAG)) {
    const [, closing, name, selfClosing] = match;
    const line = lineAt(mjml, match.index ?? 0);
    if (selfClosing) {
      continue;
    }
    if (!closing) {
      open.push({ name, line });
      continue;
    }
    const top = open.at(-1);
    if (top?.name === name) {
      open.pop();
    } else {
      const target = top ? `<${top.name}> (line ${top.line})` : 'any open tag';
      problems.push({ line, message: `</${name}> does not close ${target}.` });
    }
  }
  for (const tag of open) {
    problems.push({ line: tag.line, message: `<${tag.name}> is never closed.` });
  }
  return problems;
}

/** Compiles MJML, keeping every problem with its line rather than failing at the first. */
export async function compileMjml(mjml: string): Promise<CompiledMjml> {
  if (!/<mjml[\s>]/.test(mjml) || !mjml.includes('<mj-body')) {
    return {
      html: '',
      issues: [{ line: 1, message: 'An email needs <mjml> and <mj-body> tags.' }],
    };
  }
  const unbalanced = tagProblems(mjml);
  if (unbalanced.length > 0) {
    return { html: '', issues: unbalanced };
  }
  try {
    const { html, errors } = await mjml2html(mjml, {
      validationLevel: 'soft',
      keepComments: false,
    });
    return { html, issues: errors.map((error) => ({ line: error.line, message: error.message })) };
  } catch (err) {
    return {
      html: '',
      issues: [
        { line: 1, message: err instanceof Error ? err.message : 'MJML could not be compiled.' },
      ],
    };
  }
}

/**
 * The start and end index of every `<…>` span holding at least one character, left to right,
 * as `/<([^>]+)>/g` would find them — but in linear time, where that regex rescans the rest of
 * the text from every `<` that is never closed.
 */
export function* angleSpans(text: string): Generator<[number, number]> {
  let open = text.indexOf('<');
  while (open !== -1) {
    const close = text.indexOf('>', open + 1);
    if (close === -1) {
      return;
    }
    if (close > open + 1) {
      yield [open, close];
    }
    open = text.indexOf('<', close);
  }
}

/** Drops every `<…>` tag, keeping the text between them. */
function stripTags(html: string): string {
  let text = '';
  let from = 0;
  for (const [open, close] of angleSpans(html)) {
    text += html.slice(from, open);
    from = close + 1;
  }
  return text + html.slice(from);
}

const ENTITIES: Readonly<Record<string, string>> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

/**
 * The plain-text alternative: block tags become line breaks, links keep their address, and
 * everything else — styles, the hidden preheader, tags — is dropped.
 */
export function htmlToText(html: string): string {
  const tagless = stripTags(
    html
      .replaceAll(/<(style|head|title)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replaceAll(/<div[^>]*display:\s*none[^>]*>[\s\S]*?<\/div>/gi, '')
      .replaceAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
      .replaceAll(/<br\s*\/?>/gi, '\n')
      .replaceAll(/<\/(p|div|tr|h[1-6]|li|table)>/gi, '\n'),
  );
  return tagless
    .replaceAll(/&[a-z#\d]+;/gi, (entity) => ENTITIES[entity] ?? ' ')
    .split('\n')
    .map((line) => line.replaceAll(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n')
    .trim();
}

/** Every href in compiled HTML. */
export const hrefsIn = (html: string): string[] =>
  [...html.matchAll(/<a\s[^>]*href="([^"]*)"/gi)].map((match) => match[1]);

/** Every <mj-image> in the source and whether it has alt text. */
export const imagesIn = (mjml: string): { src: string; alt: string }[] =>
  [...mjml.matchAll(/<mj-image\s([^>]*)\/?>/gi)].map((match) => ({
    src: /\bsrc="([^"]*)"/i.exec(match[1])?.[1] ?? '',
    alt: /\balt="([^"]*)"/i.exec(match[1])?.[1] ?? '',
  }));

/** A body written before the Email Studio, as MJML the studio can open and send. */
export function wrapLegacyBody(body: string): string {
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(body);
  const content = looksLikeHtml ? body : escapeHtml(body).replaceAll('\n', '<br/>');
  return `<mjml>
  <mj-body background-color="#f4f4f5">
    <mj-section background-color="#ffffff" padding="24px">
      <mj-column>
        <mj-text font-size="15px" line-height="22px">${content}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
}
