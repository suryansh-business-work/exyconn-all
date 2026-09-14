import { useT } from '@exyconn/i18n';
import type { TrackerSettings } from '@exyconn/tracker-core';
import { PhoneRecordsList } from '../capabilities/PhoneRecordsList';
import { SettingsCard } from './SettingsCard';

interface Props {
  settings: TrackerSettings | null;
}

/**
 * What this phone records — the desktop's rules minus what the phone's OS will not let an app
 * see, each gap said plainly so a missing number never reads as a zero.
 */
export function CapabilityCard({ settings }: Readonly<Props>) {
  const t = useT();
  return (
    <SettingsCard
      title={t('What this phone records')}
      description={t(
        'The same account records more on a computer. This is what the tracker can see here.',
      )}
    >
      <PhoneRecordsList settings={settings} />
    </SettingsCard>
  );
}
