import { Box } from '@exyconn/shell/components/ui';
import type { ChatMessage, UserContent } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_RADIUS, WA_SPACE } from '../../../theme/wa.tokens';
import { Bubble } from './Bubble';
import { FormattedText } from './FormattedText';
import type { Frame } from './types';

interface UserMessageProps {
  content: UserContent;
  status: ChatMessage['status'];
  frame: Frame;
}

/** The viewer's own bubble; a tapped option shows the message it answered, quoted. */
export function UserMessage({ content, status, frame }: Readonly<UserMessageProps>) {
  const c = useWaPalette();
  return (
    <Bubble mine tail={frame.tail} time={frame.time} status={status}>
      {content.type === 'reply' ? (
        <Box
          sx={{
            mb: WA_SPACE.xxs,
            px: WA_SPACE.sm,
            py: WA_SPACE.xxs,
            borderRadius: WA_RADIUS.card,
            borderLeft: `${WA_LINE.quote} solid ${c.quoteBar}`,
            bgcolor: c.quote,
            color: c.textMuted,
            fontSize: WA_FONT.small,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <FormattedText text={content.quoted} />
        </Box>
      ) : null}
      <FormattedText text={content.text} />
    </Bubble>
  );
}
