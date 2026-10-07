import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { AlertColor } from '@exyconn/shell/components/ui';
import { liveEditor } from './live-editor-stub';
import { renderLiveEditScreen } from './live-edit-screen-harness';

/** Failures in the screen's own helpers: the confirm dialog, and the notifier itself. */
const faults = vi.hoisted(() => ({
  confirm: null as Error | null,
  refusedNotices: new Set<string>(),
}));

vi.mock('@exyconn/live-editor', async () => {
  const stub = await import('./live-editor-stub');
  return { LiveEditor: stub.LiveEditorStub };
});

vi.mock('@exyconn/shell/hooks/useImageKitUpload', () => ({
  useImageKitUpload: () => () => Promise.resolve('https://ik.example.test/a.png'),
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return {
    ...actual,
    useConfirm: () => {
      const confirm = actual.useConfirm();
      const failure = faults.confirm;
      return failure ? () => Promise.reject(failure) : confirm;
    },
  };
});

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@exyconn/shell/components/feedback/NotificationProvider')
    >();
  return {
    ...actual,
    useNotify: () => {
      const notify = actual.useNotify();
      return (message: string, severity?: AlertColor) => {
        if (faults.refusedNotices.has(message)) {
          throw new Error('The notice could not be shown');
        }
        notify(message, severity);
      };
    },
  };
});

beforeEach(() => {
  faults.confirm = null;
  faults.refusedNotices.clear();
  liveEditor.props = null;
  liveEditor.attached = true;
});

describe('LiveEditScreen when its helpers fail', () => {
  it('reports a leave prompt that could not open, and stays put', async () => {
    faults.confirm = new Error('Dialog unavailable');
    renderLiveEditScreen();
    fireEvent.click(screen.getByRole('button', { name: 'Change the design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to the list' }));

    expect(await screen.findByText('Dialog unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Blog list')).not.toBeInTheDocument();
  });

  it('still surfaces a failed save when reporting it fails too', async () => {
    faults.refusedNotices.add('Server said no');
    renderLiveEditScreen(vi.fn(() => Promise.reject(new Error('Server said no'))));
    fireEvent.click(screen.getByRole('button', { name: 'Change the design' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('The notice could not be shown')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });
});
