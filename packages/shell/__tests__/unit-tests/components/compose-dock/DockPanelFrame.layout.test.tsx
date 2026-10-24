import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from '@/config/theme';
import { moveDock, resizeDock, useDock } from '@/components/compose-dock';
import { DockPanelFrame } from '@/components/compose-dock';
import { renderWithProviders } from '../../test-utils';
import { dockPanel, resetDock } from './dock-fixtures';

/** The frame wired to the dock store, the way DockHost mounts it. */
function DockedFrame() {
  const { position, size, maximized } = useDock();
  return (
    <DockPanelFrame
      panel={dockPanel()}
      title="SMS · Ada Lovelace"
      position={position}
      size={size}
      maximized={maximized}
      abovePills={false}
      onMinimize={vi.fn()}
      onClose={vi.fn()}
    >
      <input aria-label="Message" />
    </DockPanelFrame>
  );
}

function renderDocked() {
  renderWithProviders(<DockedFrame />);
  return screen.getByRole('dialog', { name: 'SMS · Ada Lovelace' });
}

const inset = theme.spacing(1);

describe('DockPanelFrame maximize and resize', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetDock();
  });

  it('maximizes to fill the screen and restores the dragged spot and size', async () => {
    act(() => {
      moveDock({ x: 120, y: 40 });
      resizeDock({ width: 480, height: 360 });
    });
    const dialog = renderDocked();
    expect(dialog).toHaveStyle({ left: '120px', top: '40px', width: '480px', height: '360px' });

    await userEvent.click(screen.getByRole('button', { name: 'Maximize' }));

    expect(dialog).toHaveStyle({ top: inset, right: inset, bottom: inset, left: inset });
    expect(dialog.querySelector('[data-testid="DragIndicatorIcon"]')).toBeNull();
    expect(dialog.querySelector('[data-resize-edge]')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Restore size' }));

    expect(dialog).toHaveStyle({ left: '120px', top: '40px', width: '480px', height: '360px' });
    expect(dialog.querySelectorAll('[data-resize-edge]')).toHaveLength(6);
  });

  it('toggles maximize on a double-click of the title bar, but not of its buttons', () => {
    renderDocked();
    const title = screen.getByRole('heading', { level: 2, name: 'SMS · Ada Lovelace' });

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();

    fireEvent.doubleClick(title);
    expect(screen.getByRole('button', { name: 'Restore size' })).toBeInTheDocument();

    fireEvent.doubleClick(title);
    expect(screen.getByRole('button', { name: 'Maximize' })).toBeInTheDocument();
  });

  it('drops the styles a resize wrote once the store has the new size', () => {
    const dialog = renderDocked();
    dialog.style.width = '999px';
    dialog.style.maxHeight = 'none';

    act(() => resizeDock({ width: 400, height: 300 }));

    expect(dialog.style.width).toBe('');
    expect(dialog.style.maxHeight).toBe('');
    expect(dialog).toHaveStyle({ width: '400px', height: '300px' });
  });

  it('resizes from the corner strip with the pointer', () => {
    const dialog = renderDocked();
    const corner = dialog.querySelector<HTMLElement>('[data-resize-edge="corner"]');
    if (!corner) {
      throw new Error('The corner strip is missing');
    }
    corner.setPointerCapture = vi.fn();

    fireEvent.pointerDown(corner, { button: 0, clientX: 0, clientY: 0, pointerId: 1 });
    corner.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 400 }));
    act(() => {
      corner.dispatchEvent(new MouseEvent('pointerup'));
    });

    expect(dialog).toHaveStyle({ width: '500px', height: '400px' });
  });

  it('keeps the phone bottom sheet at its own size, without resize handles', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    );
    act(() => resizeDock({ width: 480, height: 360 }));

    const dialog = renderDocked();

    expect(dialog).toHaveStyle({ left: '0px', right: '0px', bottom: '0px' });
    expect(dialog).not.toHaveStyle({ width: '480px' });
    expect(dialog.querySelector('[data-resize-edge]')).toBeNull();
  });
});
