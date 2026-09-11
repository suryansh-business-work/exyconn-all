import { useState, type ReactNode } from 'react';
import FormatColorResetIcon from '@mui/icons-material/FormatColorReset';
import { Box, ButtonBase, Menu, Text, Tooltip } from '@exyconn/ui';
import { ToolbarButton } from './ToolbarButton';
import type { Swatch } from './color-palette';

interface SwatchButtonProps {
  swatch: Swatch;
  selected: boolean;
  onPick: (value: string) => void;
}

function SwatchButton({ swatch, selected, onPick }: Readonly<SwatchButtonProps>) {
  return (
    <Tooltip title={swatch.label}>
      <ButtonBase
        aria-label={swatch.label}
        aria-pressed={selected}
        onClick={() => onPick(swatch.value)}
        sx={{
          width: 24,
          height: 24,
          borderRadius: 0.75,
          bgcolor: swatch.value,
          border: 2,
          borderColor: selected ? 'primary.main' : 'divider',
        }}
      />
    </Tooltip>
  );
}

interface ColorMenuProps {
  label: string;
  icon: ReactNode;
  swatches: readonly Swatch[];
  /** The colour at the caret, `''` when none is set. */
  current: string;
  disabled: boolean;
  onPick: (value: string) => void;
  onClear: () => void;
}

/** A toolbar button that opens a swatch grid — used for text colour and for highlight. */
export function ColorMenu({
  label,
  icon,
  swatches,
  current,
  disabled,
  onPick,
  onClear,
}: Readonly<ColorMenuProps>) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => setAnchor(null);
  const pick = (value: string) => {
    onPick(value);
    close();
  };

  return (
    <>
      <ToolbarButton
        label={label}
        hasPopup
        active={Boolean(current)}
        disabled={disabled}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {icon}
      </ToolbarButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <Box
          sx={{ px: 1.5, py: 1, display: 'grid', gridTemplateColumns: 'repeat(6, 24px)', gap: 1 }}
        >
          {swatches.map((swatch) => (
            <SwatchButton
              key={swatch.value}
              swatch={swatch}
              selected={swatch.value === current}
              onPick={pick}
            />
          ))}
        </Box>
        <ButtonBase
          onClick={() => {
            onClear();
            close();
          }}
          sx={{ width: '100%', justifyContent: 'flex-start', gap: 1, px: 1.5, py: 1 }}
        >
          <FormatColorResetIcon fontSize="small" />
          <Text size="sm">Remove {label.toLowerCase()}</Text>
        </ButtonBase>
      </Menu>
    </>
  );
}
