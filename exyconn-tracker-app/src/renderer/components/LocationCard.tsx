import type { ReactElement } from 'react';
import { Button, Chip, Stack, Typography } from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import {
  LOCATION_PURPOSE,
  locationStatusLabel,
  locationStatusSentence,
  type LocationAccess,
} from '@exyconn/tracker-core';
import Surface from './Surface';
import OpenLocationSettingsButton from './OpenLocationSettingsButton';
import useLocationAccess from '../hooks/useLocationAccess';

/** The theme's own status hues — no colour of this card's own. */
type ChipTone = 'default' | 'success' | 'warning';

const CHIP_COLOR: Readonly<Record<LocationAccess['status'], ChipTone>> = {
  checking: 'default',
  on: 'success',
  off: 'warning',
};

/**
 * Location access on this computer: why the tracker needs it, whether a fix can be read right
 * now, and the way to the OS page that switches it on — the attendance pin depends on it.
 */
export default function LocationCard(): ReactElement {
  const t = useT();
  const { access, check } = useLocationAccess();
  const checking = access.status === 'checking';

  return (
    <Surface sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
          {t('Location')}
        </Typography>
        <Chip
          size="small"
          color={CHIP_COLOR[access.status]}
          label={locationStatusLabel(access, t)}
        />
      </Stack>
      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
        {t(LOCATION_PURPOSE)}
      </Typography>
      <Typography role="status" variant="body2" sx={{ mt: 1.5, mb: 2 }}>
        {locationStatusSentence(access, t)}
      </Typography>
      <Stack direction="row" spacing={1.25} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<RefreshRounded />}
          loading={checking}
          disabled={checking}
          onClick={check}
        >
          {t('Check again')}
        </Button>
        <OpenLocationSettingsButton variant="contained" />
      </Stack>
    </Surface>
  );
}
