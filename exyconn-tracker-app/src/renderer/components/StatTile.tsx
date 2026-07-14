import type { SvgIconComponent } from '@mui/icons-material';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import Surface from './Surface';

interface Props {
  label: string;
  value: string;
  icon: SvgIconComponent;
}

/** A single labelled stat in the dashboard grid. */
export default function StatTile({ label, value, icon }: Readonly<Props>): JSX.Element {
  const Icon = icon;
  return (
    <Surface
      sx={(theme) => ({
        p: 2,
        '&:hover': {
          transform: 'translateY(-2px)',
          backgroundColor: alpha('#FFFFFF', theme.palette.mode === 'dark' ? 0.16 : 0.72),
        },
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Icon fontSize="small" sx={{ color: 'primary.main' }} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h6" noWrap title={value}>
        {value}
      </Typography>
    </Surface>
  );
}
