import { useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Stack, Text, lineHeight } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useCrmRecordSummaryMutation,
  type CrmTimelineObject,
} from '@exyconn/shell/graphql/generated';

/**
 * The AI summary of a record: what they are interested in, what happened, what is next — from
 * the whole timeline. Written on request (it spends AI budget), never on page load.
 */
export function AiSummary({
  object,
  id,
  name,
}: Readonly<{ object: CrmTimelineObject; id: string; name: string }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const [summarise, { loading }] = useCrmRecordSummaryMutation();
  const [summary, setSummary] = useState<{ text: string; at: Date } | null>(null);
  const [problem, setProblem] = useState('');

  const run = async () => {
    setProblem('');
    try {
      const { data } = await summarise({ variables: { object, id } });
      setSummary({ text: data?.crmRecordSummary ?? '', at: new Date() });
    } catch (error) {
      portalLogger.warn('crm: the AI summary failed', error);
      setProblem(errorMessage(error, t('The AI could not write a summary.')));
    }
  };

  return (
    <Box component="section" aria-label={t('{name} summary', { name })} sx={panel}>
      <Flex
        direction="row"
        spacing={1}
        alignItems="flex-start"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
      >
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Text component="h2" size="label" weight="bold">
            {t('{name} summary', { name })}
          </Text>
          {summary && (
            <Text component="p" size="caption" color="text.secondary">
              <time dateTime={summary.at.toISOString()}>
                {t('Generated {when}', { when: formatDateTime(summary.at) })}
              </time>
            </Text>
          )}
        </Stack>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AutoAwesomeIcon />}
          loading={loading}
          onClick={() =>
            run().catch((error: unknown) => portalLogger.warn('crm: AI summary failed', error))
          }
        >
          {summary ? t('Refresh summary') : t('Summarise with AI')}
        </Button>
      </Flex>
      {problem && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {problem}
        </Alert>
      )}
      {summary ? (
        <Text
          component="p"
          sx={{ mt: 1.5, mb: 0, whiteSpace: 'pre-line', lineHeight: lineHeight.relaxed }}
        >
          {summary.text}
        </Text>
      ) : (
        <Text component="p" size="sm" color="text.secondary" sx={{ mt: 1.5, mb: 0 }}>
          {t(
            'Summarise this record from its timeline: what they are interested in, what has happened and what comes next.',
          )}
        </Text>
      )}
    </Box>
  );
}
