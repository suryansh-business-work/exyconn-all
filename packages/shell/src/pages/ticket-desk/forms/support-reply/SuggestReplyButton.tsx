import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Button, Stack, Text } from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useSuggestSupportReplyMutation } from '@/graphql/generated';

interface Props {
  ticketId: string;
  /** Called with the drafted text. The form decides where it lands. */
  onSuggest: (body: string) => void;
}

/**
 * Asks the AI for a draft reply built from the ticket, the matching knowledge-base articles and
 * the canned replies. The draft lands in the message box to be edited; nothing is sent. Each
 * draft is an AI run, so it counts against the AI budget like any other.
 */
export function SuggestReplyButton({ ticketId, onSuggest }: Readonly<Props>) {
  const t = useT();
  const notify = useNotify();
  const [suggest, { loading }] = useSuggestSupportReplyMutation();
  const [sources, setSources] = useState<string[]>([]);

  const draft = async () => {
    try {
      const { data } = await suggest({ variables: { ticketId } });
      const suggestion = data?.suggestSupportReply;
      if (!suggestion) {
        return;
      }
      onSuggest(suggestion.body);
      setSources(suggestion.articles.map((article) => article.title));
    } catch (error) {
      notify(errorMessage(error, 'Could not draft a reply'), 'error');
    }
  };

  return (
    <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AutoAwesomeIcon />}
        onClick={draft}
        disabled={loading}
      >
        {loading ? t('Drafting…') : t('Suggest a reply')}
      </Button>
      {sources.length > 0 && (
        <Text size="caption" color="text.secondary">
          {t('Drafted from: {articles}', { articles: sources.join(', ') })}
        </Text>
      )}
    </Stack>
  );
}
