import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Divider,
  Stack,
  Typography,
  fontSize,
  fontWeight,
  iconSize,
  radius,
  readableAccent,
  spacing,
} from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import LockIcon from '@mui/icons-material/Lock';
import type { PlatformConfig } from './download.config';

interface StepProps {
  index: number;
  text: string;
  accent: string;
}

/** One numbered install step. */
function InstallStep({ index, text, accent }: Readonly<StepProps>) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        alignItems: 'flex-start',
      }}
    >
      <Box
        sx={(theme) => ({
          flexShrink: 0,
          width: spacing(3),
          height: spacing(3),
          borderRadius: radius.pill,
          display: 'grid',
          placeItems: 'center',
          fontSize: fontSize.xs,
          fontWeight: fontWeight.bold,
          // The step number is text on a neutral chip: 4.5:1 in either mode, the hue kept.
          color: readableAccent(accent, theme, 'text', theme.palette.background.muted),
          background: theme.palette.background.muted,
        })}
      >
        {index}
      </Box>
      <Typography variant="body2" sx={{ pt: 0.5 }}>
        {text}
      </Typography>
    </Stack>
  );
}

/** Install instructions and OS permissions for the selected platform. */
export function InstallGuide({ platform }: Readonly<{ platform: PlatformConfig }>) {
  const t = useT();
  return (
    <Box sx={[panel, { height: '100%' }]}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        {t('Installing on {platform}', { platform: platform.label })}
      </Typography>

      {platform.caution && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t(platform.caution)}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {platform.steps.map((step, index) => (
          <InstallStep key={step} index={index + 1} text={t(step)} accent={platform.accent} />
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          mb: 1,
        }}
      >
        <LockIcon sx={{ fontSize: iconSize.lg, color: 'text.secondary' }} />
        <Typography variant="subtitle2">{t('Permissions it will ask for')}</Typography>
      </Stack>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
        {platform.permissions.map((permission) => (
          <Typography
            key={permission}
            component="li"
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t(permission)}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
