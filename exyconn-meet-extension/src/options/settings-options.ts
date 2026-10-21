import type { SelectOption } from '../components/form/RhfSelect';

/** Choices for the settings form's selects. Labels are English source strings. */
export const THEME_OPTIONS: readonly SelectOption[] = [
  { value: 'system', label: 'Match the system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const CORNER_OPTIONS: readonly SelectOption[] = [
  { value: 'bottom-left', label: 'Bottom left' },
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'top-left', label: 'Top left' },
  { value: 'top-right', label: 'Top right' },
];

export const PANEL_OPTIONS: readonly SelectOption[] = [
  { value: 'collapsed', label: 'Collapsed' },
  { value: 'expanded', label: 'Expanded' },
];

/** The reminder interval choices; the company default shows its own minutes. */
export function intervalOptions(orgMinutes: number | null): SelectOption[] {
  const org: SelectOption =
    orgMinutes === null
      ? { value: 'org', label: 'Company default' }
      : { value: 'org', label: 'Company default ({minutes} min)', values: { minutes: orgMinutes } };
  return [
    org,
    { value: '1', label: 'Every minute' },
    { value: '2', label: 'Every {minutes} minutes', values: { minutes: 2 } },
    { value: '5', label: 'Every {minutes} minutes', values: { minutes: 5 } },
    { value: '10', label: 'Every {minutes} minutes', values: { minutes: 10 } },
  ];
}
