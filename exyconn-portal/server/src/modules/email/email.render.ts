/**
 * Turning an authored template into markup.
 *
 * Two placeholder forms, both deliberately dumb — this is a copy tool for the people who
 * write the emails, not a programming language embedded in the portal:
 *
 *   {{variable}}       substituted with a value the caller supplies
 *   {{> fragment-key}} replaced with a stored fragment's MJML
 *
 * There is no logic, no loops and no expressions. Anything that needs a decision is decided
 * in the code that calls `send` and passed in as a finished string, so a template can never
 * become a thing only a developer can safely edit.
 */

/** `{{ name }}` — a value the caller supplies. Not `{{> …}}`, which is a fragment. */
const VARIABLE = /\{\{\s*(?!>)([\w.]+)\s*\}\}/g;

/** `{{> header }}` — a stored fragment. */
const FRAGMENT = /\{\{\s*>\s*([\w-]+)\s*\}\}/g;

/** How deep fragments may include other fragments before we call it a loop. */
const MAX_FRAGMENT_DEPTH = 5;

/** Raised when a template cannot be rendered. Never send a half-substituted email. */
export class EmailRenderError extends Error {}

/** Every `{{variable}}` a piece of markup asks for, de-duplicated, in first-seen order. */
export function variablesIn(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(VARIABLE)) {
    found.add(match[1]);
  }
  return [...found];
}

/** Every `{{> fragment}}` a piece of markup pulls in. */
export function fragmentsIn(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(FRAGMENT)) {
    found.add(match[1]);
  }
  return [...found];
}

/**
 * Expands fragment includes, depth-first.
 *
 * The depth cap is what stops a fragment that includes itself — directly or through a
 * second one — from hanging the send. A template nobody can render is a bug to be told
 * about, not a request that never returns.
 */
export function expandFragments(
  source: string,
  fragments: ReadonlyMap<string, string>,
  depth = 0,
): string {
  if (depth > MAX_FRAGMENT_DEPTH) {
    throw new EmailRenderError('Fragments are nested too deeply, or include each other in a loop.');
  }

  return source.replaceAll(FRAGMENT, (_match, key: string) => {
    const fragment = fragments.get(key);
    if (fragment === undefined) {
      throw new EmailRenderError(`This template uses a fragment that does not exist: ${key}`);
    }
    return expandFragments(fragment, fragments, depth + 1);
  });
}

/**
 * Substitutes the caller's values.
 *
 * A missing value is an error, never an empty string and never the raw `{{name}}` left in
 * place. Both of those have been emailed to real customers by real systems; refusing to
 * render is the only behaviour that cannot embarrass somebody.
 */
export function substitute(source: string, variables: Readonly<Record<string, string>>): string {
  const missing: string[] = [];

  const rendered = source.replaceAll(VARIABLE, (_match, name: string) => {
    const value = variables[name];
    if (value === undefined || value === null) {
      missing.push(name);
      return '';
    }
    return String(value);
  });

  if (missing.length > 0) {
    throw new EmailRenderError(
      `Missing value${missing.length === 1 ? '' : 's'} for: ${[...new Set(missing)].join(', ')}`,
    );
  }
  return rendered;
}

export interface RenderInput {
  subject: string;
  mjml: string;
  fragments: ReadonlyMap<string, string>;
  variables: Readonly<Record<string, string>>;
}

/** Fragments first, then values — so a fragment can carry placeholders of its own. */
export function renderTemplate(input: RenderInput): { subject: string; mjml: string } {
  const expanded = expandFragments(input.mjml, input.fragments);
  return {
    subject: substitute(input.subject, input.variables),
    mjml: substitute(expanded, input.variables),
  };
}
