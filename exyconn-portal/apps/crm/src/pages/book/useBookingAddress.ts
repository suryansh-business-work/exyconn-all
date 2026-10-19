import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CURRENT_ORGANIZATION_SLUG } from '@exyconn/shell/config/organizationPath';

/** Where a public booking page is: the company in the address prefix and the page's own part. */
export interface BookingAddress {
  org: string;
  page: string;
}

/**
 * The address of the booking page this is: /organization/<org>/book/<page>[/<slug>]. The
 * company comes from the address prefix, so its name is never repeated in the path.
 */
export function useBookingAddress(): { at: BookingAddress; slug: string } {
  const { page = '', slug = '' } = useParams();
  const at = useMemo(() => ({ org: CURRENT_ORGANIZATION_SLUG ?? '', page }), [page]);
  return { at, slug };
}
