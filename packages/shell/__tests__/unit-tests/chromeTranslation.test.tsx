import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormProvider, useForm } from 'react-hook-form';
import { I18nProvider } from '@exyconn/i18n';
import { FormActions } from '@/components/form/FormActions';
import { CrudFormPage } from '@/components/data/CrudFormPage';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusChip } from '@/components/data/StatusChip';
import { RhfTextField } from '@/components/form/rhf';

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

describe('a module screen in another language', () => {
  const GERMAN_SCREEN = {
    Risks: 'Risiken',
    'What could go wrong': 'Was schiefgehen könnte',
    Owner: 'Eigentümer',
    // The chip shows the enum with its underscores opened out, so that is the key.
    'IN PROGRESS': 'In Bearbeitung',
    OPEN: 'Offen',
  };

  const screenInGerman = (ui: React.ReactNode) =>
    render(
      <I18nProvider locale="de-DE" messages={GERMAN_SCREEN}>
        {ui}
      </I18nProvider>,
    );

  it('translates the page title and its subtitle, which every screen passes as props', () => {
    screenInGerman(<PageHeader title="Risks" subtitle="What could go wrong" />);

    expect(screen.getByText('Risiken')).toBeDefined();
    expect(screen.getByText('Was schiefgehen könnte')).toBeDefined();
  });

  it('translates a stat tile label', () => {
    screenInGerman(<StatCard label="Owner" value="12" />);

    expect(screen.getByText('Eigentümer')).toBeDefined();
  });

  it('translates a status chip, which is what a list is scanned for', () => {
    screenInGerman(<StatusChip value="IN_PROGRESS" />);

    expect(screen.getByText('In Bearbeitung')).toBeDefined();
  });

  it('leaves a status the catalogue has no word for as it reads in English', () => {
    screenInGerman(<StatusChip value="ARCHIVED" />);

    expect(screen.getByText('ARCHIVED')).toBeDefined();
  });
});

describe('a form field in another language', () => {
  const GERMAN_FORM = {
    Title: 'Titel',
    'Title is required': 'Titel ist erforderlich',
    'As it appears on the invoice': 'Wie es auf der Rechnung erscheint',
  };

  /** A field needs a form context; this is the smallest one that renders. */
  function Field({ error }: Readonly<{ error?: string }>) {
    const methods = useForm({ defaultValues: { title: '' } });
    if (error) {
      methods.setError('title', { message: error });
    }
    return (
      <I18nProvider locale="de-DE" messages={GERMAN_FORM}>
        <FormProvider {...methods}>
          <RhfTextField name="title" label="Title" helperText="As it appears on the invoice" />
        </FormProvider>
      </I18nProvider>
    );
  }

  it('translates the label and the hint under it', () => {
    render(<Field />);

    expect(screen.getByLabelText('Titel')).toBeDefined();
    expect(screen.getByText('Wie es auf der Rechnung erscheint')).toBeDefined();
  });

  it('translates what the form says when the value is wrong', () => {
    render(<Field error="Title is required" />);

    expect(screen.getByText('Titel ist erforderlich')).toBeDefined();
  });
});
