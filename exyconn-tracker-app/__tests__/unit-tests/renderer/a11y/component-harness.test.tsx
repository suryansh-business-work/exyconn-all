// @vitest-environment jsdom
import type { ReactElement } from 'react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  button,
  buttonNamed,
  click,
  deferred,
  errorText,
  finish,
  flush,
  isLoading,
  overrideTracker,
  press,
  render,
  rerender,
  stubTracker,
  typeInto,
  unmountAll,
} from '../../../../src/renderer/a11y/component-harness';
import { installTracker, trackerState } from '../../../../src/renderer/a11y/tracker-fixture';

afterEach(unmountAll);

/** A button that runs `work`, flags itself busy meanwhile and shows the outcome. */
function Saver({ work }: Readonly<{ work: () => Promise<void> }>): ReactElement {
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState('');
  const run = (): void => {
    setBusy(true);
    work()
      .then(() => setOutcome('saved'))
      .catch((cause: Error) => setOutcome(cause.message))
      .finally(() => setBusy(false));
  };
  return (
    <div>
      <button type="button" className={busy ? 'MuiButton-loading' : ''} onClick={run}>
        Save changes
      </button>
      <output>{outcome}</output>
    </div>
  );
}

function Field(): ReactElement {
  const [value, setValue] = useState('');
  return (
    <div>
      <input aria-label="Note" value={value} onChange={(event) => setValue(event.target.value)} />
      <output>{value}</output>
    </div>
  );
}

function output(): string | null | undefined {
  return document.querySelector('output')?.textContent;
}

describe('stubTracker and overrideTracker', () => {
  it('stubTracker installs exactly the stand-in it is given', async () => {
    stubTracker({ getAppVersion: () => Promise.resolve('2.0.0') });
    await expect(window.tracker.getAppVersion()).resolves.toBe('2.0.0');
  });

  it('overrideTracker swaps the chosen commands and keeps the rest of the fixture', async () => {
    const state = trackerState('idle');
    installTracker(state);
    overrideTracker({ getAppVersion: () => Promise.resolve('3.1.4') });
    await expect(window.tracker.getAppVersion()).resolves.toBe('3.1.4');
    await expect(window.tracker.getState()).resolves.toBe(state);
  });
});

describe('render, rerender and unmountAll', () => {
  it('renders, re-renders with new props and clears the document', async () => {
    await render(<p>first</p>);
    expect(document.body.textContent).toBe('first');
    await rerender(<p>second</p>);
    expect(document.body.textContent).toBe('second');
    unmountAll();
    expect(document.body.innerHTML).toBe('');
  });
});

describe('finding buttons', () => {
  it('button matches on visible text or on the aria-label', async () => {
    await render(
      <div>
        <button type="button">Save changes</button>
        <button type="button" aria-label="Close dialog">
          x
        </button>
      </div>,
    );
    expect(button('Save').textContent).toBe('Save changes');
    expect(button('Close').getAttribute('aria-label')).toBe('Close dialog');
  });

  it('button throws when nothing matches', async () => {
    await render(<button type="button">Save</button>);
    expect(() => button('Delete')).toThrow('No button named "Delete"');
  });

  it('buttonNamed needs the whole trimmed text', async () => {
    await render(
      <div>
        <button type="button">Save changes</button>
        <button type="button"> Save </button>
      </div>,
    );
    expect(buttonNamed('Save').textContent).toBe(' Save ');
  });
});

describe('click, press, finish and isLoading', () => {
  it('click waits for the work it started', async () => {
    await render(<Saver work={() => Promise.resolve()} />);
    await click(button('Save'));
    expect(output()).toBe('saved');
    expect(isLoading(button('Save'))).toBe(false);
  });

  it('press leaves the work in flight so the loader can be seen, finish lands it', async () => {
    const pending = deferred();
    await render(<Saver work={() => pending.promise} />);
    await press(button('Save'));
    expect(isLoading(button('Save'))).toBe(true);
    await finish(() => pending.resolve());
    expect(isLoading(button('Save'))).toBe(false);
    expect(output()).toBe('saved');
  });

  it('a deferred can also be rejected by hand', async () => {
    const pending = deferred();
    await render(<Saver work={() => pending.promise} />);
    await press(button('Save'));
    await finish(() => pending.reject(new Error('Offline')));
    expect(output()).toBe('Offline');
  });
});

describe('deferred', () => {
  it('resolves with the value handed to resolve', async () => {
    const pending = deferred<number>();
    pending.resolve(42);
    await expect(pending.promise).resolves.toBe(42);
  });

  it('rejects with the cause handed to reject', async () => {
    const pending = deferred<string>();
    pending.reject(new Error('nope'));
    await expect(pending.promise).rejects.toThrow('nope');
  });
});

describe('errorText', () => {
  it('is undefined when no error alert is showing', async () => {
    await render(<p>All good</p>);
    expect(errorText()).toBeUndefined();
  });

  it('reads the text of the error alert', async () => {
    await render(<div className="MuiAlert-colorError">Sync failed</div>);
    expect(errorText()).toBe('Sync failed');
  });
});

describe('typeInto and flush', () => {
  it('types into a controlled input so its onChange fires', async () => {
    await render(<Field />);
    const input = document.querySelector<HTMLInputElement>('input');
    expect(input).not.toBeNull();
    if (input !== null) {
      await typeInto(input, 'Lunch break');
    }
    await flush();
    expect(output()).toBe('Lunch break');
    expect(input?.value).toBe('Lunch break');
  });
});
