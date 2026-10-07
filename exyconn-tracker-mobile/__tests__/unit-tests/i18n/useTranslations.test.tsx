import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTranslations } from '../../../src/i18n/useTranslations';
import { logger } from '../../../src/tracker/logger';
import { portal } from '../../../src/tracker/platform';
import { deferred } from '../hooks/deferred';

vi.mock('../../../src/tracker/platform', () => ({
  portal: { fetchTranslations: vi.fn(), translateMissing: vi.fn() },
}));
vi.mock('../../../src/tracker/logger', () => ({ logger: { error: vi.fn() } }));

/** Moves the clock and lets the portal's settled answers run. */
async function settle(ms = 0): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function render(locale = 'es') {
  return renderHook(({ language }) => useTranslations(language), {
    initialProps: { language: locale },
  });
}

describe('useTranslations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(portal.fetchTranslations).mockResolvedValue({});
    vi.mocked(portal.translateMissing).mockResolvedValue({});
  });

  it('renders in English at once, then in the catalogue once it lands', async () => {
    vi.mocked(portal.fetchTranslations).mockResolvedValue({ Hello: 'Hola' });
    const { result } = render();
    expect(result.current.messages).toEqual({});
    await settle();
    expect(portal.fetchTranslations).toHaveBeenCalledWith('es');
    expect(result.current.messages).toEqual({ Hello: 'Hola' });
  });

  it('collects misses for 400ms and asks for them in one request', async () => {
    vi.mocked(portal.translateMissing).mockResolvedValue({ Save: 'Guardar' });
    const { result } = render();
    await settle();
    act(() => {
      result.current.report('Save');
      result.current.report('Cancel');
      result.current.report('Save');
    });
    await settle(399);
    expect(portal.translateMissing).not.toHaveBeenCalled();
    await settle(1);
    await settle();
    expect(portal.translateMissing).toHaveBeenCalledTimes(1);
    expect(portal.translateMissing).toHaveBeenCalledWith('es', ['Save', 'Cancel']);
    expect(result.current.messages).toEqual({ Save: 'Guardar' });
  });

  it('never asks about the same string twice in one run', async () => {
    const { result } = render();
    await settle();
    act(() => result.current.report('Save'));
    await settle(400);
    act(() => result.current.report('Save'));
    await settle(400);
    expect(portal.translateMissing).toHaveBeenCalledTimes(1);
  });

  it('asks about at most 50 strings at once', async () => {
    const { result } = render();
    await settle();
    const sources = Array.from({ length: 60 }, (_unused, index) => `String ${index}`);
    act(() => {
      for (const source of sources) {
        result.current.report(source);
      }
    });
    await settle(400);
    expect(portal.translateMissing).toHaveBeenCalledWith('es', sources.slice(0, 50));
  });

  it('keeps the messages as they were when the portal had nothing to add', async () => {
    vi.mocked(portal.fetchTranslations).mockResolvedValue({ Hello: 'Hola' });
    const { result } = render();
    await settle();
    const before = result.current.messages;
    act(() => result.current.report('Untranslatable'));
    await settle(400);
    await settle();
    expect(result.current.messages).toBe(before);
  });

  it('logs a catalogue or a batch that could not be loaded', async () => {
    const loadFailure = new Error('offline');
    const translateFailure = new Error('quota');
    vi.mocked(portal.fetchTranslations).mockRejectedValue(loadFailure);
    vi.mocked(portal.translateMissing).mockRejectedValue(translateFailure);
    const { result } = render();
    await settle();
    expect(logger.error).toHaveBeenCalledWith('Could not load translations', loadFailure);
    act(() => result.current.report('Save'));
    await settle(400);
    await settle();
    expect(logger.error).toHaveBeenCalledWith('Could not translate new strings', translateFailure);
  });

  it('starts over in a new language, dropping what was pending under the old one', async () => {
    const spanish = deferred<Record<string, string>>();
    vi.mocked(portal.fetchTranslations)
      .mockReturnValueOnce(spanish.promise)
      .mockResolvedValueOnce({ Hello: 'Bonjour' });
    const { result, rerender } = render();
    act(() => result.current.report('Save'));
    rerender({ language: 'fr' });
    await settle(400);
    expect(portal.translateMissing).not.toHaveBeenCalled();
    spanish.resolve({ Hello: 'Hola' });
    await settle();
    expect(portal.fetchTranslations).toHaveBeenLastCalledWith('fr');
    expect(result.current.messages).toEqual({ Hello: 'Bonjour' });
    // Asked under Spanish, but French has never been asked about it.
    act(() => result.current.report('Save'));
    await settle(400);
    expect(portal.translateMissing).toHaveBeenCalledWith('fr', ['Save']);
  });

  it('sends nothing once unmounted', async () => {
    const { result, unmount } = render();
    await settle();
    act(() => result.current.report('Save'));
    unmount();
    await settle(1000);
    expect(portal.translateMissing).not.toHaveBeenCalled();
  });
});
