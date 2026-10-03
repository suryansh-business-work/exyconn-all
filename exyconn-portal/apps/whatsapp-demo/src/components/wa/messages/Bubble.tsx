import type { ReactNode } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import type { MessageStatus } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SHADOW, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { Ticks } from './Ticks';

interface BubbleProps {
  mine: boolean;
  /** First of a run from the same sender: gets the tail. */
  tail: boolean;
  time: string;
  status?: MessageStatus;
  /** Cards and media fill the bubble edge to edge. */
  flush?: boolean;
  /** Width for cards, instead of shrinking to the text. */
  width?: string;
  children: ReactNode;
}

function Tail({ mine, fill }: Readonly<{ mine: boolean; fill: string }>) {
  const d = mine ? 'M0 0h6.5c1 0 1.5 1.2.8 2L0 13z' : 'M8 0H1.5C.5 0 0 1.2.7 2L8 13z';
  return (
    <Box
      component="svg"
      aria-hidden
      viewBox="0 0 8 13"
      sx={{
        position: 'absolute',
        top: 0,
        width: WA_SIZE.tail,
        height: WA_SIZE.tailHeight,
        [mine ? 'right' : 'left']: `-${WA_SIZE.tail}`,
      }}
    >
      <path d={d} fill={fill} />
    </Box>
  );
}

/** A message bubble: colour by sender, tail on the first of a run, time and ticks bottom-right. */
export function Bubble({
  mine,
  tail,
  time,
  status,
  flush,
  width,
  children,
}: Readonly<BubbleProps>) {
  const c = useWaPalette();
  const fill = mine ? c.bubbleOut : c.bubbleIn;
  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: fill,
        color: c.text,
        borderRadius: WA_RADIUS.bubble,
        [mine ? 'borderTopRightRadius' : 'borderTopLeftRadius']: tail ? 0 : WA_RADIUS.bubble,
        boxShadow: WA_SHADOW.bubble,
        p: flush ? WA_SPACE.hair : `${WA_SPACE.xs} ${WA_SPACE.sm} ${WA_SPACE.sm}`,
        width,
        maxWidth: '100%',
        fontSize: WA_FONT.message,
        lineHeight: WA_FONT.messageLine,
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
      }}
    >
      {tail ? <Tail mine={mine} fill={fill} /> : null}
      {children}
      <Box
        component="span"
        aria-hidden={!status}
        sx={{ display: 'inline-block', width: status ? WA_SIZE.metaSpaceOut : WA_SIZE.metaSpace }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: WA_SPACE.sm,
          bottom: WA_SPACE.xxs,
          display: 'flex',
          alignItems: 'center',
          gap: WA_SPACE.xxs,
          fontSize: WA_FONT.meta,
          color: mine ? c.bubbleMetaOut : c.bubbleMeta,
        }}
      >
        <span>{time}</span>
        {status ? <Ticks status={status} /> : null}
      </Box>
    </Box>
  );
}
