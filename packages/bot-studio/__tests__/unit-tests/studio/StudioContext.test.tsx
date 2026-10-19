import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStudio } from '../../../src/studio/StudioContext';
import { createWrapper } from '../test-utils';

describe('useStudio', () => {
  it('refuses to run outside a StudioProvider', () => {
    expect(() => renderHook(() => useStudio())).toThrow(
      'The bot studio screens must sit inside a StudioProvider.',
    );
  });

  it("returns the host's config", () => {
    const { result } = renderHook(() => useStudio(), {
      wrapper: createWrapper({ studio: { channel: 'website', name: 'Website chat' } }),
    });
    expect(result.current).toMatchObject({ channel: 'website', name: 'Website chat' });
  });
});
