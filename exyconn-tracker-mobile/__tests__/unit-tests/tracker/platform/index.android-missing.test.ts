import { describe, expect, it, vi } from 'vitest';
import { createEngineDeps } from '../../../../src/tracker/platform';
import { fakeContext } from './android-fixtures';

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<{ Platform: Record<string, unknown> }>();
  return { ...actual, Platform: { ...actual.Platform, OS: 'android' } };
});
vi.mock('../../../../src/tracker/platform/shared', () => ({ portal: { name: 'portal' } }));

describe('an Android build without the native module', () => {
  it('refuses to track rather than pretending', () => {
    expect(() => createEngineDeps(fakeContext().context)).toThrow(
      'This Android build is missing the tracker-native module.',
    );
  });
});
