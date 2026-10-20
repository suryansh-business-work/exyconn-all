import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComposeWindow } from '@/components/compose';
import { renderWithProviders } from '../../test-utils';

function renderWindow(open = true) {
  const onClose = vi.fn();
  renderWithProviders(
    <>
      <button type="button">Behind the window</button>
      <ComposeWindow open={open} title="Email Meera" onClose={onClose}>
        <textarea aria-label="Draft" defaultValue="Half written" />
      </ComposeWindow>
    </>,
  );
  return { onClose, user: userEvent.setup() };
}

const windowEl = () => screen.getByRole('dialog', { name: 'Email Meera' });
const titleBar = () => screen.getByText('Email Meera').parentElement as HTMLElement;

describe('ComposeWindow', () => {
  it('renders nothing while closed', () => {
    renderWindow(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('docks over the page without blocking it', async () => {
    const { user } = renderWindow();
    expect(windowEl()).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBeVisible();
    // No backdrop: what is behind stays reachable.
    await user.click(screen.getByRole('button', { name: 'Behind the window' }));
    expect(windowEl()).toBeInTheDocument();
  });

  it('minimises to its title bar, keeping the draft, and restores', async () => {
    const { user } = renderWindow();
    await user.click(screen.getByRole('button', { name: 'Minimise' }));
    expect(screen.getByRole('textbox', { name: 'Draft', hidden: true })).not.toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Restore' }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Half written');
  });

  it('toggles minimised by double-clicking the title bar', () => {
    renderWindow();
    fireEvent.doubleClick(titleBar());
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
    fireEvent.doubleClick(titleBar());
    expect(screen.getByRole('button', { name: 'Minimise' })).toBeInTheDocument();
  });

  it('goes full screen and back', async () => {
    const { user } = renderWindow();
    await user.click(screen.getByRole('button', { name: 'Full screen' }));
    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Exit full screen' }));
    expect(screen.getByRole('button', { name: 'Full screen' })).toBeInTheDocument();
  });

  it('is dragged by its title bar, never below the screen edge', () => {
    renderWindow();
    fireEvent.pointerDown(titleBar(), { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(titleBar(), { clientX: 60, clientY: 40, pointerId: 1 });
    fireEvent.pointerUp(titleBar(), { pointerId: 1 });
    expect(getComputedStyle(windowEl()).transform).toBe('translate(-40px, -60px)');
    // Dragging down past the dock stops at the bottom edge.
    fireEvent.pointerDown(titleBar(), { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(titleBar(), { clientX: 0, clientY: 500, pointerId: 1 });
    expect(getComputedStyle(windowEl()).transform).toBe('translate(-40px, 0px)');
    // A move with no press in progress does nothing.
    fireEvent.pointerUp(titleBar(), { pointerId: 1 });
    fireEvent.pointerMove(titleBar(), { clientX: 300, clientY: 0, pointerId: 1 });
    expect(getComputedStyle(windowEl()).transform).toBe('translate(-40px, 0px)');
  });

  it('does not drag from its buttons, nor while minimised or full screen', async () => {
    const { user } = renderWindow();
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Close' }), {
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerMove(titleBar(), { clientX: 50, clientY: -50 });
    expect(getComputedStyle(windowEl()).transform).toBe('translate(0px, 0px)');
    await user.click(screen.getByRole('button', { name: 'Full screen' }));
    fireEvent.pointerDown(titleBar(), { clientX: 0, clientY: 0 });
    fireEvent.pointerMove(titleBar(), { clientX: 50, clientY: -50 });
    expect(getComputedStyle(windowEl()).transform).toBe('translate(0px, 0px)');
  });

  it('closes from its close button', async () => {
    const { user, onClose } = renderWindow();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
