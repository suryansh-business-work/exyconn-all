import CheckIcon from '@mui/icons-material/Check';
import { useT } from '@exyconn/i18n';
import { Chip, Flex, Stack, Text } from '@exyconn/shell/components/ui';

interface FilterChipProps {
  label: string;
  on: boolean;
  onToggle: () => void;
}

/** A filter that is on or off, announced as a pressed button. */
function FilterChip({ label, on, onToggle }: Readonly<FilterChipProps>) {
  return (
    <Chip
      label={label}
      color={on ? 'primary' : 'default'}
      variant={on ? 'filled' : 'outlined'}
      icon={on ? <CheckIcon aria-hidden /> : undefined}
      aria-pressed={on}
      onClick={onToggle}
    />
  );
}

interface LeadFiltersProps {
  shown: number;
  total: number;
  hasPhone: boolean;
  hasEmail: boolean;
  needsLookup: boolean;
  onTogglePhone: () => void;
  onToggleEmail: () => void;
}

/** "Has phone" and "Has email" over the loaded results, with how many are showing. */
export function LeadFilters({
  shown,
  total,
  hasPhone,
  hasEmail,
  needsLookup,
  onTogglePhone,
  onToggleEmail,
}: Readonly<LeadFiltersProps>) {
  const t = useT();
  return (
    <Stack spacing={0.5}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <FilterChip label={t('Has phone')} on={hasPhone} onToggle={onTogglePhone} />
        <FilterChip label={t('Has email')} on={hasEmail} onToggle={onToggleEmail} />
        <Text size="caption" color="text.secondary" role="status">
          {t('Showing {shown} of {total}', { shown, total })}
        </Text>
      </Flex>
      {needsLookup && (
        <Text size="caption" color="text.secondary">
          {t('Find emails first to filter by email')}
        </Text>
      )}
    </Stack>
  );
}
