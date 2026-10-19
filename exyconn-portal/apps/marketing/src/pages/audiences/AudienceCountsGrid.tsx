import { useFormatters, useT } from '@exyconn/i18n';
import { Box, Grid, Skeleton, Text } from '@exyconn/shell/components/ui';
import type { AudienceCountsFieldsFragment } from '@exyconn/shell/graphql/generated';

type CountKey = keyof Omit<AudienceCountsFieldsFragment, '__typename'>;

/** Each figure with what it means. The English label is the translation key. */
const TILES: ReadonlyArray<{ key: CountKey; label: string; hint: string }> = [
  { key: 'contacts', label: 'Contacts', hint: 'Matching contact records' },
  { key: 'companies', label: 'Companies', hint: 'Matching company records' },
  { key: 'rawEmails', label: 'Email addresses found', hint: 'Before duplicates are removed' },
  { key: 'duplicates', label: 'Duplicates', hint: 'Same address on several records' },
  { key: 'uniqueEmails', label: 'Unique addresses', hint: 'One per inbox' },
  {
    key: 'suppressed',
    label: 'Unsubscribed / blocked',
    hint: 'On the suppression list or opted out',
  },
  { key: 'optedOut', label: 'Opted out of category', hint: 'Turned this kind of email off' },
  { key: 'invalid', label: 'Invalid', hint: 'Failed email verification' },
  { key: 'excluded', label: 'Other exclusions', hint: 'Left company, excluded or filtered' },
  {
    key: 'eligible',
    label: 'Final eligible recipients',
    hint: 'Unique addresses that will be sent to',
  },
  {
    key: 'recordsWithoutEmail',
    label: 'Records without email',
    hint: 'Matched, but nothing to send to',
  },
];

interface AudienceCountsGridProps {
  counts: AudienceCountsFieldsFragment | null;
  /** The figures shown are older than the settings; dimmed and announced as updating. */
  stale: boolean;
}

/** Every audience figure, all from the server. While updating, old figures are dimmed. */
export function AudienceCountsGrid({ counts, stale }: Readonly<AudienceCountsGridProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  return (
    <Grid container spacing={1.5} aria-busy={stale} sx={{ opacity: stale && counts ? 0.55 : 1 }}>
      {TILES.map((tile) => (
        <Grid key={tile.key} size={{ xs: 6, sm: 4 }}>
          <Box>
            <Text size="lg" weight="semibold" sx={{ display: 'block' }}>
              {counts ? formatNumber(counts[tile.key]) : <Skeleton width={48} />}
            </Text>
            <Text size="sm" sx={{ display: 'block' }}>
              {t(tile.label)}
            </Text>
            <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
              {t(tile.hint)}
            </Text>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}
