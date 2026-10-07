import type { ReactElement } from 'react';
import { fireEvent } from '@testing-library/react';
import { I18nProvider, type Messages } from '@exyconn/i18n';
import { renderWithProviders } from './test-utils';

const NO_MESSAGES: Messages = {};
/** A company that keeps its books in rupees, as the admin settings would publish it. */
const RUPEE_SETTINGS = { currency: 'INR' };

/**
 * Renders a module form with the portal providers. `inRupees` puts it under an I18nProvider
 * carrying the company currency, the way PortalApp does once the settings have loaded;
 * without it the company currency is not known yet (an empty string).
 */
export function renderForm(ui: ReactElement, { inRupees = false } = {}) {
  const tree = inRupees ? (
    <I18nProvider locale="en" messages={NO_MESSAGES} settings={RUPEE_SETTINGS}>
      {ui}
    </I18nProvider>
  ) : (
    ui
  );
  return renderWithProviders(tree);
}

/** A form field's input, by the name it is bound to. */
export function field(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!input) throw new Error(`No field named ${name}`);
  return input;
}

/** Types a whole date into a MUI X date picker the way the shell's picker tests do. */
export function typeDate(name: string, value: string): void {
  fireEvent.change(field(name), { target: { value } });
}

/** Local midnight as the ISO string a date picker stores. */
export function localIso(year: number, monthIndex: number, day: number): string {
  return new Date(year, monthIndex, day).toISOString();
}
