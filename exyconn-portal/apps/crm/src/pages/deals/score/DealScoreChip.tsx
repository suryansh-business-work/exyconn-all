import { useT } from '@exyconn/i18n';
import { Box, Chip, Tooltip } from '@exyconn/shell/components/ui';
import type { DealRow } from '../forms/deal';
import { scoreColor } from '../../integrations/email/health/mailHealth';

type Scored = Pick<DealRow, 'score' | 'scoreReasons'>;

/** "+10" or "-5": how far one reason moved the score. */
export const signedImpact = (impact: number) => (impact > 0 ? `+${impact}` : String(impact));

/**
 * A deal's score as a chip, coloured green, amber or red, with the reasons behind it on hover
 * and focus. "Not scored" until the server has scored the deal.
 */
export function DealScoreChip({ deal }: Readonly<{ deal: Scored }>) {
  const t = useT();
  if (deal.score == null) {
    return <Chip size="small" variant="outlined" label={t('Not scored')} />;
  }
  const reasons = deal.scoreReasons
    .map((reason) => `${signedImpact(reason.impact)} ${reason.text}`)
    .join('\n');
  return (
    <Tooltip
      title={
        <Box component="span" sx={{ whiteSpace: 'pre-line' }}>
          {reasons}
        </Box>
      }
    >
      <Chip
        size="small"
        color={scoreColor(deal.score)}
        label={t('{score}/100', { score: deal.score })}
        // A plain chip is a div, which may not carry a name; as an image it may, and focus
        // still opens the reasons for keyboard users.
        role="img"
        aria-label={t('Deal score {score} out of 100', { score: deal.score })}
        tabIndex={0}
      />
    </Tooltip>
  );
}
