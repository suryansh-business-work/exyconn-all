import React, { useState } from 'react';
import { Box, Button, Collapse, Divider, Chip } from '@mui/material';
import {
  RotateRight,
  ZoomIn,
  SwapHoriz,
  SwapVert,
  RoundedCorner,
  Padding,
  Brightness6,
  Contrast,
  FilterBAndW,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { LogoSettings } from '../../types';
import SliderControl from './SliderControl';

interface TransformSectionProps {
  settings: LogoSettings;
  onUpdate: (key: keyof LogoSettings, value: number | string | boolean) => void;
}

const TransformSection: React.FC<TransformSectionProps> = ({ settings, onUpdate }) => {
  const [showMoreTransform, setShowMoreTransform] = useState(false);

  const handleResetAdjustments = () => {
    onUpdate('brightness', 100);
    onUpdate('contrast', 100);
    onUpdate('grayscale', 0);
  };

  const hasAdjustments = settings.brightness !== 100 || settings.contrast !== 100 || settings.grayscale !== 0;

  return (
    <Box>
      <Divider sx={{ my: 1 }}>
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
        min={-1000}
        max={1000}
        step={1}
        display={`${settings.x}px`}
        onChange={(v) => onUpdate('x', v)}
      />

      <SliderControl
        icon={<SwapVert />}
        label="Y Offset"
        value={settings.y}
        min={-1000}
        max={1000}
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

      <SliderControl
        icon={<Padding />}
        label="Padding"
        value={settings.padding}
        min={0}
        max={40}
        step={1}
        display={`${settings.padding}%`}
        onChange={(v) => onUpdate('padding', v)}
      />

      <Button
        size="small"
        onClick={() => setShowMoreTransform(!showMoreTransform)}
        endIcon={showMoreTransform ? <ExpandLess /> : <ExpandMore />}
        sx={{ fontSize: '0.65rem', py: 0, mb: 0.5 }}
      >
        {showMoreTransform ? 'Show Less' : 'Image Adjustments'}
      </Button>

      <Collapse in={showMoreTransform}>
        <Box sx={{ pl: 0.5 }}>
          <SliderControl
            icon={<Brightness6 />}
            label="Brightness"
            value={settings.brightness}
            min={0}
            max={200}
            step={1}
            display={`${settings.brightness}%`}
            onChange={(v) => onUpdate('brightness', v)}
          />

          <SliderControl
            icon={<Contrast />}
            label="Contrast"
            value={settings.contrast}
            min={0}
            max={200}
            step={1}
            display={`${settings.contrast}%`}
            onChange={(v) => onUpdate('contrast', v)}
          />

          <SliderControl
            icon={<FilterBAndW />}
            label="Grayscale"
            value={settings.grayscale}
            min={0}
            max={100}
            step={1}
            display={`${settings.grayscale}%`}
            onChange={(v) => onUpdate('grayscale', v)}
          />

          {hasAdjustments && (
            <Button size="small" onClick={handleResetAdjustments} sx={{ fontSize: '0.6rem', py: 0, mt: 0.5 }}>
              Reset Adjustments
            </Button>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default TransformSection;
