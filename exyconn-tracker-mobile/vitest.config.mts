import { defineConfig } from 'vitest/config';

/**
 * Unit tests for the phone's pure logic — form schemas, tile and text builders. Anything that
 * imports react-native or a native module is exercised on a device, not here.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/unit-tests/**/*.test.ts'],
  },
});
