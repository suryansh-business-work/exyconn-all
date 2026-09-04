import { Stack, Typography } from '@exyconn/shell/components/ui';
import { PLATFORMS, type PlatformKey } from './download.config';
import { PlatformTile } from './PlatformTile';

interface PlatformPickerProps {
  selected: PlatformKey;
  detected: PlatformKey;
  /** Platform keys this release actually shipped an installer for. */
  available: Set<string>;
  onSelect: (key: PlatformKey) => void;
}

/** The three platform tiles, with the visitor's own platform ticked. */
export function PlatformPicker({
  selected,
  detected,
  available,
  onSelect,
}: Readonly<PlatformPickerProps>) {
  return (
    <Stack spacing={1}>
      <Typography variant="caption" color="text.secondary">
        All platforms
      </Typography>
      {PLATFORMS.map((platform) => (
        <PlatformTile
          key={platform.key}
          platform={platform}
          selected={platform.key === selected}
          detected={platform.key === detected}
          available={available.has(platform.key)}
          onSelect={() => onSelect(platform.key)}
        />
      ))}
    </Stack>
  );
}
