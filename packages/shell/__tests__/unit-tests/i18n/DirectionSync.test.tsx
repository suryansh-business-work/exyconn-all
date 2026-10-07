import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { DirectionSync } from '@/i18n/DirectionSync';

const root = document.documentElement;

function renderIn(locale: string) {
  return render(
    <I18nProvider locale={locale} messages={{}}>
      <DirectionSync />
    </I18nProvider>,
  );
}

afterEach(() => {
  root.removeAttribute('dir');
  root.removeAttribute('lang');
});

describe('DirectionSync', () => {
  it('marks the document as left-to-right English', () => {
    const { container } = renderIn('en');
    expect(root).toHaveAttribute('dir', 'ltr');
    expect(root).toHaveAttribute('lang', 'en');
    expect(container).toBeEmptyDOMElement();
  });

  it('flips the document right-to-left for Arabic, and back when the language changes', () => {
    const { rerender } = renderIn('ar');
    expect(root).toHaveAttribute('dir', 'rtl');
    expect(root).toHaveAttribute('lang', 'ar');

    rerender(
      <I18nProvider locale="fr" messages={{}}>
        <DirectionSync />
      </I18nProvider>,
    );
    expect(root).toHaveAttribute('dir', 'ltr');
    expect(root).toHaveAttribute('lang', 'fr');
  });

  it('does nothing where there is no document element to mark', () => {
    const { rerender } = renderIn('en');
    Object.defineProperty(document, 'documentElement', { configurable: true, get: () => null });
    try {
      rerender(
        <I18nProvider locale="ar" messages={{}}>
          <DirectionSync />
        </I18nProvider>,
      );
    } finally {
      Reflect.deleteProperty(document, 'documentElement');
    }
    expect(root).toHaveAttribute('dir', 'ltr');
    expect(root).toHaveAttribute('lang', 'en');
  });
});
