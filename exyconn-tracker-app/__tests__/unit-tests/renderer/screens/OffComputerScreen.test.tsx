// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import OffComputerScreen from '../../../../src/renderer/screens/OffComputerScreen';
import {
  button,
  clickElement,
  flush,
  installDomShims,
  render,
  stubTracker,
  unmountAll,
} from '../../test-utils';

beforeAll(installDomShims);
afterEach(() => {
  unmountAll();
  vi.restoreAllMocks();
});

const PROJECTS = [{ id: 'p1', name: 'Global Project', key: 'GLOBAL' }];

async function open(): Promise<void> {
  stubTracker({
    getManualEntries: () => Promise.resolve([]),
    getTasks: () => Promise.resolve([]),
  });
  await render(<OffComputerScreen projects={PROJECTS} timezone="UTC" />);
  await flush();
}

describe('OffComputerScreen focus', () => {
  it('does not move focus on first paint', async () => {
    const before = document.activeElement;
    await open();
    expect(document.activeElement).toBe(before);
    expect(document.querySelector('h2')?.textContent).toBe('Off-computer time');
  });

  it('takes focus to the form’s heading on the way in, and back to “Claim time” on the way out', async () => {
    await open();
    await clickElement(button('Claim time'));
    const heading = document.querySelector('h2');
    expect(heading?.textContent).toBe('Claim off-computer time');
    expect(document.activeElement).toBe(heading);
    expect(document.querySelector('form')).not.toBeNull();

    await clickElement(button('Cancel'));
    expect(document.querySelector('form')).toBeNull();
    expect(document.activeElement?.textContent).toBe('Claim time');
  });
});
