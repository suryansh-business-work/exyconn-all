import { useFormatters, useT } from '@exyconn/i18n';
import { Chip, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import type { MaMeetingDetailFragment } from '@exyconn/shell/graphql/generated';

type Mapping = MaMeetingDetailFragment['speakerMappings'][number];

/** The speakers people have confirmed so far, each with who confirmed them and when. */
export function SpeakerMappings({ mappings }: Readonly<{ mappings: readonly Mapping[] }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  if (mappings.length === 0) {
    return null;
  }
  return (
    <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
      <Text size="sm" color="text.secondary">
        {t('Confirmed speakers')}
      </Text>
      {mappings.map((mapping) => (
        <Tooltip
          key={mapping.label}
          title={t('Confirmed by {name} on {when}', {
            name: mapping.confirmedByName,
            when: formatDateTime(mapping.confirmedAt),
          })}
        >
          <Chip
            tabIndex={0}
            size="small"
            variant="outlined"
            label={`${mapping.label} → ${mapping.name}`}
          />
        </Tooltip>
      ))}
    </Flex>
  );
}
