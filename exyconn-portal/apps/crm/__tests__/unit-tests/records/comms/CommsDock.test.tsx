import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { DockHost } from '@exyconn/shell/components/compose-dock';
import { CommsDockLayout, openComms } from '../../../../src/records/comms';
import type { CommsPanel } from '../../../../src/records/comms/commsStore';
import { renderWithProviders } from '../../test-utils';
import { commsRequest, resetDock } from './comms-fixtures';

vi.mock('../../../../src/records/comms/panels/CommsPanelBody', () => ({
  CommsPanelBody: ({ panel, onClose }: Readonly<{ panel: CommsPanel; onClose: () => void }>) => (
    <button type="button" onClick={onClose}>
      Body of {panel.key}
    </button>
  ),
}));

function renderDock() {
  renderWithProviders(
    <>
      <Routes>
        <Route element={<CommsDockLayout />}>
          <Route path="/" element={<h1>Contacts page</h1>} />
        </Route>
      </Routes>
      <DockHost />
    </>,
  );
}

const pills = () => screen.queryByRole('navigation', { name: 'Minimized windows' });

/** Animation frames queued by the dock, run by the test once React has rendered. */
const frames: FrameRequestCallback[] = [];

describe('CRM windows in the shell dock', () => {
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

  it('floats over the page and shows nothing until a panel opens', () => {
    renderDock();

    expect(screen.getByRole('heading', { name: 'Contacts page' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pills()).not.toBeInTheDocument();
  });

  it('shows the opened panel titled by its channel and record', () => {
    renderDock();

    act(() => openComms(commsRequest({ channel: 'CALL' })));

    expect(screen.getByRole('dialog', { name: 'Call · Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Body of CALL:CONTACT:c-1' })).toBeInTheDocument();
  });

  it('keeps one panel expanded and the others as pills that restore on click', async () => {
    renderDock();
    act(() => openComms(commsRequest({ channel: 'SMS' })));
    act(() => openComms(commsRequest({ channel: 'EMAIL', name: 'Acme', object: 'COMPANY' })));

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Email · Acme' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Restore SMS · Ada Lovelace' }));

    expect(screen.getByRole('dialog', { name: 'SMS · Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore Email · Acme' })).toBeInTheDocument();
  });

  it('turns the panel into a pill on minimize and puts focus on that pill', async () => {
    renderDock();
    act(() => openComms(commsRequest({ channel: 'SMS' })));

    await userEvent.click(screen.getByRole('button', { name: 'Minimize' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const pill = screen.getByRole('button', { name: 'Restore SMS · Ada Lovelace' });
    expect(pill).not.toHaveFocus();
    act(() => {
      for (const frame of frames) {
        frame(0);
      }
    });
    expect(pill).toHaveFocus();
  });

  it('closes the panel from the header or from inside its body', async () => {
    renderDock();
    act(() => openComms(commsRequest({ channel: 'SMS' })));
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => openComms(commsRequest({ channel: 'CALL' })));
    await userEvent.click(screen.getByRole('button', { name: 'Body of CALL:CONTACT:c-1' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(pills()).not.toBeInTheDocument();
  });
});
