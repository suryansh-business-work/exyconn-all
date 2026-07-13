import React from 'react';
import { Divider, Chip } from '@mui/material';
import { RotateRight, ZoomIn, SwapHoriz, SwapVert, RoundedCorner } from '@mui/icons-material';
import { LogoSettings } from '../../types';
import SliderControl from './SliderControl';

interface TransformControlsProps {
  settings: LogoSettings;
  onUpdate: (key: keyof LogoSettings, value: number) => void;
}

const TransformControls: React.FC<TransformControlsProps> = ({ settings, onUpdate }) => {
  return (
    <>
      <Divider sx={{ mb: 1.5 }}>
        <Chip label="Transform" size="small" sx={{ fontSize: '0.65rem' }} />
      </Divider>

      <SliderControl
        icon={<ZoomIn />}
        label="Scale"
        value={settings.scale}
        min={0.1}
        max={3}
        step={0.01}
        display={`${Math.round(settings.scale * 100)}%`}
        onChange={(v) => onUpdate('scale', v)}
      />

      <SliderControl
        icon={<RotateRight />}
        label="Rotation"
        value={settings.rotation}
        min={0}
        max={360}
        step={1}
        display={`${settings.rotation}°`}
        onChange={(v) => onUpdate('rotation', v)}
      />

      <SliderControl
        icon={<SwapHoriz />}
        label="X Offset"
        value={settings.x}
        min={-200}
        max={200}
        step={1}
        display={`${settings.x}px`}
        onChange={(v) => onUpdate('x', v)}
      />

      <SliderControl
        icon={<SwapVert />}
        label="Y Offset"
        value={settings.y}
        min={-200}
        max={200}
        step={1}
        display={`${settings.y}px`}
        onChange={(v) => onUpdate('y', v)}
      />

      <SliderControl
        icon={<RoundedCorner />}
        label="Border Radius"
        value={settings.borderRadius}
        min={0}
        max={50}
        step={1}
        display={`${settings.borderRadius}%`}
        onChange={(v) => onUpdate('borderRadius', v)}
      />
    </>
  );
};

export default TransformControls;
