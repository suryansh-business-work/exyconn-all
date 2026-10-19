import { CompanyModel } from './company.model';
import { ContactModel } from './contact.model';
import { ORIGIN_LABEL } from './crm.origin';

/** The `leadSource` the Google Places import and the booking page wrote before origins existed. */
const GOOGLE_PLACES_SOURCE = 'Google Places';
const BOOKING_SOURCE = 'Meeting booking';

const NO_ORIGIN = { $or: [{ origin: { $exists: false } }, { origin: null }] };

/** The person in `owner` as the creator: every path before origins wrote the creator there. */
const byOwner = (source: string) => [
  {
    $set: {
      origin: { source, userId: '', userName: '$owner', userEmail: '' },
      leadOwner: '$owner',
    },
  },
];

/**
 * Gives every company and contact filed before origins were kept one. A Google Places import
 * put whoever ran it in `owner`, so that name moves to the lead owner and the account is left
 * for somebody to take on; anything else keeps its owner, who also created it.
 */
export async function backfillCrmOrigins(): Promise<void> {
  await CompanyModel.updateMany({ ...NO_ORIGIN, leadSource: GOOGLE_PLACES_SOURCE }, [
    ...byOwner('GOOGLE_PLACES'),
    { $set: { owner: '' } },
  ]);
  await CompanyModel.updateMany(NO_ORIGIN, byOwner('USER'));
  await ContactModel.updateMany({ ...NO_ORIGIN, leadSource: BOOKING_SOURCE }, [
    {
      $set: {
        origin: { source: 'MEETING_BOOKING', userId: '', userName: '', userEmail: '' },
        leadOwner: ORIGIN_LABEL.MEETING_BOOKING,
      },
    },
  ]);
  await ContactModel.updateMany(NO_ORIGIN, byOwner('USER'));
}
