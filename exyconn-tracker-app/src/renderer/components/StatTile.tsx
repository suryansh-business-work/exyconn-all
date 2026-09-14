import type { ReactElement } from 'react';
import type { SvgIconComponent } from '@mui/icons-material';
import { alpha, ButtonBase, color, Stack, TRACKER_RADIUS, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import Surface from './Surface';

interface Props {
  label: string;
  value: string;
  icon: SvgIconComponent;
  /** Opens this tile's detail — every number on the dashboard can explain itself. */
  onOpen: () => void;
}

/** A single labelled stat in the dashboard grid. Clicking it explains the number. */
export default function StatTile({ label, value, icon, onOpen }: Readonly<Props>): ReactElement {
  const t = useT();
  const Icon = icon;
  const title = t(label);
  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={t('{label}: {value}. Open details', { label: title, value })}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        borderRadius: `${TRACKER_RADIUS}px`,
      }}
    >
      <Surface
        sx={(theme) => ({
          p: 2,
          height: '100%',
          '&:hover': {
            transform: 'translateY(-2px)',
            backgroundColor: alpha(color.white, theme.palette.mode === 'dark' ? 0.16 : 0.72),
          },
        })}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Icon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography
            variant="caption"
            noWrap
            sx={{
              color: 'text.secondary',
            }}
          >
            {title}
          </Typography>
        </Stack>
        <Typography variant="h6" noWrap title={value}>
          {value}
        </Typography>
      </Surface>
    </ButtonBase>
  );
}
