import { COMPONENT_TAG, componentPlaceholder, fragmentPlaceholder } from '@exyconn/cms';

/** The props a placeholder's `data-props` holds, or null when they are not a JSON object. */
export function parseProps(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== 'string' || raw.trim() === '') {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Reported below: the placeholder is written back as it was, and compiling it fails loudly.
  }
  return null;
}

const escapeAttribute = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

/**
 * A component as @exyconn/cms reads it. Valid props go through its own `componentPlaceholder`,
 * so the editor and the seed write the same bytes; props that are not valid JSON are kept as
 * they were, so publishing reports them instead of the editor quietly dropping them.
 */
export function componentHtml(key: string, rawProps: unknown, childrenHtml: string): string {
  const props = parseProps(rawProps);
  if (props) {
    return componentPlaceholder(key, props, childrenHtml);
  }
  const raw = escapeAttribute(String(rawProps));
  const safeKey = escapeAttribute(key);
  return `<${COMPONENT_TAG} data-key="${safeKey}" data-props="${raw}">${childrenHtml}</${COMPONENT_TAG}>`;
}

export const fragmentHtml = (fragmentId: string): string => fragmentPlaceholder(fragmentId);

/** `html` with every `<...>` run replaced by a space (a scan: the regex form is quadratic). */
function stripTags(html: string): string {
  let out = '';
  let copied = 0;
  let open = html.indexOf('<');
  while (open >= 0) {
    const close = html.indexOf('>', open + 1);
    if (close < 0) {
      break;
    }
    out += `${html.slice(copied, open)} `;
    copied = close + 1;
    open = html.indexOf('<', copied);
  }
  return out + html.slice(copied);
}

const MAX_VALUE = 48;

function describe(value: unknown): string | null {
  if (typeof value === 'string') {
    const text = stripTags(value).replaceAll(/\s+/g, ' ').trim();
    if (text === '') return null;
    return text.length > MAX_VALUE ? `${text.slice(0, MAX_VALUE)}…` : text;
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

/** A line or two about a component's props, for its card on the canvas. */
export function propsSummary(props: Record<string, unknown> | null): string {
  if (!props) {
    return 'Settings are not valid JSON: open the settings to fix them.';
  }
  const parts: string[] = [];
  for (const [key, value] of Object.entries(props)) {
    const text = describe(value);
    if (text) parts.push(`${key}: ${text}`);
    if (parts.length === 3) break;
  }
  return parts.length > 0 ? parts.join(' · ') : 'Default settings';
}
