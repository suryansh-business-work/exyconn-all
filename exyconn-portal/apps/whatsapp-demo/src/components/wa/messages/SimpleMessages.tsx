import { Box } from '@exyconn/shell/components/ui';
import { useT } from '@exyconn/i18n';
import ReplyIcon from '@mui/icons-material/Reply';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import { useState } from 'react';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { ActionRows } from './ActionRows';
import { Bubble } from './Bubble';
import { Illustration } from './Illustration';
import { ListSheet } from './ListSheet';
import { MessageText } from './MessageText';
import type { ContentProps } from './types';

export function TextMessage({ content, frame }: ContentProps<'text'>) {
  return (
    <Bubble mine={false} tail={frame.tail} time={frame.time}>
      <MessageText text={content.text} sender={content.sender} />
    </Bubble>
  );
}

export function ButtonsMessage({ content, frame }: ContentProps<'buttons'>) {
  const { choose } = useChatActions();
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <MessageText header={content.header} text={content.text} footer={content.footer} />
      </Bubble>
      <ActionRows
        mine={false}
        items={content.buttons.map((b) => ({
          id: b.id,
          label: b.title,
          icon: <ReplyIcon fontSize="small" />,
          onClick: () => choose(b, content.text),
        }))}
      />
    </Box>
  );
}

export function ListMessage({ content, frame }: ContentProps<'list'>) {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time}>
        <MessageText header={content.header} text={content.text} footer={content.footer} />
      </Bubble>
      <ActionRows
        mine={false}
        items={[
          {
            id: 'open',
            label: content.button,
            icon: <ListIcon fontSize="small" />,
            onClick: () => setOpen(true),
          },
        ]}
      />
      <ListSheet content={content} open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

export function ImageMessage({ content, frame }: ContentProps<'image'>) {
  return (
    <Box sx={{ width: WA_SIZE.media, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time} flush>
        <Illustration image={content.image} height={WA_SIZE.mediaHeight} />
        {content.caption ? (
          <Box sx={{ p: `${WA_SPACE.xs} ${WA_SPACE.sm} 0` }}>
            <MessageText text={content.caption} />
          </Box>
        ) : null}
      </Bubble>
    </Box>
  );
}

/** A centred notice in the chat — not a bubble. */
export function SystemNotice({ text }: Readonly<{ text: string }>) {
  const c = useWaPalette();
  const t = useT();
  return (
    <Box
      role="note"
      aria-label={t('Notice')}
      sx={{
        alignSelf: 'center',
        maxWidth: '85%',
        my: WA_SPACE.xs,
        px: WA_SPACE.md,
        py: WA_SPACE.xs,
        borderRadius: WA_RADIUS.chip,
        bgcolor: c.notice,
        color: c.noticeText,
        fontSize: WA_FONT.small,
        textAlign: 'center',
      }}
    >
      {text}
    </Box>
  );
}
