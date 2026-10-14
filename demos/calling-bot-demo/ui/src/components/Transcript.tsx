import { useEffect, useRef } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Text } from '@exyconn/shell/components/ui';
import { CallingBotTurnRole } from '@exyconn/shell/graphql/generated';
import type { TranscriptLine } from '../call/transcript';

/** One line: the caller's on the right, the bot's on the left, like a chat. */
function Line({ line }: Readonly<{ line: TranscriptLine }>) {
  const t = useT();
  const mine = line.role === CallingBotTurnRole.Caller;
  return (
    <Box
      component="li"
      sx={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        px: 1.5,
        py: 1,
        borderRadius: 2,
        bgcolor: mine ? 'primary.main' : 'action.hover',
        color: mine ? 'primary.contrastText' : 'text.primary',
      }}
    >
      <Text size="caption" sx={{ display: 'block', opacity: 0.8 }}>
        {mine ? t('You') : t('Bot')}
      </Text>
      <Text>{line.text}</Text>
    </Box>
  );
}

/** What has been said on the call, newest at the bottom, read out to screen readers as it comes. */
export function Transcript({ lines }: Readonly<{ lines: TranscriptLine[] }>) {
  const t = useT();
  const end = useRef<HTMLLIElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'nearest' });
  }, [lines.length]);

  if (lines.length === 0) {
    return (
      <Text color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
        {t('What you and the bot say appears here.')}
      </Text>
    );
  }
  // A scrollable region is focusable so a keyboard can scroll it (WCAG 2.1.1).
  return (
    <Box
      role="region"
      aria-label={t('Transcript')}
      tabIndex={0}
      sx={{ maxHeight: 360, overflowY: 'auto' }}
    >
      <Box
        component="ol"
        aria-live="polite"
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {lines.map((line) => (
          <Line key={line.key} line={line} />
        ))}
        <li ref={end} aria-hidden />
      </Box>
    </Box>
  );
}
