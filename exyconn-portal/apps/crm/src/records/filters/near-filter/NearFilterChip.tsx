import { useFormatters, useT } from '@exyconn/i18n';
import { Chip } from '@exyconn/shell/components/ui';
import type { NearFilter } from './near-filter.types';

interface NearFilterChipProps {
  near: NearFilter | null;
  onRemove: () => void;
}

/** The applied circle as a removable chip, e.g. "Within 10 km of Koramangala". */
export function NearFilterChip({ near, onRemove }: Readonly<NearFilterChipProps>) {
  const t = useT();
  const { formatNumber } = useFormatters();
  if (!near) {
    return null;
  }
  const coordinates = t('{lat}, {lng}', {
    lat: formatNumber(near.lat),
    lng: formatNumber(near.lng),
  });
  return (
    <Chip
      size="small"
      color="primary"
      label={t('Within {radius} km of {place}', {
        radius: formatNumber(near.radiusKm),
        place: near.label || coordinates,
      })}
      onDelete={onRemove}
    />
  );
}
