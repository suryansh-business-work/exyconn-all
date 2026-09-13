import { DEFAULT_FORMAT_SETTINGS, type FormatSettings } from './format';

/**
 * The settings in force right now, for code a React context cannot reach.
 *
 * A screen should take its formatters from `useFormatters()`. Some code that renders money
 * is not a component and never can be — an ag-grid column model built at module scope, a
 * tile's value computed in a plain function — and it still has to write the company's own
 * currency rather than a hardcoded one. `I18nProvider` publishes here whenever the settings
 * change, and `formatMoney` reads it.
 */
let active: FormatSettings = DEFAULT_FORMAT_SETTINGS;

export function setActiveFormatSettings(settings: FormatSettings): void {
  active = settings;
}

/** The workspace's current settings — its locale, zone, patterns and money. */
export function activeFormatSettings(): FormatSettings {
  return active;
}
