import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { guideSeen, markGuideSeen } from '../../../../../src/components/wa/list/guideSeen';

describe('whether the guide was seen', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('is remembered in this browser once marked', () => {
    expect(guideSeen()).toBe(false);
    markGuideSeen();
    expect(guideSeen()).toBe(true);
  });

  it('counts as unseen, and logs, when storage cannot be read', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
    });
    expect(guideSeen()).toBe(false);
    expect(warn).toHaveBeenCalledWith(
      'wa-demo: could not read whether the guide was seen',
      expect.any(Error),
    );
  });

  it('logs, without failing, when storage cannot be written', () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(() => markGuideSeen()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      'wa-demo: could not remember that the guide was seen',
      expect.any(Error),
    );
  });
});
