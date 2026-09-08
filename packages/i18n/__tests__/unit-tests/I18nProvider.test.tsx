import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useI18n, useT } from '../../src/I18nProvider';
import { useFormatters } from '../../src/useFormatters';

/** Renders one translated string plus what the provider resolved around it. */
function Probe() {
  const t = useT();
  const { locale, direction } = useI18n();
  const { formatDate, formatNumber } = useFormatters();
  return (
    <div>
      <span data-testid="text">{t('Save changes')}</span>
      <span data-testid="locale">{locale}</span>
      <span data-testid="direction">{direction}</span>
      <span data-testid="date">{formatDate('2025-12-31T20:30:00.000Z')}</span>
      <span data-testid="number">{formatNumber(1234567)}</span>
    </div>
  );
}

const BERLIN = {
  timezone: 'Europe/Berlin',
  dateFormat: 'dd.MM.yyyy',
  timeFormat: 'HH:mm',
  currency: 'EUR',
};

describe('I18nProvider', () => {
  it('translates through the messages it was given', () => {
    render(
      <I18nProvider locale="de-DE" messages={{ 'Save changes': 'Änderungen speichern' }}>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('text')).toHaveTextContent('Änderungen speichern');
  });

  it('renders the English source when the locale has no translation yet', () => {
    render(
      <I18nProvider locale="de-DE" messages={{}}>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('text')).toHaveTextContent('Save changes');
  });

  it('reports what it could not translate, so the locale can fill itself in', () => {
    const onMissing = vi.fn();

    render(
      <I18nProvider locale="de-DE" messages={{}} onMissing={onMissing}>
        <Probe />
      </I18nProvider>,
    );

    expect(onMissing).toHaveBeenCalledWith('Save changes');
  });

  it('resolves the script direction from the locale', () => {
    render(
      <I18nProvider locale="ar-EG" messages={{}}>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('direction')).toHaveTextContent('rtl');
  });

  it('binds the formatters to the same locale and zone', () => {
    render(
      <I18nProvider locale="de-DE" messages={{}} settings={BERLIN}>
        <Probe />
      </I18nProvider>,
    );

    expect(screen.getByTestId('date')).toHaveTextContent('31.12.2025');
    expect(screen.getByTestId('number')).toHaveTextContent('1.234.567');
  });

  it('falls back to English and UTC outside any provider', () => {
    render(<Probe />);

    expect(screen.getByTestId('text')).toHaveTextContent('Save changes');
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('direction')).toHaveTextContent('ltr');
  });
});
