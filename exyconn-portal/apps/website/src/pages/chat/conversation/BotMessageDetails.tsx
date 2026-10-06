import { useT } from '@exyconn/i18n';
import { HTTP_URL } from '@exyconn/regex';
import LinkIcon from '@mui/icons-material/Link';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { Chip, Flex, Text, Tooltip } from '@exyconn/shell/components/ui';
import { WebsiteChatFeedback } from '@exyconn/shell/graphql/generated';
import type { ChatMessage } from '../socket/chatSocket.types';

type Props = Readonly<{ message: ChatMessage }>;

/** The pages the bot's answer was drawn from, as links. */
function Sources({ message }: Props) {
  const t = useT();
  const links = message.sources.filter((source) => HTTP_URL.test(source.url));
  if (links.length === 0) {
    return null;
  }
  return (
    <Flex direction="row" spacing={0.5} wrap alignItems="center">
      <Text size="caption" color="text.secondary">
        {t('Sources')}
      </Text>
      {links.map((source) => (
        <Chip
          key={source.url}
          component="a"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          size="small"
          variant="outlined"
          icon={<LinkIcon />}
          label={source.title || source.url}
          aria-label={source.title || source.url}
        />
      ))}
    </Flex>
  );
}

/** The follow-up questions the visitor was offered; the team only sees them. */
function Suggestions({ message }: Props) {
  const t = useT();
  if (message.suggestions.length === 0) {
    return null;
  }
  return (
    <Flex direction="row" spacing={0.5} wrap alignItems="center">
      <Text size="caption" color="text.secondary">
        {t('Suggested to visitor')}
      </Text>
      {message.suggestions.map((suggestion) => (
        <Chip key={suggestion} size="small" label={suggestion} />
      ))}
    </Flex>
  );
}

/** Thumbs up or down: what the visitor thought of the answer, once they rated it. */
function Feedback({ message }: Props) {
  const t = useT();
  if (!message.feedback) {
    return null;
  }
  const helpful = message.feedback === WebsiteChatFeedback.Up;
  const Icon = helpful ? ThumbUpIcon : ThumbDownIcon;
  const label = helpful
    ? t('The visitor found this answer helpful')
    : t('The visitor found this answer unhelpful');
  return (
    <Tooltip title={label}>
      <Icon
        tabIndex={0}
        role="img"
        aria-hidden={false}
        aria-label={label}
        fontSize="small"
        color={helpful ? 'success' : 'error'}
      />
    </Tooltip>
  );
}

/** Under a bot answer: its sources, the follow-ups the visitor was offered and their rating. */
export function BotMessageDetails({ message }: Props) {
  return (
    <Flex direction="column" spacing={0.5} sx={{ mt: 0.5, maxWidth: { xs: '90%', md: '70%' } }}>
      <Sources message={message} />
      <Suggestions message={message} />
      <Feedback message={message} />
    </Flex>
  );
}
