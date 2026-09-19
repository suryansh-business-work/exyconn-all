import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  Box,
  Button,
  CircularProgress,
  Flex,
  Heading,
  MenuItem,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { AiAssistPreview } from '@exyconn/shell/components/ai/AiAssistPreview';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useSocialMediaIdeasMutation,
  useSocialMediaInsightsMutation,
} from '@exyconn/shell/graphql/generated';

const IDEA_COUNTS = [3, 5, 10] as const;

/** AI on the company's own posts: what worked and why, and fresh ideas in the same voice. */
export function AiInsightsPanel({ days }: Readonly<{ days: number }>) {
  const t = useT();
  const notify = useNotify();
  const [analyse, analysis] = useSocialMediaInsightsMutation();
  const [ideate, ideas] = useSocialMediaIdeasMutation();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(5);

  const run = (work: () => Promise<unknown>) => {
    work().catch((error: unknown) => {
      portalLogger.warn('An AI request failed', error);
      notify(errorMessage(error, 'The AI request failed'), 'error');
    });
  };

  return (
    <Box sx={panel}>
      <Heading level={6}>{t('AI insights')}</Heading>
      <Text component="p" size="sm" color="text.secondary" sx={{ mb: 1.5 }}>
        {t('Runs on your AI budget and appears in the AI history.')}
      </Text>
      <Flex direction="row" spacing={1} alignItems="center" wrap sx={{ mb: 1.5 }}>
        <Button
          variant="contained"
          startIcon={
            analysis.loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />
          }
          disabled={analysis.loading}
          onClick={() => run(() => analyse({ variables: { days } }))}
        >
          {t('Analyse the last {days} days', { days })}
        </Button>
      </Flex>
      {analysis.data && (
        <AiAssistPreview label={t('What the posts say')} body={analysis.data.socialMediaInsights} />
      )}

      <Flex direction="row" spacing={1} alignItems="flex-start" wrap sx={{ mt: 2 }}>
        <TextField
          size="small"
          label={t('Ideas about')}
          placeholder={t('e.g. our new AI agents for retail')}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          slotProps={{ htmlInput: { maxLength: 300 } }}
        />
        <TextField
          select
          size="small"
          label={t('How many')}
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
          sx={{ width: 120 }}
        >
          {IDEA_COUNTS.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        <Button
          startIcon={
            ideas.loading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />
          }
          disabled={ideas.loading || !topic.trim()}
          onClick={() => run(() => ideate({ variables: { topic, count } }))}
        >
          {t('Generate ideas')}
        </Button>
      </Flex>
      {ideas.data && (
        <Box sx={{ mt: 1.5 }}>
          <AiAssistPreview label={t('Post ideas')} body={ideas.data.socialMediaIdeas} />
        </Box>
      )}
    </Box>
  );
}
