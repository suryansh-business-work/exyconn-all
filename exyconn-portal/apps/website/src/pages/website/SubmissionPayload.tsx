import { useT } from '@exyconn/i18n';
import { Box, Link, Typography } from '@exyconn/shell/components/ui';
import { entriesOf } from './submission.fields';

interface SubmissionPayloadProps {
  /** Raw `JSON` scalar captured by the public website form — shape varies per form type. */
  data: unknown;
}

/**
 * What the visitor filled in, as a labelled list rather than raw JSON: one field per line,
 * long answers wrapped, an email or phone number ready to click.
 */
export function SubmissionPayload({ data }: Readonly<SubmissionPayloadProps>) {
  const t = useT();
  const entries = entriesOf(data);
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" component="h3" sx={{ mb: 1 }}>
        {t('What they sent')}
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('No payload captured for this submission.')}
        </Typography>
      ) : (
        <Box
          component="dl"
          sx={{
            m: 0,
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(96px, auto) 1fr' },
            columnGap: 2,
            rowGap: 1,
          }}
        >
          {entries.map((entry) => (
            <Box key={entry.key} sx={{ display: 'contents' }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                {entry.label}
              </Typography>
              <Typography
                component="dd"
                variant="body2"
                sx={{ m: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
              >
                {entry.link ? <Link href={entry.link}>{entry.value}</Link> : entry.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
