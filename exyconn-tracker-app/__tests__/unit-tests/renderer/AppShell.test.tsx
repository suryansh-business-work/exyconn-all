// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';
import AppShell from '../../../src/renderer/AppShell';
import { LiveAnnouncer } from '../../../src/renderer/a11y/LiveAnnouncer';
import { logger } from '../../../src/renderer/logger';
import {
  buttonNamed,
  cleanup,
  click,
  installDomShims,
  mount,
  trackerState,
  withProviders,
} from '../test-utils';

/** Whether the dashboard pane throws on render, so the shell's boundary can be seen at work. */
const { crash } = vi.hoisted(() => ({ crash: { value: false } }));

vi.mock('../../../src/renderer/screens/DashboardScreen', () => ({
  default: () => {
    if (crash.value) {
      throw new Error('Dashboard broke');
    }
    return <p>Dashboard pane</p>;
  },
}));

let setRoute: MockInstance;
let consoleError: MockInstance;

async function mountShell(): Promise<void> {
  const state = trackerState('idle');
  await mount(
    withProviders(
      <LiveAnnouncer>
        <AppShell state={state} />
      </LiveAnnouncer>,
    ),
    state,
  );
}

const title = () => document.querySelector('h1')?.textContent;

beforeAll(installDomShims);

beforeEach(() => {
  crash.value = false;
  setRoute = vi.spyOn(logger, 'setRoute');
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  setRoute.mockRestore();
  consoleError.mockRestore();
});

describe('AppShell', { timeout: 30_000 }, () => {
  it('opens on the dashboard and names it in the logs', async () => {
    await mountShell();

    expect(title()).toBe('Dashboard');
    expect(document.querySelector('main')?.textContent).toContain('Dashboard pane');
    expect(setRoute).toHaveBeenLastCalledWith('dashboard');
  });

  it('opens Settings from the avatar', async () => {
    await mountShell();

    await click('button[aria-label="Asha Rao, open settings"]');

    expect(title()).toBe('Settings');
    expect(setRoute).toHaveBeenLastCalledWith('settings');
  });

  it('keeps the tab bar working when a pane crashes, and lets the employee try again', async () => {
    crash.value = true;
    await mountShell();

    expect(document.querySelector('main')?.textContent).toContain('This screen hit a problem');
    expect(document.querySelector('main .MuiAlert-root')?.textContent).toContain('Dashboard broke');
    expect(document.querySelectorAll('[role="tab"]').length).toBeGreaterThan(0);

    crash.value = false;
    expect(buttonNamed('Try again').closest('main')).not.toBeNull();
    await click('main button.MuiButton-contained');

    expect(document.querySelector('main')?.textContent).toContain('Dashboard pane');
  });
});
