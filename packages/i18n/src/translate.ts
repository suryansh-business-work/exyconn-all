/**
 * The lookup itself, with no React and no network in it.
 *
 * The English source string IS the key: there is no invented `settings.save.button`
 * vocabulary to keep in step with the screens, and a string with no translation renders as
 * the English it was written as rather than as a missing-key marker. A half-translated
 * portal is usable; one showing `settings.save.button` is not.
 */

/** Translations for one locale, keyed by the English source string. */
export type Messages = Readonly<Record<string, string>>;

/** Values substituted into a string's {placeholders}. */
export type Interpolations = Readonly<Record<string, string | number>>;

/**
 * Fills in `{name}` style placeholders.
 *
 * A placeholder with no value is left exactly as written rather than blanked: "Hello {name}"
 * shows the author that a value is missing, where "Hello " hides it.
 */
export function interpolate(text: string, values?: Interpolations): string {
  if (!values) {
    return text;
  }
  return text.replaceAll(/\{(\w+)\}/g, (whole, name: string) => {
    const value = values[name];
    return value === undefined ? whole : String(value);
  });
}

export interface TranslateOptions {
  messages: Messages;
  /** Called with any source string the messages have no entry for. */
  onMissing?: (source: string) => void;
}

/**
 * Translates one string, falling back to the source.
 *
 * `onMissing` is how a locale fills itself in: the caller batches what it reports and asks
 * the server to translate those strings, so the second person to open a screen sees it in
 * their own language without anybody having prepared a catalogue.
 */
export function translate(
  source: string,
  { messages, onMissing }: TranslateOptions,
  values?: Interpolations,
): string {
  const hit = messages[source];
  if (hit === undefined) {
    onMissing?.(source);
    return interpolate(source, values);
  }
  return interpolate(hit, values);
}
