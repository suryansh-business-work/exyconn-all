import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CommsPanel } from '../../../../../src/records/comms/commsStore';
import { writeMemory } from '../../../../../src/records/comms/commsStore';
import { CommsPanelBody } from '../../../../../src/records/comms/panels/CommsPanelBody';
import { renderWithProviders } from '../../../test-utils';
import { commsPanel, resetDock } from '../comms-fixtures';

const calls = vi.hoisted(() => ({ compose: vi.fn() }));

type StartProps = Readonly<{
  onStarted: () => void;
  onFailed: (message: string) => void;
  onCancel: () => void;
}>;

vi.mock('../../../../../src/records/comms/forms/start-call', () => ({
  StartCallForm: ({ onStarted, onFailed, onCancel }: StartProps) => (
    <>
      <button type="button" onClick={onStarted}>
        Fake start
      </button>
      <button type="button" onClick={() => onFailed('Line busy')}>
        Fake fail
      </button>
      <button type="button" onClick={onCancel}>
        Fake cancel call
      </button>
    </>
  ),
}));

vi.mock('../../../../../src/records/comms/forms/call-note', () => ({
  CallNoteForm: ({ onCancel }: Readonly<{ onCancel: () => void }>) => (
    <button type="button" onClick={onCancel}>
      Fake notes
    </button>
  ),
}));

vi.mock('../../../../../src/records/comms/forms/send-sms', () => ({
  SendSmsForm: ({ panel }: Readonly<{ panel: CommsPanel }>) => <p>SMS form for {panel.name}</p>,
}));

vi.mock('../../../../../src/records/detail/forms/compose-email', () => ({
  ComposeEmailForm: (props: Readonly<{ onDone: () => void; onCancel: () => void }>) => {
    calls.compose(props);
    return (
      <button type="button" onClick={props.onDone}>
        Fake compose
      </button>
    );
  },
}));

function renderBody(panel: CommsPanel) {
  const onClose = vi.fn();
  renderWithProviders(<CommsPanelBody panel={panel} onClose={onClose} />);
  return { onClose };
}

describe('CommsPanelBody', () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetDock();
  });

  it('hosts the SMS form on an SMS panel', () => {
    renderBody(commsPanel({ channel: 'SMS' }));

    expect(screen.getByText('SMS form for Ada Lovelace')).toBeInTheDocument();
  });

  it('composes to the record first address on an email panel and closes when done', async () => {
    const panel = commsPanel({ channel: 'EMAIL', emails: ['ada@example.com', 'ada@work.example'] });
    const { onClose } = renderBody(panel);

    expect(calls.compose).toHaveBeenCalledWith(
      expect.objectContaining({
        context: { object: 'CONTACT', id: 'c-1', to: ['ada@example.com'] },
        memoryKey: 'EMAIL:CONTACT:c-1',
        onCancel: onClose,
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Fake compose' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('composes with no recipient when the record has no address', () => {
    renderBody(commsPanel({ channel: 'EMAIL', emails: [] }));

    expect(calls.compose).toHaveBeenCalledWith(
      expect.objectContaining({ context: { object: 'CONTACT', id: 'c-1', to: [] } }),
    );
  });

  describe('call panel', () => {
    const CALL = commsPanel({ channel: 'CALL' });

    it('shows the call failure until a call is placed, then says the phone is ringing', async () => {
      renderBody(CALL);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Fake fail' }));
      expect(screen.getByRole('alert')).toHaveTextContent('Line busy');

      await userEvent.click(screen.getByRole('button', { name: 'Fake start' }));
      expect(screen.getByRole('status')).toHaveTextContent(
        'Ringing your phone — answer to connect to Ada Lovelace',
      );
      expect(screen.getByRole('button', { name: 'Fake notes' })).toBeInTheDocument();
    });

    it('goes back to the call form on Call again, without the old failure', async () => {
      renderBody(CALL);
      await userEvent.click(screen.getByRole('button', { name: 'Fake fail' }));
      await userEvent.click(screen.getByRole('button', { name: 'Fake start' }));

      await userEvent.click(screen.getByRole('button', { name: 'Call again' }));

      expect(screen.getByRole('button', { name: 'Fake start' })).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('stays ringing across a remount of the page', () => {
      writeMemory(CALL.key, 'ringing', true);

      renderBody(CALL);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('closes the panel from either form', async () => {
      const { onClose } = renderBody(CALL);
      await userEvent.click(screen.getByRole('button', { name: 'Fake cancel call' }));
      await userEvent.click(screen.getByRole('button', { name: 'Fake start' }));
      await userEvent.click(screen.getByRole('button', { name: 'Fake notes' }));

      expect(onClose).toHaveBeenCalledTimes(2);
    });
  });
});
