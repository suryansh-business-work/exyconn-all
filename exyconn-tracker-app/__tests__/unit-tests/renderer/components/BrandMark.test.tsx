// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import BrandMark from '../../../../src/renderer/components/BrandMark';
import { render, unmountAll, withProviders } from '../../test-utils';
import { branding, pageText } from './fixtures';

afterEach(unmountAll);

const LOGO = 'https://cdn.example.com/acme.png';

function images(): HTMLImageElement[] {
  return [...document.querySelectorAll('img')];
}

describe('BrandMark', () => {
  it('sets the house name beside the tracker icon when there is no branding', async () => {
    await render(<BrandMark branding={null} />);
    expect(pageText()).toBe('Exyconn Tracker');
    expect(images()).toHaveLength(1);
    expect(images()[0].getAttribute('alt')).toBe('');
  });

  it('shows the workspace logo on the light palette, with the name only when asked', async () => {
    await render(<BrandMark branding={branding({ logoUrl: LOGO })} />);
    expect(images()[0].getAttribute('src')).toBe(LOGO);
    expect(images()[0].getAttribute('alt')).toBe('Acme Works');
    expect(pageText()).toBe('');
    unmountAll();

    await render(<BrandMark branding={branding({ logoUrl: LOGO })} showName height={18} />);
    expect(pageText()).toBe('Acme Works');
  });

  it('falls back to the typeset name when the logo cannot be loaded', async () => {
    await render(<BrandMark branding={branding({ logoUrl: LOGO })} />);
    await act(async () => images()[0].dispatchEvent(new Event('error')));
    expect(images()[0].getAttribute('src')).not.toBe(LOGO);
    expect(pageText()).toBe('Acme Works');
  });

  it('never puts the logo on the dark palette, where it may vanish', async () => {
    await render(
      withProviders(<BrandMark branding={branding({ logoUrl: LOGO })} />, { themeMode: 'dark' }),
    );
    expect(images()[0].getAttribute('src')).not.toBe(LOGO);
    expect(pageText()).toBe('Acme Works');
  });
});
