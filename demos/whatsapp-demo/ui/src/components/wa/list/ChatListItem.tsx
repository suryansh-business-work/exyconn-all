import { memo } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import type { ChatMessage } from '@exyconn/wa-flow';
import type { CatalogBundle } from '../../../runtime/types';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { WaAvatar } from '../common/WaAvatar';
import { Ticks } from '../messages/Ticks';
import { previewOf } from './preview';

interface ChatListItemProps {
  bundle: CatalogBundle;
  last?: ChatMessage;
  unread: number;
  typing: boolean;
  selected: boolean;
  timeLabel: string;
  onOpen: (demoKey: string) => void;
}

/** One business in the chat list: avatar, name, last message, time and unread count. */
export const ChatListItem = memo(function ChatListItem(props: Readonly<ChatListItemProps>) {
  const { bundle, last, unread, typing, selected, timeLabel, onOpen } = props;
  const t = useT();
  const c = useWaPalette();
  const { business } = bundle.demo;
  const preview = typing ? t('typing…') : previewOf(last, t) || business.tagline;
  return (
    <ButtonBase
      onClick={() => onOpen(bundle.demo.key)}
      aria-current={selected ? 'true' : undefined}
      aria-label={t('{name}, {count} unread', { name: business.name, count: unread })}
      sx={{
        width: '100%',
        height: WA_SIZE.row,
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: WA_SPACE.md,
        pl: WA_SPACE.md,
        fontFamily: 'inherit',
        bgcolor: selected ? c.rowSelected : 'transparent',
        '&:hover': { bgcolor: selected ? c.rowSelected : c.rowHover },
        '&:focus-visible': {
          outline: `${WA_LINE.focus} solid ${c.brand}`,
          outlineOffset: `-${WA_LINE.focus}`,
        },
      }}
    >
      <WaAvatar size={WA_SIZE.avatar} accent={business.accent} icon={business.icon} />
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          pr: WA_SPACE.md,
          borderBottom: `${WA_LINE.hair} solid ${c.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.xxs }}>
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: WA_SPACE.xxs,
              color: c.text,
              fontSize: WA_FONT.nameCompact,
            }}
          >
            <Box
              component="span"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {business.name}
            </Box>
            {business.verified ? <VerifiedBadge /> : null}
          </Box>
          <Box sx={{ fontSize: WA_FONT.meta, color: unread ? c.badge : c.textMuted }}>
            {timeLabel}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.xxs, mt: WA_SPACE.hair }}>
          {last?.from === 'user' && last.status && !typing ? <Ticks status={last.status} /> : null}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              fontSize: WA_FONT.preview,
              color: typing ? c.brand : c.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {preview}
          </Box>
          {unread > 0 ? (
            <Box
              aria-hidden
              sx={{
                minWidth: WA_SIZE.badge,
                height: WA_SIZE.badge,
                px: WA_SPACE.xxs,
                borderRadius: WA_RADIUS.pill,
                bgcolor: c.badge,
                color: c.onBadge,
                fontSize: WA_FONT.meta,
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {unread}
            </Box>
          ) : null}
        </Box>
      </Box>
    </ButtonBase>
  );
});
