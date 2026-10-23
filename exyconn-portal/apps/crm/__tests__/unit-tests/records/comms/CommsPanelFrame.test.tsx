import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { theme } from '@exyconn/shell/config/theme';
import { openComms, useCommsDock } from '../../../../src/records/comms/commsStore';
import { CommsPanelFrame } from '../../../../src/records/comms/CommsPanelFrame';
import type { DockPosition, DockSize } from '../../../../src/records/comms/commsStore';
import { renderWithProviders } from '../../test-utils';
import { commsPanel, commsRequest, resetDock } from './comms-fixtures';

interface FrameOptions {
  focusPending?: boolean;
  position?: DockPosition | null;
  size?: DockSize | null;
  maximized?: boolean;
  abovePills?: boolean;
  children?: ReactNode;
}

function renderFrame({
  focusPending = false,
  position = null,
  size = null,
  maximized = false,
  abovePills = false,
  children = <input aria-label="Message" />,
}: FrameOptions = {}) {
  const onMinimize = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <CommsPanelFrame
      panel={commsPanel({ focusPending })}
      title="SMS · Ada Lovelace"
      position={position}
      size={size}
      maximized={maximized}
      abovePills={abovePills}
      onMinimize={onMinimize}
      onClose={onClose}
    >
      {children}
    </CommsPanelFrame>,
  );
  return {
    onMinimize,
    onClose,
    dialog: screen.getByRole('dialog', { name: 'SMS · Ada Lovelace' }),
  };
}

/** Makes `useMediaQuery` see a phone-width (or wider) screen. */
function screenIsPhone(phone: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: phone,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  );
}

describe('CommsPanelFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetDock();
  });

  it('is a non-modal dialog named by its title, holding the panel body', () => {
    const { dialog } = renderFrame();

    expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(screen.getByRole('heading', { level: 2, name: 'SMS · Ada Lovelace' })).toBeVisible();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('moves focus to the first field once and tells the store focus was taken', () => {
    act(() => openComms(commsRequest()));
    const dock = renderHook(() => useCommsDock());
    expect(dock.result.current.panels[0].focusPending).toBe(true);

    renderFrame({ focusPending: true });

    expect(screen.getByLabelText('Message')).toHaveFocus();
    expect(dock.result.current.panels[0].focusPending).toBe(false);
  });

  it('focuses the panel itself when its body has nothing to focus', () => {
    const { dialog } = renderFrame({ focusPending: true, children: <p>Nothing to type</p> });

    expect(dialog).toHaveFocus();
  });

  it('leaves focus alone when the panel already took it', () => {
    renderFrame();

    expect(screen.getByLabelText('Message')).not.toHaveFocus();
  });

  it('minimizes on Escape, but not on other keys', () => {
    const { onMinimize, dialog } = renderFrame();

    fireEvent.keyDown(dialog, { key: 'Enter' });
    expect(onMinimize).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByLabelText('Message'), { key: 'Escape' });
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it('minimizes and closes from the header buttons', async () => {
    const { onMinimize, onClose } = renderFrame();

    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sits bottom-right by default, lifted above the minimized pills when there are any', () => {
    expect(renderFrame().dialog).toHaveStyle({
      right: theme.spacing(2),
      bottom: theme.spacing(2),
    });
    resetDock();
    document.body.innerHTML = '';

    expect(renderFrame({ abovePills: true }).dialog).toHaveStyle({ bottom: theme.spacing(8) });
  });

  it('sits where it was dragged to, with a drag handle on wide screens', () => {
    const { dialog } = renderFrame({ position: { x: 120, y: 40 } });

    expect(dialog).toHaveStyle({ left: '120px', top: '40px' });
    expect(dialog.querySelector('[data-testid="DragIndicatorIcon"]')).not.toBeNull();
  });

  it('fills the bottom of a phone screen without a drag handle', () => {
    screenIsPhone(true);

    const { dialog } = renderFrame({ position: { x: 120, y: 40 } });

    expect(dialog).toHaveStyle({ left: '0px', right: '0px', bottom: '0px' });
    expect(dialog.querySelector('[data-testid="DragIndicatorIcon"]')).toBeNull();
  });
});
