// @vitest-environment jsdom
import { act, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Messages } from '@exyconn/i18n';
import useTrackerTranslations from '../../../../src/renderer/i18n/useTrackerTranslations';
import { logger } from '../../../../src/renderer/logger';
import { deferred, render, rerender, stubTracker, unmountAll } from '../../test-utils';

vi.mock('../../../../src/renderer/logger', () => ({ logger: { error: vi.fn() } }));

interface Translations {
  messages: Messages;
  report: (source: string) => void;
}

let latest: Translations | null = null;

function Probe({ locale }: Readonly<{ locale: string }>): ReactElement {
  latest = useTrackerTranslations(locale);
  return <span />;
}

function current(): Translations {
  if (latest === null) {
    throw new Error('Probe not rendered');
  }
  return latest;
}

/** Runs the clock forward and lets the promises it releases land. */
async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

const getTranslations = vi.fn((_locale: string) => Promise.resolve<Messages>({}));
const translateMissing = vi.fn((_locale: string, _sources: string[]) =>
  Promise.resolve<Messages>({}),
);

function install(): void {
  stubTracker({ getTranslations, translateMissing });
}

beforeEach(() => {
  // Only the batching timeout; React's own scheduling stays on real timers.
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  getTranslations.mockReset();
  getTranslations.mockResolvedValue({});
  translateMissing.mockReset();
  translateMissing.mockResolvedValue({});
  vi.mocked(logger.error).mockClear();
});

afterEach(() => {
  unmountAll();
  vi.useRealTimers();
  latest = null;
});

describe('useTrackerTranslations', () => {
  it('starts in English and swaps to the catalogue once it lands', async () => {
    getTranslations.mockResolvedValue({ Start: 'Iniciar' });
    install();
    await render(<Probe locale="es" />);
    expect(getTranslations).toHaveBeenCalledWith('es');
    await advance(0);
    expect(current().messages).toEqual({ Start: 'Iniciar' });
  });

  it('starts over on a language change, ignoring the old language’s late catalogue', async () => {
    const spanish = deferred<Messages>();
    getTranslations
      .mockReturnValueOnce(spanish.promise)
      .mockResolvedValueOnce({ Start: 'Démarrer' });
    install();
    await render(<Probe locale="es" />);
    await rerender(<Probe locale="fr" />);
    spanish.resolve({ Start: 'Iniciar' });
    await advance(0);
    expect(current().messages).toEqual({ Start: 'Démarrer' });
  });

  it('logs a catalogue that cannot be read and stays in English', async () => {
    getTranslations.mockRejectedValue(new Error('Offline'));
    install();
    await render(<Probe locale="es" />);
    await advance(0);
    expect(current().messages).toEqual({});
    expect(logger.error).toHaveBeenCalledWith('Could not load translations', expect.any(Error));
  });

  it('batches misses for 400ms, asks once per string, and merges what comes back', async () => {
    getTranslations.mockResolvedValue({ Start: 'Iniciar' });
    translateMissing.mockResolvedValue({ Stop: 'Detener' });
    install();
    await render(<Probe locale="es" />);
    await advance(0);
    act(() => {
      current().report('Stop');
      current().report('Pause');
      current().report('Stop');
    });
    await advance(399);
    expect(translateMissing).not.toHaveBeenCalled();
    await advance(1);
    expect(translateMissing).toHaveBeenCalledTimes(1);
    expect(translateMissing).toHaveBeenCalledWith('es', ['Stop', 'Pause']);
    expect(current().messages).toEqual({ Start: 'Iniciar', Stop: 'Detener' });

    act(() => current().report('Pause'));
    await advance(400);
    expect(translateMissing).toHaveBeenCalledTimes(1);
  });

  it('keeps the catalogue as it is when the portal fills in nothing', async () => {
    getTranslations.mockResolvedValue({ Start: 'Iniciar' });
    install();
    await render(<Probe locale="es" />);
    await advance(0);
    const before = current().messages;
    act(() => current().report('Untranslatable'));
    await advance(400);
    expect(translateMissing).toHaveBeenCalledWith('es', ['Untranslatable']);
    expect(current().messages).toBe(before);
  });

  it('never asks about more than 50 strings in one batch', async () => {
    install();
    await render(<Probe locale="es" />);
    act(() => {
      for (let index = 0; index < 60; index += 1) {
        current().report(`String ${index}`);
      }
    });
    await advance(400);
    const [, sources] = translateMissing.mock.calls[0];
    expect(sources).toHaveLength(50);
    expect(sources[0]).toBe('String 0');
    expect(sources.at(-1)).toBe('String 49');
  });

  it('logs a batch the portal could not translate', async () => {
    translateMissing.mockRejectedValue(new Error('Offline'));
    install();
    await render(<Probe locale="es" />);
    act(() => current().report('Stop'));
    await advance(400);
    expect(logger.error).toHaveBeenCalledWith('Could not translate new strings', expect.any(Error));
  });

  it('sends nothing for misses collected under a language that has since changed', async () => {
    install();
    await render(<Probe locale="es" />);
    act(() => current().report('Stop'));
    await rerender(<Probe locale="fr" />);
    await advance(400);
    expect(translateMissing).not.toHaveBeenCalled();
  });

  it('cancels a pending batch when the app closes', async () => {
    install();
    await render(<Probe locale="es" />);
    act(() => current().report('Stop'));
    unmountAll();
    await advance(400);
    expect(translateMissing).not.toHaveBeenCalled();
  });

  it('closes cleanly with nothing pending', async () => {
    install();
    await render(<Probe locale="es" />);
    unmountAll();
    await advance(400);
    expect(translateMissing).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});
