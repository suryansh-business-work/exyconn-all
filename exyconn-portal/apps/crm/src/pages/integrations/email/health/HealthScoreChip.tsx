import { useT } from '@exyconn/i18n';
import { Chip } from '@exyconn/shell/components/ui';
import { scoreColor } from './mailHealth';

/** A domain's Setup Score as a chip: green when ready, amber or red when it needs work. */
export function HealthScoreChip({ score }: Readonly<{ score: number | null | undefined }>) {
  const t = useT();
  if (score == null) {
    return <Chip size="small" variant="outlined" label={t('Not checked')} />;
  }
  return (
    <Chip
      size="small"
      color={scoreColor(score)}
      label={t('{score}/100', { score })}
      aria-label={t('Setup Score {score} out of 100', { score })}
    />
  );
}
