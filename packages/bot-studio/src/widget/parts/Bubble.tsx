import type { ReactNode } from 'react';
import { Box, Typography } from '@exyconn/shell/components/ui';
import { useWidgetActions } from '../WidgetActions';

interface BubbleProps {
  mine: boolean;
  /** Time it was sent, already formatted. */
  time: string;
  /** A person's name after a handoff; the bot's messages carry none. */
  sender?: string;
  /** Cards and carousels use the full width instead of a bubble. */
  bare?: boolean;
  children: ReactNode;
}

/** One message: the visitor's on the right in the business's colour, the agent's on the left. */
export function Bubble({ mine, time, sender, bare = false, children }: Readonly<BubbleProps>) {
  const { look } = useWidgetActions();
  const surface = mine
    ? { bgcolor: look.fill, color: look.onFill }
    : { bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider' };
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: mine ? 'flex-end' : 'flex-start',
        maxWidth: bare ? '100%' : '86%',
        alignSelf: mine ? 'flex-end' : 'flex-start',
        minWidth: 0,
      }}
    >
      {sender && (
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600 }}>
          {sender}
        </Typography>
      )}
      {bare ? (
        children
      ) : (
        <Box
          sx={{
            ...surface,
            px: 1.5,
            py: 1,
            borderRadius: 1,
            fontSize: 'body2.fontSize',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
            boxShadow: mine ? 0 : 1,
          }}
        >
          {children}
        </Box>
      )}
      <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {time}
      </Typography>
    </Box>
  );
}
