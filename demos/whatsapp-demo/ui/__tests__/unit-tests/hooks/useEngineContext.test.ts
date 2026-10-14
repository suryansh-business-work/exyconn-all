import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DemoUser } from '@exyconn/wa-flow/engine';
import { useEngineContext } from '../../../src/hooks/useEngineContext';
import { REDUCED_MOTION, stubMatchMedia } from '../media';
import { renderHookWithProviders } from '../test-utils';

const asha: DemoUser = {
  firstName: 'Asha',
  fullName: 'Asha Nair',
  email: 'asha@example.com',
  phone: '',
};
const ravi: DemoUser = {
  firstName: 'Ravi',
  fullName: 'Ravi Kumar',
  email: 'ravi@example.com',
  phone: '',
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useEngineContext', () => {
  it('hands the engine the viewer, translations, formatters and full typing delays', () => {
    const { result } = renderHookWithProviders(() => useEngineContext(asha, true), {
      messages: { 'Main menu': 'Menú principal' },
    });
    const context = result.current();
    expect(context.user).toBe(asha);
    expect(context.ai).toBe(true);
    expect(context.t('Main menu')).toBe('Menú principal');
    expect(context.format.money(100)).toBe('₹100');
    expect(context.typingScale).toBe(1);
  });

  it('shortens typing delays when the viewer asked for less motion', () => {
    stubMatchMedia(REDUCED_MOTION);
    const { result } = renderHookWithProviders(() => useEngineContext(asha, false));
    expect(result.current().typingScale).toBe(0.4);
  });

  it('reads the clock at the moment of each event', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_000);
    const { result } = renderHookWithProviders(() => useEngineContext(asha, false));
    expect(result.current().now).toBe(1_000);
    vi.setSystemTime(5_000);
    expect(result.current().now).toBe(5_000);
  });

  it('keeps one getter that always reads the latest viewer and AI setting', () => {
    let props = { user: asha, ai: false };
    const { result, rerender } = renderHookWithProviders(() =>
      useEngineContext(props.user, props.ai),
    );
    const getter = result.current;
    props = { user: ravi, ai: true };
    rerender();
    expect(result.current).toBe(getter);
    expect(getter()).toMatchObject({ user: ravi, ai: true });
  });
});
