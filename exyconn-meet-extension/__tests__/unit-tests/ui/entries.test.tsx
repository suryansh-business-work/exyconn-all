import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SIGNED_OUT, installBrowserGaps, workerAnswering } from '../ui-helpers';

beforeEach(() => {
  vi.resetModules();
  installBrowserGaps();
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('page entries', () => {
  it.each([
    ['popup', '../../../src/popup/main'],
    ['options', '../../../src/options/main'],
  ])('the %s page mounts into #root', async (_name, path) => {
    workerAnswering({ 'state/get': SIGNED_OUT });
    document.body.innerHTML = '<div id="root"></div>';
    await import(path);
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it.each([['../../../src/popup/main'], ['../../../src/options/main']])(
    '%s refuses to start without #root',
    async (path) => {
      workerAnswering({});
      await expect(import(path)).rejects.toThrow('Root container #root was not found');
    },
  );
});
