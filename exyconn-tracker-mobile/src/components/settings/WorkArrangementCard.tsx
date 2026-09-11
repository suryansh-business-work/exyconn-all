import type { WorkProfile } from '@exyconn/tracker-core';
import { workArrangementRows } from '../../lib/settings/work-arrangement';
import { SettingsCard } from './SettingsCard';
import { SettingsList } from './SettingsList';

interface Props {
  workProfile: WorkProfile | null;
}

/**
 * What HR contracted this employee to work, read-only.
 *
 * It sits on the settings screen next to the administrator's capture rules for the same
 * reason those do: the employee is entitled to see the terms the app measures them against,
 * and to notice when they are wrong. Only HR can change them.
 */
export function WorkArrangementCard({ workProfile }: Readonly<Props>) {
  if (workProfile === null) {
    return null;
  }
  return (
    <SettingsCard
      title="Your working day"
      description="Set by HR on your employee record. Today’s progress fills against these hours. Ask HR if it does not match your contract."
    >
      <SettingsList rows={workArrangementRows(workProfile)} />
    </SettingsCard>
  );
}
