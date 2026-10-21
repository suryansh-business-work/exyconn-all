import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AssistantPanel } from '../../../src/content/app/AssistantPanel';
import { ContentRoot } from '../../../src/content/app/ContentRoot';
import { FloatingApp } from '../../../src/content/app/FloatingApp';
import { FloatingIcon } from '../../../src/content/app/FloatingIcon';
import { PanelResizeHandle } from '../../../src/content/app/PanelResizeHandle';
import { ReminderBanner } from '../../../src/content/app/ReminderBanner';
import { usePanelQuery } from '../../../src/content/app/usePanelQuery';
import { useStoredValue } from '../../../src/hooks/useStoredValue';
import { DEFAULT_LAYOUT } from '../../../src/storage/layout';
import { DEFAULT_PREFS } from '../../../src/storage/prefs';
import type { WorkerState } from '../../../src/types/messages';
import { IN_CALL, render as renderMeet } from '../fixtures/meet-dom';
import {
  SIGNED_IN,
  TAB_SNAPSHOT,
  installBrowserGaps,
  testLogger,
  workerAnswering,
} from '../ui-helpers';

beforeEach(() => {
  installBrowserGaps();
  vi.stubGlobal('innerWidth', 1200);
  vi.stubGlobal('innerHeight', 800);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

function renderIcon(overrides: Partial<Parameters<typeof FloatingIcon>[0]> = {}) {
  const onToggle = vi.fn();
  const logger = testLogger();
  render(
    <FloatingIcon
      status="IDLE"
      open={false}
      panelId="p"
      layout={DEFAULT_LAYOUT}
      corner="bottom-left"
      logger={logger}
      onToggle={onToggle}
      {...overrides}
    />,
  );
  return { onToggle, logger, icon: screen.getByRole('button', { name: /Meeting assistant/ }) };
}

describe('FloatingIcon', () => {
  it.each([
    ['IDLE', 'Assistant', 'Meeting assistant: idle'],
    ['ATTENTION', 'Attention', 'Meeting assistant: needs your attention'],
    ['ACTIVE', 'Recording', 'Meeting assistant: transcribing'],
    ['PROCESSING', 'Processing', 'Meeting assistant: processing'],
    ['ERROR', 'Error', 'Meeting assistant: error'],
  ] as const)('shows %s with words, not colour alone', (status, word, label) => {
    const { icon } = renderIcon({ status });
    expect(icon).toHaveTextContent(word);
    expect(icon).toHaveAccessibleName(`${label}. open the panel`);
  });

  it("starts in its corner above Meet's controls and toggles the panel on click", async () => {
    const { icon, onToggle } = renderIcon({ open: true });
    expect(icon).toHaveStyle({ left: '16px', top: '664px' });
    expect(icon).toHaveAttribute('aria-expanded', 'true');
    expect(icon).toHaveAccessibleName('Meeting assistant: idle. collapse the panel');
    await userEvent.click(icon);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('moves with the arrow keys and saves the spot', async () => {
    const chrome = workerAnswering({});
    const { icon } = renderIcon({ layout: { ...DEFAULT_LAYOUT, iconOffset: { x: 200, y: 200 } } });
    icon.focus();
    await userEvent.keyboard('{ArrowRight}{Shift>}{ArrowUp}{/Shift}a');
    expect(icon).toHaveStyle({ left: '208px', top: '168px' });
    await waitFor(() =>
      expect(chrome.storage.sync.data.get('layout')).toEqual({
        iconOffset: { x: 208, y: 168 },
        panelWidth: 360,
      }),
    );
  });

  it('is dragged without toggling the panel, and a small wobble still counts as a click', () => {
    workerAnswering({});
    const { icon, onToggle } = renderIcon();
    fireEvent.pointerDown(icon, { pointerId: 1, clientX: 20, clientY: 670 });
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 120, clientY: 570 });
    fireEvent.pointerUp(icon, { pointerId: 1 });
    fireEvent.click(icon);
    expect(icon).toHaveStyle({ left: '116px', top: '564px' });
    expect(onToggle).not.toHaveBeenCalled();
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 500, clientY: 500 });
    fireEvent.pointerUp(icon, { pointerId: 1 });
    fireEvent.pointerDown(icon, { pointerId: 1, clientX: 120, clientY: 570 });
    fireEvent.pointerMove(icon, { pointerId: 1, clientX: 121, clientY: 571 });
    fireEvent.pointerUp(icon, { pointerId: 1 });
    fireEvent.click(icon);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('stays on screen when the window shrinks, and logs a failed save', async () => {
    const chrome = workerAnswering({});
    chrome.storage.sync.set = vi.fn(() => Promise.reject(new Error('quota')));
    const { icon, logger } = renderIcon({ corner: 'top-right' });
    expect(icon).toHaveStyle({ left: '1052px', top: '16px' });
    vi.stubGlobal('innerWidth', 600);
    act(() => {
      globalThis.dispatchEvent(new Event('resize'));
    });
    expect(icon).toHaveStyle({ left: '452px' });
    icon.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith(
        'Could not save the icon position',
        expect.any(Error),
      ),
    );
  });
});

describe('PanelResizeHandle', () => {
  it('resizes with the keys and by dragging, within limits', async () => {
    const onResize = vi.fn();
    const onCommit = vi.fn();
    const { rerender } = render(
      <PanelResizeHandle width={360} onResize={onResize} onCommit={onCommit} />,
    );
    const handle = screen.getByRole('slider', { name: 'Panel width' });
    expect(handle).toHaveAttribute('aria-valuenow', '360');
    handle.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}{Enter}');
    expect(onCommit.mock.calls).toEqual([[376], [344]]);
    fireEvent.pointerMove(handle, { clientX: 999 });
    fireEvent.pointerUp(handle);
    expect(onResize).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 400 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 2000 });
    expect(onResize).toHaveBeenLastCalledWith(560);
    rerender(<PanelResizeHandle width={560} onResize={onResize} onCommit={onCommit} />);
    fireEvent.pointerUp(handle);
    expect(onCommit).toHaveBeenLastCalledWith(560);
  });
});

