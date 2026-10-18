import { useT } from '@exyconn/i18n';
import { Chip, Flex } from '@exyconn/shell/components/ui';
import { CrmOriginSource, type CrmRecordOrigin } from '@exyconn/shell/graphql/generated';
import { DetailField } from './DetailField';

/** What brought a record in, as the chip beside its lead owner reads. */
const SOURCE_LABEL: Readonly<Record<CrmOriginSource, string>> = {
  [CrmOriginSource.User]: 'Added by hand',
  [CrmOriginSource.Website]: 'From website',
  [CrmOriginSource.GooglePlaces]: 'Google Places',
  [CrmOriginSource.MeetingBooking]: 'Meeting booking',
  [CrmOriginSource.LeadConversion]: 'Converted lead',
};

type Origin = Pick<CrmRecordOrigin, 'source' | 'userName' | 'userEmail'>;

/**
 * "Lead owner": who created the record (name and email), or what brought it in when nobody
 * did — the website, a booking link — with the source beside it.
 */
export function LeadOwnerField({ origin }: Readonly<{ origin?: Origin | null }>) {
  const t = useT();
  const email = origin?.userEmail ? ` (${origin.userEmail})` : '';
  const person = origin?.userName ? origin.userName + email : '';
  return (
    <DetailField label="Lead owner" empty="Not recorded">
      {origin && (
        <Flex direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {person && <span>{person}</span>}
          <Chip size="small" variant="outlined" label={t(SOURCE_LABEL[origin.source])} />
        </Flex>
      )}
    </DetailField>
  );
}
