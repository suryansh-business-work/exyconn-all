import { AppSettingsModel } from '../admin/settings.model';
import { FALLBACK_TIMEZONE, isValidTimezone } from '../../utils/timezone';

/** How the company writes a date and time, and in which zone. */
export interface HouseClock {
  timezone: string;
  pattern: string;
}

/** The admin-configured zone and formats (Admin › Settings), read once per company per tick. */
export async function houseClock(): Promise<HouseClock> {
  const settings = await AppSettingsModel.findOne().select('timezone dateFormat timeFormat').lean();
  const zone = settings?.timezone;
  return {
    timezone: zone && isValidTimezone(zone) ? zone : FALLBACK_TIMEZONE,
    pattern: `${settings?.dateFormat ?? 'dd MMM yyyy'} ${settings?.timeFormat ?? 'hh:mm a'}`,
  };
}
