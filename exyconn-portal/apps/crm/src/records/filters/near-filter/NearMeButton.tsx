import { useEffect, useRef } from 'react';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, CircularProgress } from '@exyconn/shell/components/ui';
import { useMyLocation } from '../../../maps/useMyLocation';
import type { NamedCentre } from './near-filter.types';

interface NearMeButtonProps {
  /** Called with the browser's position once it is known. */
  onCentre: (centre: NamedCentre) => void;
}

/** "Use my location": the browser's position as the centre, or why it could not be had. */
export function NearMeButton({ onCentre }: Readonly<NearMeButtonProps>) {
  const t = useT();
  const { position, locating, error, locate } = useMyLocation();
  // Only a new position fills the fields in, so a re-render never undoes an edit.
  const onCentreRef = useRef(onCentre);
  onCentreRef.current = onCentre;
  const label = t('Your location');
  const labelRef = useRef(label);
  labelRef.current = label;

  useEffect(() => {
    if (position) {
      onCentreRef.current({ ...position, label: labelRef.current });
    }
  }, [position]);

  return (
    <Box>
      <Button
        size="small"
        variant="outlined"
        startIcon={locating ? <CircularProgress size={16} aria-hidden /> : <MyLocationIcon />}
        onClick={locate}
        disabled={locating}
      >
        {locating ? t('Finding your location…') : t('Use my location')}
      </Button>
      {error && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t(error)}
        </Alert>
      )}
    </Box>
  );
}
