import { useT, useFormatters } from '@exyconn/i18n';
import { Box, Paper, Text, Typography } from '@exyconn/shell/components/ui';
import type { EmailVerificationFieldsFragment } from '@exyconn/shell/graphql/generated';
import { EmailLink } from '@exyconn/shell/components/email';
import { EmailStatusBadge } from '../../email-verification';

/** The checks behind a result, in the words a salesperson would use. */
const FACTS: Array<[keyof EmailVerificationFieldsFragment, string]> = [
  ['syntaxValid', 'Well-formed address'],
  ['hasMx', 'Domain receives email'],
  ['deliverable', 'Mailbox exists'],
  ['catchAll', 'Domain accepts any address'],
  ['disposable', 'Disposable address'],
  ['roleAccount', 'Role address (info@, sales@ …)'],
];

/** One check's result: the badge, why, and what was found. */
export function EmailCheckResult({
  result,
}: Readonly<{ result: EmailVerificationFieldsFragment }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
        <Typography
          variant="subtitle1"
          component="h3"
          sx={{ fontWeight: 600, wordBreak: 'break-all' }}
        >
          <EmailLink address={result.email} />
        </Typography>
        <EmailStatusBadge verification={result} />
      </Box>
      {result.reason && <Text sx={{ display: 'block', mb: 1 }}>{t(result.reason)}</Text>}
      {result.suggestion && (
        <Text color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {t('Did you mean {suggestion}?', { suggestion: result.suggestion })}
        </Text>
      )}
      <Box
        component="dl"
        sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 0.5, m: 0 }}
      >
        {FACTS.map(([key, label]) => (
          <Box key={key} sx={{ display: 'contents' }}>
            <Text component="dt" color="text.secondary">
              {t(label)}
            </Text>
            <Text component="dd" sx={{ m: 0 }}>
              {result[key] ? t('Yes') : t('No')}
            </Text>
          </Box>
        ))}
      </Box>
      <Text size="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        {t('Checked {when} by {who}', {
          when: formatDateTime(result.checkedAt),
          who: result.checkedBy,
        })}
      </Text>
    </Paper>
  );
}
