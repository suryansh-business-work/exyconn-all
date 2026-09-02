import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Text,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { timezoneSummary, type TimezoneResolution } from './tracker.timezone';
import type {
  DateTimeFormatter,
  TrackerDeviceRow,
} from '@exyconn/shell/pages/tracker-view/tracker.types';

/** One label/value pair in the device fact sheet. */
interface DeviceFact {
  label: string;
  value: string;
}

/** Every fact the desktop agent reports at enrolment, in reading order. */
function toFacts(
  device: TrackerDeviceRow,
  formatDateTime: DateTimeFormatter,
  timezone: TimezoneResolution,
): DeviceFact[] {
  const memoryGb = (device.totalMemoryMb / 1024).toFixed(1);
  return [
    { label: 'Machine ID', value: device.machineId },
    { label: 'Operating system', value: `${device.osName} ${device.osVersion}` },
    { label: 'Platform', value: device.platform },
    { label: 'Architecture', value: device.arch },
    { label: 'CPU', value: device.cpuModel },
    { label: 'CPU cores', value: String(device.cpuCores) },
    { label: 'Memory', value: `${memoryGb} GB` },
    { label: 'Locale', value: device.locale },
    { label: 'Device timezone', value: device.timezone },
    { label: 'Effective timezone', value: timezoneSummary(timezone) },
    { label: 'Screens', value: String(device.screenCount) },
    { label: 'Screen resolution', value: device.screenResolution },
    { label: 'App version', value: device.appVersion },
    { label: 'Issued', value: formatDateTime(device.issuedAt) },
    { label: 'Last seen', value: formatDateTime(device.lastSeenAt) },
  ];
}

interface TrackerDeviceDetailsProps {
  device: TrackerDeviceRow | null;
  onClose: () => void;
  formatDateTime: DateTimeFormatter;
  timezone: TimezoneResolution;
}

/** Full hardware/OS fact sheet for one enrolled device, opened from the table. */
export function TrackerDeviceDetails({
  device,
  onClose,
  formatDateTime,
  timezone,
}: Readonly<TrackerDeviceDetailsProps>) {
  if (!device) return null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {device.hostname}
        <StatusChip value={device.isActive ? 'ACTIVE' : 'INACTIVE'} />
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={1.5}>
          {toFacts(device, formatDateTime, timezone).map((fact) => (
            <Grid item xs={12} sm={6} key={fact.label}>
              <Text size="caption" color="text.secondary" component="div">
                {fact.label}
              </Text>
              <Text size="sm" weight="medium" component="div" sx={{ wordBreak: 'break-word' }}>
                {fact.value}
              </Text>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
