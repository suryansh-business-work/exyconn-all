import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { initialsOf } from '../../../hooks/useDemoUser';
import { useCompact, useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { WaAvatar } from '../common/WaAvatar';
import { AppMenu } from './AppMenu';

/** Top of the chat list: the viewer's avatar and the menu (a brand bar with a title on a phone). */
export function ChatListHeader({ userName }: Readonly<{ userName: string }>) {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const ink = compact ? c.onBrandBar : c.icon;
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: WA_SPACE.md,
        height: compact ? WA_SIZE.headerCompact : WA_SIZE.header,
        flexShrink: 0,
        px: WA_SPACE.lg,
        bgcolor: compact ? c.brandBar : c.panelHeader,
        color: ink,
      }}
    >
      <WaAvatar
        size={WA_SIZE.avatarHeader}
        accent="slate"
        initials={initialsOf(userName)}
        label={t('Your profile: {name}', { name: userName })}
      />
      <Box
        component="h1"
        sx={{
          flex: 1,
          m: 0,
          fontSize: WA_FONT.heading,
          fontWeight: compact ? 600 : 500,
          color: compact ? ink : c.text,
        }}
      >
        {t('Chats')}
      </Box>
      <AppMenu color={ink} />
    </Box>
  );
}
