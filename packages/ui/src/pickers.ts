/**
 * MUIX date & time pickers (CLAUDE.md rule 11), kept on their own subpath so a
 * consumer that never renders a picker does not pull MUI X into its bundle.
 * The date-fns adapter is wired once per app via `LocalizationProvider`.
 */
export { LocalizationProvider } from '@mui/x-date-pickers';
// MUI X 9 dropped the `V3` suffix: `AdapterDateFns` is the date-fns v3/v4 adapter now,
// and `AdapterDateFnsV2` is the legacy one.
export { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
export { DatePicker } from '@mui/x-date-pickers/DatePicker';
export { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
export { TimePicker } from '@mui/x-date-pickers/TimePicker';
export { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
// Renamed in MUI X 9 (PickersDay -> PickerDay); the barrel follows the library.
export { PickerDay, type PickerDayProps } from '@mui/x-date-pickers/PickerDay';
