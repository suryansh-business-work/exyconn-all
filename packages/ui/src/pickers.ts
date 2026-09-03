/**
 * MUIX date & time pickers (CLAUDE.md rule 11), kept on their own subpath so a
 * consumer that never renders a picker does not pull MUI X into its bundle.
 * The date-fns adapter is wired once per app via `LocalizationProvider`.
 */
export { LocalizationProvider } from '@mui/x-date-pickers';
export { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
export { DatePicker } from '@mui/x-date-pickers/DatePicker';
export { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
export { TimePicker } from '@mui/x-date-pickers/TimePicker';
export { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
export { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
