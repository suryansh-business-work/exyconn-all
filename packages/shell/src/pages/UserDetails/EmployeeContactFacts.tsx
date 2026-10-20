import { useT } from '@exyconn/i18n';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { Box, Chip, Flex, Link } from '@/components/ui';
import { DetailFact, DetailFactGrid } from '@/components/data/DetailFact';
import { WorkDayChips } from '@/components/work';
import type { UserDetail } from './user-details.types';

interface AddressProps {
  address: string;
  verifiedAt: string | null | undefined;
}

/** An address with whether a code sent to it has proven it. */
function VerifiedAddress({ address, verifiedAt }: Readonly<AddressProps>) {
  const t = useT();
  const verified = Boolean(verifiedAt);
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Link href={`mailto:${address}`}>{address}</Link>
      <Chip
        size="small"
        variant={verified ? 'filled' : 'outlined'}
        color={verified ? 'success' : 'default'}
        icon={verified ? <VerifiedIcon fontSize="small" /> : <ErrorOutlineIcon fontSize="small" />}
        label={verified ? t('Verified') : t('Unverified')}
      />
    </Flex>
  );
}

/** The employee's two addresses and the days they work. */
export function EmployeeContactFacts({ user }: Readonly<{ user: UserDetail }>) {
  return (
    <>
      <DetailFactGrid>
        <DetailFact label="Official email">
          <VerifiedAddress address={user.email} verifiedAt={user.emailVerifiedAt} />
        </DetailFact>
        <DetailFact label="Personal email">
          {user.personalEmail ? (
            <VerifiedAddress
              address={user.personalEmail}
              verifiedAt={user.personalEmailVerifiedAt}
            />
          ) : (
            '—'
          )}
        </DetailFact>
      </DetailFactGrid>
      <Box sx={{ mt: 2 }}>
        <DetailFact label="Work days">
          <WorkDayChips days={user.effectiveWorkDays} fromCompany={!user.workDays?.length} />
        </DetailFact>
      </Box>
    </>
  );
}
