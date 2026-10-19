import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import {
  avatarSources,
  faviconUrl,
  safeImageUrl,
} from '../../../../../src/records/detail/avatar/avatarSources';
import { loadFirstImage } from '../../../../../src/records/detail/avatar/useFirstLoadedImage';
import { RecordAvatar } from '../../../../../src/records/detail';
import { renderWithProviders } from '../../../test-utils';

/** Sources that load in this fake browser; anything else errors. */
const loads = new Set<string>();
/** Every image the code asked for, in order, to settle by hand. */
let requested: FakeImage[] = [];

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private value = '';
  get src() {
    return this.value;
  }
  set src(next: string) {
    this.value = next;
    requested.push(this);
  }
  settle() {
    if (loads.has(this.value)) {
      this.onload?.();
    } else {
      this.onerror?.();
    }
  }
}

/** Settles each image as it is asked for, until no new one is waiting. */
function settleAll() {
  for (let index = 0; index < requested.length; index += 1) {
    requested[index].settle();
  }
}

beforeEach(() => {
  loads.clear();
  requested = [];
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const FAVICON = 'https://www.google.com/s2/favicons?domain=acme.io&sz=64';

describe('avatar sources', () => {
  it('keeps only https image addresses', () => {
    expect(safeImageUrl(' https://cdn.test/logo.png ')).toBe('https://cdn.test/logo.png');
    expect(safeImageUrl('http://cdn.test/logo.png')).toBe('');
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('not a url')).toBe('');
    expect(safeImageUrl('')).toBe('');
  });

  it('builds a favicon only for a valid bare domain', () => {
    expect(faviconUrl(' Acme.IO ')).toBe(FAVICON);
    expect(faviconUrl('https://acme.io/path')).toBe('');
    expect(faviconUrl('acme')).toBe('');
    expect(faviconUrl('acme.io"><script>')).toBe('');
    expect(faviconUrl('')).toBe('');
  });

  it('tries the logo first, then the favicon, skipping what is unsafe', () => {
    expect(avatarSources('https://cdn.test/logo.png', 'acme.io')).toEqual([
      'https://cdn.test/logo.png',
      FAVICON,
    ]);
    expect(avatarSources('http://cdn.test/logo.png', 'acme.io')).toEqual([FAVICON]);
    expect(avatarSources('', '')).toEqual([]);
  });
});

describe('loadFirstImage', () => {
  it('moves past a source that fails to the next one that loads', () => {
    loads.add('https://b.test/2.png');
    const onDone = vi.fn();
    loadFirstImage(['https://a.test/1.png', 'https://b.test/2.png'], onDone);
    settleAll();
    expect(requested.map((image) => image.src)).toEqual([
      'https://a.test/1.png',
      'https://b.test/2.png',
    ]);
    expect(onDone).toHaveBeenCalledWith('https://b.test/2.png');
  });

  it('reports nothing loaded when every source fails', () => {
    const onDone = vi.fn();
    loadFirstImage(['https://a.test/1.png'], onDone);
    settleAll();
    expect(onDone).toHaveBeenCalledWith('');
  });

  it('drops an answer that arrives after it was cancelled', () => {
    loads.add('https://a.test/1.png');
    const onDone = vi.fn();
    const cancel = loadFirstImage(['https://a.test/1.png'], onDone);
    cancel();
    settleAll();
    expect(onDone).not.toHaveBeenCalled();
  });
});

describe('RecordAvatar', () => {
  it('shows the initials until the logo has loaded, then the logo', () => {
    loads.add('https://cdn.test/logo.png');
    const { container } = renderWithProviders(
      <RecordAvatar name="Acme Corp" src="https://cdn.test/logo.png" domain="acme.io" />,
    );
    expect(screen.getByText('AC')).toBeInTheDocument();
    act(settleAll);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.test/logo.png');
  });

  it('falls back to the favicon when the logo is broken', () => {
    loads.add(FAVICON);
    const { container } = renderWithProviders(
      <RecordAvatar name="Acme" src="https://cdn.test/broken.png" domain="acme.io" />,
    );
    act(settleAll);
    expect(container.querySelector('img')).toHaveAttribute('src', FAVICON);
  });

  it('keeps the initials, never a broken image, when nothing loads', () => {
    const { container } = renderWithProviders(
      <RecordAvatar name="Asha Rao" src="https://cdn.test/broken.png" domain="nope.test" />,
    );
    act(settleAll);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('AR')).toBeInTheDocument();
  });

  it('asks for nothing without a picture or domain', () => {
    renderWithProviders(<RecordAvatar name="Asha" src="" />);
    expect(requested).toHaveLength(0);
    expect(screen.getByText('A')).toBeInTheDocument();
  });
});
