import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { NotificationProvider, useNotify } from '@/components/feedback/NotificationProvider';
import { ConfirmProvider, useConfirm } from '@/components/feedback/ConfirmProvider';
import { PageHeader } from '@/components/layout/PageHeader';

/**
 * A sentence that names a record has to reach the catalogue as its TEMPLATE. Built by hand —
 * a template literal, or `t()` before it gets here — it is a new sentence for every record,
 * which misses and is sent off to be translated as a string nobody will ever see twice.
 */
const GERMAN = {
  'Invoice {number} drafted': 'Rechnung {number} angelegt',
  'Delete "{name}"?': '„{name}“ löschen?',
  'Hello, {name}': 'Hallo, {name}',
};

function Toast() {
  const notify = useNotify();
  useEffect(() => {
    notify('Invoice {number} drafted', 'success', { number: 'INV-0042' });
  }, [notify]);
  return null;
}

function Prompt() {
  const confirm = useConfirm();
  useEffect(() => {
    confirm({ message: 'Delete "{name}"?', messageValues: { name: 'Acme' } }).catch(() => {});
  }, [confirm]);
  return null;
}

describe('messages with a value in them', () => {
  it('looks up the template, not the finished sentence, and fills the value in after', () => {
    const onMissing = vi.fn();
    render(
      <I18nProvider locale="de-DE" messages={GERMAN} onMissing={onMissing}>
        <NotificationProvider>
          <Toast />
        </NotificationProvider>
      </I18nProvider>,
    );

    expect(screen.getByText('Rechnung INV-0042 angelegt')).toBeDefined();
    // The record's own number never reaches the catalogue as a source string.
    expect(onMissing).not.toHaveBeenCalledWith(expect.stringContaining('INV-0042'));
  });

  it('does the same for a confirmation that names what it will delete', () => {
    render(
      <I18nProvider locale="de-DE" messages={GERMAN}>
        <ConfirmProvider>
          <Prompt />
        </ConfirmProvider>
      </I18nProvider>,
    );

    expect(screen.getByText('„Acme“ löschen?')).toBeDefined();
  });

  it('greets a person without making their name a key', () => {
    const onMissing = vi.fn();
    render(
      <I18nProvider locale="de-DE" messages={GERMAN} onMissing={onMissing}>
        <PageHeader title="Hello, {name}" titleValues={{ name: 'Priya' }} />
      </I18nProvider>,
    );

    expect(screen.getByText('Hallo, Priya')).toBeDefined();
    expect(onMissing).not.toHaveBeenCalledWith(expect.stringContaining('Priya'));
  });
});
