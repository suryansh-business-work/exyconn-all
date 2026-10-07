// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import AppFooter from '../../../../src/renderer/components/AppFooter';
import { render, unmountAll } from '../../test-utils';
import { branding } from './fixtures';

afterEach(unmountAll);

function footer(): string | null | undefined {
  return document.querySelector('footer')?.textContent;
}

describe('AppFooter', () => {
  it('composes the notice from the house name when there is no branding', async () => {
    await render(<AppFooter branding={null} />);
    expect(footer()).toBe(`© ${new Date().getFullYear()} Exyconn. All rights reserved.`);
  });

  it('prints the line the admin authored, word for word', async () => {
    await render(<AppFooter branding={branding({ copyrightText: 'Acme Works Ltd, 2026' })} />);
    expect(footer()).toBe('Acme Works Ltd, 2026');
  });
});
