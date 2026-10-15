import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Box, IconButton, Tooltip, Typography } from '@exyconn/shell/components/ui';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { WA_ICONS } from '../icons';
import type { WidgetLook } from './widget.look';

interface WidgetHeaderProps {
  demo: DemoBundle['demo'];
  look: WidgetLook;
  onRestart: () => void;
  /** Shown when the widget can be minimised back to its launcher. */
  onClose?: () => void;
}

/** The business's name and avatar, an "online" line, and Restart / Close. */
export function WidgetHeader({ demo, look, onRestart, onClose }: Readonly<WidgetHeaderProps>) {
  const t = useT();
  const Icon = WA_ICONS[demo.business.icon];
  const buttonSx = { color: look.onFill };
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        bgcolor: look.fill,
        color: look.onFill,
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: 'background.paper',
          color: look.text,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography
          variant="subtitle1"
          component="h2"
          sx={{ fontWeight: 700, lineHeight: 1.2 }}
          noWrap
        >
          {demo.business.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            aria-hidden
            sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.light' }}
          />
          <Typography variant="caption">{t('AI assistant · replies instantly')}</Typography>
        </Box>
      </Box>
      <Tooltip title={t('Start over')}>
        <IconButton aria-label={t('Start over')} onClick={onRestart} sx={buttonSx}>
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
      {onClose && (
        <IconButton aria-label={t('Close chat')} onClick={onClose} sx={buttonSx}>
          <CloseIcon />
        </IconButton>
      )}
    </Box>
  );
}
