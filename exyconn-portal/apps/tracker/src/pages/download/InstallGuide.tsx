import { Alert, Box, Divider, Stack, Typography } from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
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
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Box
        sx={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          background: `${accent}1f`,
        }}
      >
        {index}
      </Box>
      <Typography variant="body2" sx={{ pt: 0.25 }}>
        {text}
      </Typography>
    </Stack>
  );
}

/** Install instructions and OS permissions for the selected platform. */
export function InstallGuide({ platform }: Readonly<{ platform: PlatformConfig }>) {
  return (
    <Box sx={[glass, { p: 2, height: '100%' }]}>
      <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
        Installing on {platform.label}
      </Typography>

      {platform.caution && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {platform.caution}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {platform.steps.map((step, index) => (
          <InstallStep key={step} index={index + 1} text={step} accent={platform.accent} />
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <LockIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <Typography variant="subtitle2">Permissions it will ask for</Typography>
      </Stack>
      <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
        {platform.permissions.map((permission) => (
          <Typography key={permission} component="li" variant="body2" color="text.secondary">
            {permission}
          </Typography>
        ))}
      </Stack>
    </Box>
  );
}
