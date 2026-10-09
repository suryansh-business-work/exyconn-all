// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  cleanup,
  click,
  installDomShims,
  mount,
  press,
  settle,
  unmount,
} from '../../../../src/renderer/a11y/render-harness';
import { trackerState } from '../../../../src/renderer/a11y/tracker-fixture';

beforeAll(installDomShims);
afterEach(cleanup);

/** Reads the app version over the bridge on mount, and counts clicks and key presses. */
function Probe(): ReactElement {
  const [version, setVersion] = useState('loading');
  const [clicks, setClicks] = useState(0);
  const [lastKey, setLastKey] = useState('none');
  useEffect(() => {
    globalThis.tracker
      .getAppVersion()
      .then(setVersion)
      .catch(() => setVersion('failed'));
  }, []);
  return (
    <div>
      <output id="version">{version}</output>
      <button
        type="button"
        id="counter"
        onClick={() => setClicks((count) => count + 1)}
        onKeyDown={(event) => setLastKey(event.key)}
      >
        {`Clicked ${clicks}`}
      </button>
      <output id="key">{lastKey}</output>
    </div>
  );
}

function text(selector: string): string | null | undefined {
  return document.querySelector(selector)?.textContent;
}

describe('installDomShims', () => {
  it('turns on the React act environment', () => {
    expect((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT).toBe(
      true,
    );
  });

  it('gives elements a scrollIntoView that does nothing', () => {
    const element = document.createElement('div');
    expect(element.scrollIntoView()).toBeUndefined();
  });

  it('answers every media query with no match and inert listeners', () => {
    const query = globalThis.matchMedia('(prefers-color-scheme: dark)');
    expect(query.matches).toBe(false);
    expect(query.media).toBe('(prefers-color-scheme: dark)');
    expect(query.addEventListener('change', () => undefined)).toBeUndefined();
    expect(query.removeEventListener('change', () => undefined)).toBeUndefined();
  });
});

describe('mount', () => {
  it('installs the fake bridge, renders into #root and settles the first reads', async () => {
    await mount(<Probe />, trackerState('idle'));
    expect(document.getElementById('root')).not.toBeNull();
    expect(text('#version')).toBe('1.0.0');
  });
});

describe('click', () => {
  it('focuses and clicks the first match, then returns it', async () => {
    await mount(<Probe />, trackerState('idle'));
    const target = await click('#counter');
    expect(target?.id).toBe('counter');
    expect(document.activeElement).toBe(target);
    expect(text('#counter')).toBe('Clicked 1');
  });
});

describe('press', () => {
  it('sends the key to whatever has focus', async () => {
    await mount(<Probe />, trackerState('idle'));
    await click('#counter');
    await press('Escape');
    expect(text('#key')).toBe('Escape');
  });

  it('sends the key to the body when nothing is focused', async () => {
    await mount(<Probe />, trackerState('idle'));
    const seen: string[] = [];
    const listener = (event: KeyboardEvent): void => {
      seen.push(event.key);
    };
    document.body.addEventListener('keydown', listener);
    await press('Tab');
    document.body.removeEventListener('keydown', listener);
    expect(seen).toEqual(['Tab']);
    expect(text('#key')).toBe('none');
  });
});

describe('settle', () => {
  it('lets chained promises land before it returns', async () => {
    const order: string[] = [];
    Promise.resolve()
      .then(() => order.push('first'))
      .then(() => order.push('second'))
      .catch(() => order.push('failed'));
    await settle();
    expect(order).toEqual(['first', 'second']);
  });
});

describe('unmount and cleanup', () => {
  it('unmount removes the screen but keeps the container', async () => {
    await mount(<Probe />, trackerState('idle'));
    unmount();
    expect(document.getElementById('root')?.childElementCount).toBe(0);
  });

  it('unmount is safe to call twice', async () => {
    await mount(<Probe />, trackerState('idle'));
    unmount();
    expect(() => unmount()).not.toThrow();
  });

  it('cleanup also clears the document', async () => {
    await mount(<Probe />, trackerState('idle'));
    cleanup();
    expect(document.body.innerHTML).toBe('');
  });
});
