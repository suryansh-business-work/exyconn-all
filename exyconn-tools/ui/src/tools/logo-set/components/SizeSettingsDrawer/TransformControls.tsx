import React from 'react';
import {
  ZoomIn, RotateRight, SwapHoriz, SwapVert,
  RoundedCorner, Padding, BlurOn,
} from '@mui/icons-material';
import { LogoSettings } from '../../types';
import SliderControl from './SliderControl';

interface TransformControlsProps {
  settings: LogoSettings;
  onUpdate: (key: keyof LogoSettings, value: number) => void;
  isIcon?: boolean;
}

const TransformControls: React.FC<TransformControlsProps> = ({ settings, onUpdate, isIcon = false }) => (
  <>
    <SliderControl
      icon={<ZoomIn />} label="Scale" value={settings.scale}
      min={0.1} max={3} step={0.01}
      display={`${Math.round(settings.scale * 100)}%`}
      onChange={(v) => onUpdate('scale', v)}
    />
    <SliderControl
      icon={<RotateRight />} label="Rotation" value={settings.rotation}
      min={0} max={360} step={1}
      display={`${settings.rotation}°`}
      onChange={(v) => onUpdate('rotation', v)}
    />
    <SliderControl
      icon={<SwapHoriz />} label="X Offset" value={settings.x}
      min={-1000} max={1000} step={1}
      display={`${settings.x}px`}
      onChange={(v) => onUpdate('x', v)}
    />
    <SliderControl
      icon={<SwapVert />} label="Y Offset" value={settings.y}
      min={-1000} max={1000} step={1}
      display={`${settings.y}px`}
      onChange={(v) => onUpdate('y', v)}
    />
    <SliderControl
      icon={<RoundedCorner />} label="Border Radius" value={settings.borderRadius}
      min={0} max={50} step={1}
      display={`${settings.borderRadius}%`}
      onChange={(v) => onUpdate('borderRadius', v)}
    />
    <SliderControl
      icon={<Padding />} label="Padding" value={settings.padding}
      min={0} max={40} step={1}
      display={`${settings.padding}%`}
      onChange={(v) => onUpdate('padding', v)}
    />
    {isIcon && (
      <SliderControl
        icon={<BlurOn />} label="Box Shadow" value={settings.boxShadow}
        min={0} max={50} step={1}
        display={settings.boxShadow > 0 ? `${settings.boxShadow}px` : 'Off'}
        onChange={(v) => onUpdate('boxShadow', v)}
      />
    )}
  </>
);

export default TransformControls;
