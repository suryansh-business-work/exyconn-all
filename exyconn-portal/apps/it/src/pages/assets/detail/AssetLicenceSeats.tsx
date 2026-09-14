import { useT } from '@exyconn/i18n';
import { Card, Flex, Typography } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useLicenceSeatsForQuery } from '@exyconn/shell/graphql/generated';

interface AssetLicenceSeatsProps {
  /** The employee holding this asset. Empty when nobody does — the card is then hidden. */
  employeeId: string;
  employeeName: string;
  formatDate: (value: string) => string;
}

/**
 * What else the person holding this asset has been given.
 *
 * Read straight off the licence register's `assigneeIds`, so "what does this person have"
 * is answerable from the asset they are holding rather than from two screens at once.
 */
export function AssetLicenceSeats({
  employeeId,
  employeeName,
  formatDate,
}: Readonly<AssetLicenceSeatsProps>) {
  const t = useT();
  const { data } = useLicenceSeatsForQuery({
    variables: { employeeId },
    skip: employeeId === '',
  });

  if (employeeId === '') {
    return null;
  }

  const seats = data?.licenceSeatsFor ?? [];
  const heading = employeeName
    ? t('Licences held by {name} ({count})', { name: employeeName, count: seats.length })
    : t('Licences held ({count})', { count: seats.length });

  return (
    <Card variant="outlined" sx={{ p: { xs: 2, md: 2 } }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1.5,
        }}
      >
        {heading}
      </Typography>
      {seats.length === 0 ? (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
          }}
        >
          {t('No licence seats are assigned to this person.')}
        </Typography>
      ) : (
        <Flex direction="column" spacing={1}>
          {seats.map((seat) => (
            <Flex key={seat.id} alignItems="center" spacing={1.5}>
              <Typography variant="body2" sx={{ flex: 1 }}>
                {seat.name} · {seat.vendor}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                }}
              >
                {t('Renews {date}', { date: formatDate(seat.renewalDate) })}
              </Typography>
              <StatusChip value={seat.status} />
            </Flex>
          ))}
        </Flex>
      )}
    </Card>
  );
}
