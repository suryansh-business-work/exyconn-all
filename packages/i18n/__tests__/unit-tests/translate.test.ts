import { describe, expect, it, vi } from 'vitest';
import { interpolate, translate } from '../../src/translate';

describe('translating a string', () => {
  it('uses the translation when the locale has one', () => {
    expect(translate('Save', { messages: { Save: 'Speichern' } })).toBe('Speichern');
  });

  it('falls back to the English it was written as, never to a missing-key marker', () => {
    // A half-translated portal is usable; one showing `settings.save.button` is not.
    expect(translate('Save changes', { messages: {} })).toBe('Save changes');
  });

  it('reports a miss so the locale can fill itself in', () => {
    const onMissing = vi.fn();

    translate('Save changes', { messages: {}, onMissing });

    expect(onMissing).toHaveBeenCalledWith('Save changes');
  });

  it('does not report a string it already has', () => {
    const onMissing = vi.fn();

    translate('Save', { messages: { Save: 'Speichern' }, onMissing });

    expect(onMissing).not.toHaveBeenCalled();
  });
});

describe('placeholders', () => {
  it('substitutes values into the translation', () => {
    expect(
      translate('Hello {name}', { messages: { 'Hello {name}': 'Hallo {name}' } }, { name: 'Ada' }),
    ).toBe('Hallo Ada');
  });

  it('substitutes into the fallback too, so an untranslated string still reads', () => {
    expect(translate('Hello {name}', { messages: {} }, { name: 'Ada' })).toBe('Hello Ada');
  });

  it('leaves a placeholder with no value exactly as written', () => {
    // "Hello " hides the mistake; "Hello {name}" shows the author there is one.
    expect(interpolate('Hello {name}', { other: 'Ada' })).toBe('Hello {name}');
  });

  it('substitutes numbers as well as strings', () => {
    expect(interpolate('{count} items', { count: 3 })).toBe('3 items');
  });

  it('leaves a string with no placeholders alone', () => {
    expect(interpolate('Save changes', { name: 'Ada' })).toBe('Save changes');
  });
});