describe('AssistantPanel', () => {
  it('switches tabs, collapses with Escape or the close button, and saves its width', async () => {
    const chrome = workerAnswering({ 'panel:participants': [] });
    const onClose = vi.fn();
    render(
      <AssistantPanel
        id="panel"
        layout={DEFAULT_LAYOUT}
        onClose={onClose}
        state={SIGNED_IN}
        tab={TAB_SNAPSHOT}
        prefs={DEFAULT_PREFS}
        logger={testLogger()}
      />,
    );
    expect(
      screen.getByRole('complementary', { name: 'Exyconn Meeting Assistant' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Participants' }));
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'panel-panel-participants');
    await userEvent.click(screen.getByRole('tab', { name: 'Settings' }));
    expect(screen.getByRole('button', { name: 'All settings' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Collapse the panel' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(chrome.storage.sync.data.get('layout')).toEqual({ iconOffset: null, panelWidth: 376 }),
    );
  });

  it('logs a width that could not be saved', async () => {
    const chrome = workerAnswering({});
    chrome.storage.sync.set = vi.fn(() => Promise.reject(new Error('quota')));
    const logger = testLogger();
    render(
      <AssistantPanel
        id="panel"
        layout={DEFAULT_LAYOUT}
        onClose={vi.fn()}
        state={SIGNED_IN}
        tab={TAB_SNAPSHOT}
        prefs={DEFAULT_PREFS}
        logger={logger}
      />,
    );
    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith('Could not save the panel width', expect.any(Error)),
    );
  });
});

describe('ReminderBanner', () => {
  it('sends each reminder choice and opens settings', async () => {
    const chrome = workerAnswering({});
    renderMeet(IN_CALL);
    const logger = testLogger();
    render(<ReminderBanner snoozeMinutes={15} logger={logger} />, {
      container: document.body.appendChild(document.createElement('div')),
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Meeting transcription is off.');
    await userEvent.click(screen.getByRole('button', { name: 'Remind later' }));
    await userEvent.click(screen.getByRole('button', { name: 'Snooze for 15 minutes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss for this meeting' }));
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(chrome.runtime.sendMessage.mock.calls.map(([m]) => m)).toEqual([
      { type: 'reminder/action', action: 'LATER' },
      { type: 'reminder/action', action: 'SNOOZE' },
      { type: 'reminder/action', action: 'DISMISS' },
      { type: 'options/open' },
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Open transcription controls' }));
    expect(logger.info).not.toHaveBeenCalled();
    document.querySelector('[aria-label="Activities"]')?.remove();
    await userEvent.click(screen.getByRole('button', { name: 'Open transcription controls' }));
    expect(logger.info).toHaveBeenCalledWith('Meet transcription controls not found on the page');
  });
});

describe('FloatingApp', () => {
  const state = (overrides: Partial<WorkerState['tab']> = {}): WorkerState => ({
    ...SIGNED_IN,
    tab: { ...TAB_SNAPSHOT, ...overrides },
  });

  it('renders nothing until the worker knows the tab', async () => {
    const chrome = workerAnswering({ 'state/get': { ...SIGNED_IN, tab: null } });
    const { container } = render(<FloatingApp prefs={DEFAULT_PREFS} logger={testLogger()} />);
    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the icon, opens and closes the panel, and follows worker broadcasts', async () => {
    const chrome = workerAnswering({ 'state/get': state() });
    render(<FloatingApp prefs={DEFAULT_PREFS} logger={testLogger()} />);
    const icon = await screen.findByRole('button', { name: /Meeting assistant: idle/ });
    await userEvent.click(icon);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse the panel' }));
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(icon).toHaveFocus();
    act(() => {
      chrome.runtime.onMessage.emit(
        { type: 'state/changed', state: state({ iconStatus: 'ACTIVE', reminderBanner: true }) },
        {},
        vi.fn(),
      );
      chrome.runtime.onMessage.emit({ type: 'other' }, {}, vi.fn());
    });
    expect(screen.getByRole('button', { name: /transcribing/ })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('opens on join when the user asked, starts expanded when chosen, and can hide the icon', async () => {
    workerAnswering({ 'state/get': state() });
    const { unmount } = render(
      <FloatingApp
        prefs={{ ...DEFAULT_PREFS, autoOpenPanel: true, showFloatingIcon: false }}
        logger={testLogger()}
      />,
    );
    expect(await screen.findByRole('complementary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Meeting assistant/ })).toBeNull();
    unmount();
    workerAnswering({ 'state/get': state({ meetingState: 'WAITING' }) });
    render(
      <FloatingApp
        prefs={{ ...DEFAULT_PREFS, defaultPanelState: 'expanded' }}
        logger={testLogger()}
      />,
    );
    expect(await screen.findByRole('complementary')).toBeInTheDocument();
  });

  it('mounts through ContentRoot once the settings are read', async () => {
    workerAnswering({ 'state/get': state() });
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const portal = document.createElement('div');
    const container = document.createElement('div');
    root.append(container, portal);
    render(<ContentRoot logger={testLogger()} shadow={{ root, portal }} />, { container });
    await waitFor(() => expect(root.textContent).toContain('Assistant'));
  });
});

describe('hooks', () => {
  it('reports a settings read failure', async () => {
    workerAnswering({});
    const read = vi.fn(() => Promise.reject(new Error('blocked')));
    const parse = (raw: unknown) => raw;
    const { result } = renderHook(() => useStoredValue('k', parse, read));
    await waitFor(() => expect(result.current.error?.message).toBe('blocked'));
  });

  it('follows changes from other contexts and ignores other keys and areas', async () => {
    const chrome = workerAnswering({});
    const read = vi.fn(() => Promise.resolve(1));
    const parse = (raw: unknown) => Number(raw);
    const { result } = renderHook(() => useStoredValue('k', parse, read));
    await waitFor(() => expect(result.current.value).toBe(1));
    await act(() => chrome.storage.sync.set({ k: 2 }));
    expect(result.current.value).toBe(2);
    await act(() => chrome.storage.sync.set({ other: 3 }));
    await act(() => chrome.storage.local.set({ k: 4 }));
    expect(result.current.value).toBe(2);
  });

  it('ignores a late answer after unmount', async () => {
    workerAnswering({});
    let resolve: (value: number) => void = () => undefined;
    let reject: (error: Error) => void = () => undefined;
    const first = renderHook(() =>
      useStoredValue(
        'k',
        Number,
        () =>
          new Promise<number>((r) => {
            resolve = r;
          }),
      ),
    );
    first.unmount();
    resolve(5);
    const second = renderHook(() =>
      useStoredValue(
        'k',
        Number,
        () =>
          new Promise<number>((_, r) => {
            reject = r;
          }),
      ),
    );
    second.unmount();
    reject(new Error('late'));
    await Promise.resolve();
    expect(first.result.current.value).toBeNull();
    expect(second.result.current.error).toBeNull();
  });

  it('polls a panel query while mounted and skips it when disabled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const chrome = workerAnswering({ 'panel:participants': [] });
    const logger = testLogger();
    const { unmount } = renderHook(() => usePanelQuery({ op: 'participants' }, true, 1000, logger));
    await waitFor(() => expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(1));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    unmount();
    renderHook(() => usePanelQuery({ op: 'participants' }, false, 1000, logger));
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
  });

  it('follows only broadcasts about its own tab', async () => {
    const chrome = workerAnswering({ 'state/get': { auth: SIGNED_IN.auth, tab: null } });
    const { useWorkerState } = await import('../../../src/hooks/useWorkerState');
    const { result } = renderHook(() => useWorkerState(7, testLogger()));
    await waitFor(() => expect(result.current.state?.tab).toBeNull());
    act(() => {
      chrome.runtime.onMessage.emit(
        { type: 'state/changed', state: { auth: SIGNED_IN.auth, tab: null } },
        {},
        vi.fn(),
      );
      chrome.runtime.onMessage.emit(
        {
          type: 'state/changed',
          state: { ...SIGNED_IN, tab: { ...TAB_SNAPSHOT, tabId: 8, iconStatus: 'ERROR' } },
        },
        {},
        vi.fn(),
      );
    });
    expect(result.current.state?.tab).toBeNull();
    act(() => {
      chrome.runtime.onMessage.emit({ type: 'state/changed', state: SIGNED_IN }, {}, vi.fn());
    });
    expect(result.current.state?.tab?.tabId).toBe(7);
  });

  it('ignores worker messages that are not broadcasts', () => {
    const chrome = workerAnswering({ 'state/get': SIGNED_IN });
    render(<FloatingApp prefs={DEFAULT_PREFS} logger={testLogger()} />);
    expect(chrome.runtime.onMessage.emit('plain', {}, vi.fn())).toEqual([undefined]);
  });

  it('keeps the earlier messages when a late translation answer arrives after unmount', async () => {
    const chrome = workerAnswering({});
    let answer: (value: unknown) => void = () => undefined;
    chrome.runtime.sendMessage.mockImplementation(
      () =>
        new Promise((r) => {
          answer = r;
        }),
    );
    const { useMessages } = await import('../../../src/hooks/useMessages');
    const { result, unmount } = renderHook(() => useMessages(testLogger()));
    unmount();
    answer({ ok: true, data: { Hi: 'Hallo' } });
    await Promise.resolve();
    expect(result.current).toEqual({});
  });
});
