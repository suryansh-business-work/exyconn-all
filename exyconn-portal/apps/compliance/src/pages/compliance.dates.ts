import { z } from 'zod';

/**
 * A required date as the shared `RhfDatePicker` leaves it.
 *
 * A form starts from Date objects, but the picker writes back the ISO string of whatever is
 * picked (and '' once it is cleared), so a bare `z.date()` refused every date anybody changed
 * and the record could no longer be saved. A cleared picker still fails, with `message`.
 */
export const pickedDate = (message: string) => z.coerce.date({ message });

/** An optional date: a cleared picker ('') means "no date", not an invalid one. */
export const optionalPickedDate = () =>
  z.preprocess((value) => (value === '' ? null : value), z.coerce.date().nullable());
