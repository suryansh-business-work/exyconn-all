import { SendSmsForm } from '../forms/send-sms';
import type { CommsPanel } from '../commsStore';
import { CallPanel } from './CallPanel';
import { EmailPanel } from './EmailPanel';

/** The inside of a dock panel, by channel. */
export function CommsPanelBody({
  panel,
  onClose,
}: Readonly<{ panel: CommsPanel; onClose: () => void }>) {
  if (panel.channel === 'CALL') {
    return <CallPanel panel={panel} onClose={onClose} />;
  }
  if (panel.channel === 'SMS') {
    return <SendSmsForm panel={panel} onCancel={onClose} />;
  }
  return <EmailPanel panel={panel} onClose={onClose} />;
}
