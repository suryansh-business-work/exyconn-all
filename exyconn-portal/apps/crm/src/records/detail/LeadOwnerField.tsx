import { useT } from '@exyconn/i18n';
import { Chip, Flex } from '@exyconn/shell/components/ui';
import { CrmOriginSource, type CrmRecordOrigin } from '@exyconn/shell/graphql/generated';
import { EmailLink } from '@exyconn/shell/components/email';
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

/** The colleague who created the record, their address opening the email window. */
function OwnerName({ name, email }: Readonly<{ name: string; email?: string | null }>) {
  return (
    <span>
      {name}
      {email && (
        <>
          {' ('}
          <EmailLink address={email} />)
        </>
      )}
    </span>
  );
}

/**
 * "Lead owner": who created the record (name and email), or what brought it in when nobody
 * did — the website, a booking link — with the source beside it.
 */
export function LeadOwnerField({ origin }: Readonly<{ origin?: Origin | null }>) {
  const t = useT();
  return (
    <DetailField label="Lead owner" empty="Not recorded">
      {origin && (
        <Flex direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
          {origin.userName && <OwnerName name={origin.userName} email={origin.userEmail} />}
          <Chip size="small" variant="outlined" label={t(SOURCE_LABEL[origin.source])} />
        </Flex>
      )}
    </DetailField>
  );
}
