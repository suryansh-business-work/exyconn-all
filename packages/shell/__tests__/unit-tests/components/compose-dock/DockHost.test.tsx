import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DockHost, openDockPanel } from '@/components/compose-dock';
import { renderWithProviders } from '../../test-utils';
import { dockRequest, resetDock } from './dock-fixtures';

const pills = () => screen.queryByRole('navigation', { name: 'Minimized windows' });

/** Animation frames queued by the dock, run by the test once React has rendered. */
const frames: FrameRequestCallback[] = [];

describe('DockHost', () => {
  beforeEach(() => {
    frames.length = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetDock();
  });

  it('shows nothing until a window opens', () => {
    renderWithProviders(<DockHost />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pills()).not.toBeInTheDocument();
  });

  it('titles a window by its title and subject, or its title alone', () => {
    renderWithProviders(<DockHost />);

    act(() => openDockPanel(dockRequest()));
    expect(screen.getByRole('dialog', { name: 'SMS · Ada Lovelace' })).toBeInTheDocument();

    act(() => openDockPanel(dockRequest({ key: 'new', title: 'Email', subject: undefined })));
    expect(screen.getByRole('dialog', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore SMS · Ada Lovelace' })).toBeInTheDocument();
  });

  it('restores a pill on click, and minimizes to a pill that then takes focus', async () => {
    renderWithProviders(<DockHost />);
    act(() => openDockPanel(dockRequest()));
    act(() => openDockPanel(dockRequest({ key: 'CALL:CONTACT:c-1', title: 'Call' })));

    await userEvent.click(screen.getByRole('button', { name: 'Restore SMS · Ada Lovelace' }));
    expect(screen.getByRole('dialog', { name: 'SMS · Ada Lovelace' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const pill = screen.getByRole('button', { name: 'Restore SMS · Ada Lovelace' });
    act(() => {
      for (const frame of frames) {
        frame(0);
      }
    });
    expect(pill).toHaveFocus();
  });

  it('closes a window from its header or from inside its body', async () => {
    renderWithProviders(<DockHost />);
    act(() => openDockPanel(dockRequest()));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => openDockPanel(dockRequest()));
    await userEvent.click(screen.getByRole('button', { name: 'Body of SMS:CONTACT:c-1' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
