import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import ForumIcon from '@mui/icons-material/ForumOutlined';
import LockIcon from '@mui/icons-material/Lock';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_LINE, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';

/** The right pane on a wide screen before a chat is picked. */
export function EmptyPane() {
  const t = useT();
  const c = useWaPalette();
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: WA_SPACE.lg,
        p: WA_SPACE.xxl,
        bgcolor: c.panelHeader,
        color: c.textMuted,
        textAlign: 'center',
        borderBottom: `${WA_LINE.stripe} solid ${c.appStripe}`,
      }}
    >
      <ForumIcon sx={{ fontSize: WA_SIZE.heroIcon, color: c.divider }} />
      <Box component="h2" sx={{ m: 0, fontSize: WA_FONT.hero, fontWeight: 300, color: c.text }}>
        {t('Business chats')}
      </Box>
      <Box sx={{ maxWidth: WA_SIZE.heroText, fontSize: WA_FONT.preview, lineHeight: 1.6 }}>
        {t(
          'Pick a business on the left to start a conversation. Buttons, lists, catalogues, payments, tickets and reminders all work just as your customers would see them.',
        )}
      </Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.xxs, fontSize: WA_FONT.small }}
      >
        <LockIcon sx={{ fontSize: WA_FONT.preview }} />
        {t('Simulated conversations — nothing leaves this page')}
      </Box>
    </Box>
  );
}
