import type { DockBodyProps, DockPanel } from '@exyconn/shell/components/compose-dock';
import type { CommsPanel, CommsRequest } from '../commsStore';
import { CommsPanelBody } from './CommsPanelBody';

/** The CRM's view of one of its dock windows: the record's request with the dock's state. */
export const toCommsPanel = (panel: DockPanel): CommsPanel => ({
  ...(panel.data as CommsRequest),
  key: panel.key,
  minimized: panel.minimized,
  focusPending: panel.focusPending,
});

/** A CRM window in the shell's dock: the record's request, rendered by channel. */
export function CrmCommsBody({ panel, onClose }: Readonly<DockBodyProps>) {
  return <CommsPanelBody panel={toCommsPanel(panel)} onClose={onClose} />;
}
