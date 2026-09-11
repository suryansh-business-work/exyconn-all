import { useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import { Spinner, XStack, YStack } from 'tamagui';
import { formatTimeOfDay, offsetLabel } from '@exyconn/tracker-core';
import { useTimezoneList } from '../../hooks/useTimezoneList';
import { timezoneOptions } from '../../lib/settings/timezone-options';
import { TRACKER_RADIUS } from '../../theme/tokens';
import { tracker } from '../../tracker/instance';
import { FieldFrame } from '../form/FieldFrame';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { OptionSheet } from '../ui/OptionSheet';
import { Body, Caption } from '../ui/Typography';

interface Props {
  /** The zone in force: this employee's pick, else the admin default, else this phone's. */
  timezone: string;
}

const SAVE_FAILED = 'Your timezone could not be saved. Check your connection and try again.';
const LIST_FAILED = 'The list of timezones could not be loaded. Tap the field to try again.';

/**
 * The employee picks the zone the whole app renders in — every screenshot time, every report
 * day, every "last synced". A searchable sheet, not a plain list: there are ~400 IANA zones,
 * and a 400-row list is not something anyone can use without a filter.
 *
 * The list comes from the portal (the phone's Hermes engine has no `Intl.supportedValuesOf`),
 * never a hardcoded table, and the choice is persisted to the portal, which is what makes it follow the employee to the web
 * portal and to their next device.
 */
export function TimezonePicker({ timezone }: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const list = useTimezoneList();
  const { zones } = list;
  const options = useMemo(
    () => (zones === null ? [] : timezoneOptions(timezone, zones)),
    [timezone, zones],
  );
  const loadingList = zones === null && !list.failed;
  const busy = saving || loadingList;

  function openSheet(): void {
    if (list.failed) {
      list.reload();
      return;
    }
    setOpen(true);
  }

  async function choose(zone: string): Promise<void> {
    if (zone === timezone) {
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      // The controller publishes the new state, which re-renders the whole app in the new
      // zone — including the `timezone` prop above. It is never set locally.
      await tracker.setTimezone(zone);
    } catch (cause: unknown) {
      console.error('Failed to save the timezone', cause);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const hint = `Every date and time in this app is shown in this zone (${offsetLabel(timezone)}).`;
  return (
    <YStack gap="$2">
      <FieldFrame id="timezone" label="Timezone" hint={hint}>
        <Pressable
          onPress={openSheet}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={`Timezone: ${timezone}`}
          accessibilityHint="Opens the list of timezones"
          accessibilityState={{ disabled: busy, busy }}
        >
          <XStack
            borderWidth={1}
            borderColor="$hairline"
            borderRadius={TRACKER_RADIUS}
            backgroundColor="$paper"
            padding="$3"
            gap="$2"
            alignItems="center"
            opacity={busy ? 0.55 : 1}
          >
            <Body flex={1} numberOfLines={1}>
              {timezone}
            </Body>
            {busy ? <Spinner /> : <Icon name="chevron-down" />}
          </XStack>
        </Pressable>
      </FieldFrame>
      <Caption>
        It is {formatTimeOfDay(new Date().toISOString(), timezone)} there right now.
      </Caption>
      {failed ? <Notice severity="error">{SAVE_FAILED}</Notice> : null}
      {list.failed ? <Notice severity="error">{LIST_FAILED}</Notice> : null}
      <OptionSheet
        open={open}
        title="Timezone"
        options={options}
        selected={timezone}
        searchable
        onClose={() => setOpen(false)}
        onSelect={(zone) => {
          choose(zone).catch((cause: unknown) => console.error('Timezone change failed', cause));
        }}
      />
    </YStack>
  );
}
