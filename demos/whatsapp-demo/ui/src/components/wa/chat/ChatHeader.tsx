import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Box,
  ButtonBase,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
} from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweepOutlined';
import type { DemoProfile } from '@exyconn/wa-flow';
import { useCompact, useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { WaAvatar } from '../common/WaAvatar';

interface ChatHeaderProps {
  demo: DemoProfile;
  typing: boolean;
  onBack: () => void;
  onInfo: () => void;
  onClear: () => void;
}

/** The open chat's header: back (phone), avatar, name, online / typing…, and its menu. */
export function ChatHeader({ demo, typing, onBack, onInfo, onClear }: Readonly<ChatHeaderProps>) {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const ink = compact ? c.onBrandBar : c.icon;
  const status = typing ? t('typing…') : t('online');
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: WA_SPACE.xs,
        height: compact ? WA_SIZE.headerCompact : WA_SIZE.header,
        flexShrink: 0,
        px: compact ? WA_SPACE.xxs : WA_SPACE.lg,
        bgcolor: compact ? c.brandBar : c.panelHeader,
        color: ink,
        borderLeft: compact ? 'none' : `${WA_LINE.hair} solid ${c.divider}`,
      }}
    >
      {compact ? (
        <IconButton aria-label={t('Back to chats')} onClick={onBack} sx={{ color: ink }}>
          <ArrowBackIcon />
        </IconButton>
      ) : null}
      <ButtonBase
        onClick={onInfo}
        aria-label={t('Business info: {name}', { name: demo.business.name })}
        sx={{
          flex: 1,
          minWidth: 0,
          justifyContent: 'flex-start',
          gap: WA_SPACE.md,
          fontFamily: 'inherit',
          textAlign: 'left',
          py: WA_SPACE.xxs,
        }}
      >
        <WaAvatar
          size={WA_SIZE.avatarHeader}
          accent={demo.business.accent}
          icon={demo.business.icon}
        />
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: WA_SPACE.xxs,
              fontSize: WA_FONT.nameCompact,
              fontWeight: compact ? 600 : 400,
              color: compact ? ink : c.text,
            }}
          >
            <Box
              component="span"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {demo.business.name}
            </Box>
            {demo.business.verified ? <VerifiedBadge color={compact ? ink : undefined} /> : null}
          </Box>
          <Box
            aria-live="polite"
            sx={{
              fontSize: WA_FONT.small,
              color: compact ? ink : c.textMuted,
              opacity: compact ? 0.85 : 1,
            }}
          >
            {status}
          </Box>
        </Box>
      </ButtonBase>
      <IconButton
        aria-label={t('Chat menu')}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color: ink }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onInfo();
          }}
        >
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          {t('Business info')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchor(null);
            onClear();
          }}
        >
          <ListItemIcon>
            <DeleteSweepIcon fontSize="small" />
          </ListItemIcon>
          {t('Clear chat')}
        </MenuItem>
      </Menu>
    </Box>
  );
}
