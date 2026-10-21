import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import type { MaEvidenceFieldsFragment } from '@exyconn/shell/graphql/generated';
import { formatOffset } from './format';

/**
 * The transcript lines an extracted decision or action rests on, quoted with when and by whom
 * they were said — so nobody has to take the AI's word for it.
 */
export function EvidenceQuotes({
  evidence,
}: Readonly<{ evidence: readonly MaEvidenceFieldsFragment[] }>) {
  const t = useT();
  if (evidence.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        {t('No supporting quote was recorded.')}
      </Text>
    );
  }
  return (
    <Box component="ul" sx={{ m: 0, pl: 0, listStyle: 'none' }}>
      {evidence.map((quote) => (
        <Box
          component="li"
          key={quote.segmentId}
          sx={{ borderLeft: 3, borderColor: 'divider', pl: 1.5, my: 1 }}
        >
          <Text component="q" size="sm" sx={{ fontStyle: 'italic' }}>
            {quote.quote}
          </Text>
          <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
            {t('{speaker} at {offset}', {
              speaker: quote.speakerLabel ?? t('Unknown speaker'),
              offset: formatOffset(quote.startMs),
            })}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
