import { buildSettingRows, type TrackerSettings } from '@exyconn/tracker-core';
import { withPhoneNotes } from '../../lib/settings/phone-notes';
import { capabilities } from '../../tracker/platform';
import { Notice } from '../ui/Notice';
import { SettingsCard } from './SettingsCard';
import { SettingsList } from './SettingsList';

interface Props {
  settings: TrackerSettings | null;
}

/** The administrator's tracker settings, read-only, each noted where this phone differs. */
export function WorkspaceSettingsCard({ settings }: Readonly<Props>) {
  return (
    <SettingsCard
      title="Settings"
      description="Configured by your workspace administrator in the Exyconn portal. This app cannot change them."
    >
      {settings === null ? (
        <Notice severity="info">Settings are not available right now.</Notice>
      ) : (
        <SettingsList rows={withPhoneNotes(buildSettingRows(settings), capabilities)} />
      )}
    </SettingsCard>
  );
}
