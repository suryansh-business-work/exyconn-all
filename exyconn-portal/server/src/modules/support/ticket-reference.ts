import { SupportTicketModel } from '../employee/support.model';
import { newReference } from '../status/reference';

/** How many times a collision is retried before the reference is accepted as-is. */
const ATTEMPTS = 5;

/**
 * A quotable handle for a ticket (`EXY-4KQ7W2`), checked against what is already filed.
 *
 * The alphabet gives roughly a billion codes, so a collision is a curiosity rather than a
 * risk — but a customer following the wrong ticket is not a failure mode worth leaving to
 * chance, so it is checked. After `ATTEMPTS` unlucky draws the last one is used: a ticket
 * that was raised must never be lost to reference generation.
 */
export async function uniqueReference(): Promise<string> {
  let reference = newReference();
  for (let attempt = 1; attempt < ATTEMPTS; attempt += 1) {
    const taken = await SupportTicketModel.exists({ reference });
    if (!taken) {
      return reference;
    }
    reference = newReference();
  }
  return reference;
}
