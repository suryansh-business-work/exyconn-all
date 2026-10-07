import { isValidElement } from 'react';
import { mountPortalApp } from '@exyconn/shell/app/mount';
import { App } from '../../src/App';

vi.mock('@exyconn/shell/app/mount', () => ({ mountPortalApp: vi.fn() }));

describe('main', () => {
  it('mounts the hub App once when the entry module loads', async () => {
    await import('../../src/main');

    expect(mountPortalApp).toHaveBeenCalledTimes(1);
    const [element] = vi.mocked(mountPortalApp).mock.calls[0];
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(App);
  });
});
