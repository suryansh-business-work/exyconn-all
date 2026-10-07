import { describe, expect, it } from 'vitest';
import { unscopedNavPath } from '@/layout/PortalLayout/activeNavPath';

const SCOPED = ['/website/s'];

describe('unscopedNavPath', () => {
  it('takes the site out of a page beneath it', () => {
    expect(unscopedNavPath('/website/s/exyconn/pages', SCOPED)).toBe('/website/pages');
  });

  it('keeps everything after the site, however deep', () => {
    expect(unscopedNavPath('/website/s/exyconn/pages/home/edit', SCOPED)).toBe(
      '/website/pages/home/edit',
    );
  });

  it('matches a site with nothing after it as the module itself', () => {
    expect(unscopedNavPath('/website/s/exyconn', SCOPED)).toBe('/website');
  });

  it('leaves a path that only shares the prefix alone', () => {
    expect(unscopedNavPath('/website/sites', SCOPED)).toBe('/website/sites');
    expect(unscopedNavPath('/website/s', SCOPED)).toBe('/website/s');
  });

  it('leaves every path alone when no module is scoped', () => {
    expect(unscopedNavPath('/website/s/exyconn/pages', [])).toBe('/website/s/exyconn/pages');
  });
});
