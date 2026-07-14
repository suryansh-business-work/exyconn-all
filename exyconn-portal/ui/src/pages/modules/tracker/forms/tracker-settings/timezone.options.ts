import type { SelectOption } from '@/components/form/rhf';
import { isValidTimezone, timezoneOptionLabel } from '../../tracker.timezone';

/** The empty value the server reads as "no house default — every device keeps its own zone". */
export const DEVICE_TIMEZONE_OPTION: SelectOption = {
  value: '',
  label: "Use each device's own timezone",
};

/**
 * Every IANA zone the platform knows, labelled with its current UTC offset, plus the explicit
 * "device's own timezone" escape hatch. The list comes from ICU, never a hardcoded table.
 *
 * `current` is unioned in because `Intl.supportedValuesOf` returns the zone list
 * *pre-canonicalisation* — it can hold `Asia/Calcutta` but not the equally valid `Asia/Kolkata`
 * an admin (or the server) may already have saved, which would otherwise show as an empty field.
 */
export function buildTimezoneOptions(current: string, at: Date = new Date()): SelectOption[] {
  const names = new Set(Intl.supportedValuesOf('timeZone'));
  if (isValidTimezone(current)) {
    names.add(current);
  }
  const zones = [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((zone) => ({ value: zone, label: timezoneOptionLabel(zone, at) }));
  return [DEVICE_TIMEZONE_OPTION, ...zones];
}
