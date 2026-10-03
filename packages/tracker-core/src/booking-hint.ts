import type { Translate } from './translate';

/** Where a booking picker (the project, the ticket) stands right now. */
export interface BookingPickerState {
  /** Its list is still being read from the portal. */
  loading: boolean;
  /** A running session is already booked to it. */
  locked: boolean;
}

/**
 * The line under the project picker. Loading comes first: a list that has not arrived yet
 * cannot be the reason anything is locked.
 */
export function projectHint(t: Translate, picker: BookingPickerState): string | undefined {
  if (picker.loading) {
    return t('Loading projects…');
  }
  if (picker.locked) {
    return t('Locked while tracking — stop to book to another project.');
  }
  return undefined;
}

/** The line under the ticket picker — which is optional, and says so when nothing else applies. */
export function ticketHint(t: Translate, picker: BookingPickerState): string {
  if (picker.loading) {
    return t('Loading tickets…');
  }
  if (picker.locked) {
    return t('Locked while tracking — stop to book to another ticket.');
  }
  return t('Optional.');
}
