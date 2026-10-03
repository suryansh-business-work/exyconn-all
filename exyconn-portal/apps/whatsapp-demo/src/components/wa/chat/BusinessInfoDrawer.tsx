import { useT } from '@exyconn/i18n';
import { Box, Drawer, IconButton } from '@exyconn/shell/components/ui';
import CloseIcon from '@mui/icons-material/Close';
import CallIcon from '@mui/icons-material/Call';
import MailIcon from '@mui/icons-material/MailOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import PlaceIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined';
import type { DemoProfile } from '@exyconn/wa-flow';
import { useCompact, useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { WaAvatar } from '../common/WaAvatar';

interface BusinessInfoDrawerProps {
  demo: DemoProfile;
  open: boolean;
  onClose: () => void;
}

/** The business profile: avatar, name, category, about and contact details. */
export function BusinessInfoDrawer({ demo, open, onClose }: Readonly<BusinessInfoDrawerProps>) {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const b = demo.business;
  const rows = [
    { id: 'category', icon: StorefrontIcon, text: b.category },
    { id: 'address', icon: PlaceIcon, text: b.address },
    { id: 'hours', icon: ScheduleIcon, text: b.hours },
    { id: 'phone', icon: CallIcon, text: b.phone },
    { id: 'email', icon: MailIcon, text: b.email },
    { id: 'website', icon: LanguageIcon, text: b.website },
  ].filter((r) => r.text);
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          'aria-labelledby': 'wa-info-title',
          sx: { width: compact ? '100%' : WA_SIZE.listMax, bgcolor: c.panelHeader, color: c.text },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: WA_SPACE.md,
          height: WA_SIZE.header,
          px: WA_SPACE.md,
          bgcolor: c.panel,
        }}
      >
        <IconButton aria-label={t('Close')} onClick={onClose} sx={{ color: c.icon }}>
          <CloseIcon />
        </IconButton>
        <Box
          component="h2"
          id="wa-info-title"
          sx={{ m: 0, fontSize: WA_FONT.title, fontWeight: 500 }}
        >
          {t('Business info')}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: WA_SPACE.sm,
          py: WA_SPACE.xl,
          bgcolor: c.panel,
          mb: WA_SPACE.sm,
        }}
      >
        <WaAvatar size={WA_SIZE.avatarLarge} accent={b.accent} icon={b.icon} label={b.name} />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: WA_SPACE.xxs,
            fontSize: WA_FONT.heading,
          }}
        >
          {b.name}
          {b.verified ? <VerifiedBadge /> : null}
        </Box>
        <Box sx={{ color: c.textMuted, fontSize: WA_FONT.preview }}>{t('Business account')}</Box>
      </Box>
      <Box sx={{ bgcolor: c.panel, p: WA_SPACE.xl, mb: WA_SPACE.sm, fontSize: WA_FONT.preview }}>
        {b.about}
      </Box>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, bgcolor: c.panel }}>
        {rows.map((r) => (
          <Box
            component="li"
            key={r.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: WA_SPACE.lg,
              px: WA_SPACE.xl,
              py: WA_SPACE.md,
              fontSize: WA_FONT.preview,
            }}
          >
            <r.icon sx={{ color: c.icon }} fontSize="small" />
            <span>{r.text}</span>
          </Box>
        ))}
      </Box>
    </Drawer>
  );
}
