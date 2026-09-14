import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { FormActions } from '@/components/form/FormActions';
import { CrudFormPage } from '@/components/data/CrudFormPage';

/**
 * The chrome is what every screen of every portal shows, so it is the first thing that has to
 * speak the reader's language. These assert the wiring, not the wording: given a translation,
 * the component shows it instead of the English it was written in.
 */
const GERMAN = {
  Cancel: 'Abbrechen',
  Create: 'Anlegen',
  Update: 'Aktualisieren',
  'Saving…': 'Wird gespeichert…',
  Back: 'Zurück',
};

const inGerman = (ui: React.ReactNode) =>
  render(
    <I18nProvider locale="de-DE" messages={GERMAN}>
      {ui}
    </I18nProvider>,
  );

describe('the shared chrome in another language', () => {
  it('labels the form footer in it', () => {
    inGerman(<FormActions submitting={false} isEdit={false} onCancel={() => {}} />);

    expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Anlegen' })).toBeDefined();
  });

  it('says "update" when the record already exists, and "saving" while it saves', () => {
    const { rerender } = inGerman(<FormActions submitting={false} isEdit onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: 'Aktualisieren' })).toBeDefined();

    rerender(
      <I18nProvider locale="de-DE" messages={GERMAN}>
        <FormActions submitting isEdit onCancel={() => {}} />
      </I18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Wird gespeichert…' })).toBeDefined();
  });

  it('keeps a label the page chose over the translated default', () => {
    inGerman(
      <FormActions submitting={false} isEdit={false} onCancel={() => {}} submitLabel="Send" />,
    );

    expect(screen.getByRole('button', { name: 'Send' })).toBeDefined();
  });

  it('translates the way back out of a form', () => {
    inGerman(
      <CrudFormPage title="Risiko" onBack={() => {}}>
        <div />
      </CrudFormPage>,
    );

    expect(screen.getByRole('button', { name: 'Zurück' })).toBeDefined();
  });

  it('falls back to the English it was written in when a string has no translation', () => {
    render(
      <I18nProvider locale="de-DE" messages={{}}>
        <FormActions submitting={false} isEdit={false} onCancel={() => {}} />
      </I18nProvider>,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDefined();
  });
});
