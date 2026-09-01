import { ChangeEvent } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import ToggleButton from '@mui/material/ToggleButton';
import Grid from '@mui/material/Grid2';
import FiberManualRecord from '@mui/icons-material/FiberManualRecord';
import { POSITIONS, WatermarkPosition, WatermarkMode, TextWatermarkOptions, ImageWatermarkOptions } from './utils';

const COLOR = '#64748b';

interface PositionGridProps {
  value: WatermarkPosition;
  onChange: (position: WatermarkPosition) => void;
  disabled?: boolean;
}

const PositionGrid = ({ value, onChange, disabled = false }: Readonly<PositionGridProps>) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 36px)', gap: 0.5 }}>
    {POSITIONS.map((p) => (
      <ToggleButton
        key={p.id} value={p.id} size="small" aria-label={p.label} disabled={disabled}
        selected={value === p.id} onChange={() => onChange(p.id)}
        sx={{ width: 36, height: 36, p: 0, '&.Mui-selected': { color: COLOR } }}
      >
        <FiberManualRecord sx={{ fontSize: 10 }} />
      </ToggleButton>
    ))}
  </Box>
);

interface TextControlsProps {
  options: TextWatermarkOptions;
  onChange: (options: TextWatermarkOptions) => void;
}

const TextControls = ({ options, onChange }: Readonly<TextControlsProps>) => (
  <Grid container spacing={2}>
    <Grid size={12}>
      <TextField fullWidth size="small" label="Watermark Text" value={options.text}
        onChange={(e) => onChange({ ...options, text: e.target.value })} />
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption">Font Size: {options.fontSize}px</Typography>
      <Slider min={10} max={200} value={options.fontSize} onChange={(_, v) => onChange({ ...options, fontSize: v as number })} sx={{ color: COLOR }} />
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption">Opacity: {options.opacity.toFixed(2)}</Typography>
      <Slider min={0.05} max={1} step={0.05} value={options.opacity} onChange={(_, v) => onChange({ ...options, opacity: v as number })} sx={{ color: COLOR }} />
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Color</Typography>
      <input type="color" aria-label="Watermark color" value={options.color}
        onChange={(e) => onChange({ ...options, color: e.target.value })}
        style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer' }} />
    </Grid>
    <Grid size={{ xs: 12, sm: 6 }}>
      <FormControlLabel
        control={<Switch checked={options.tile} onChange={(e) => onChange({ ...options, tile: e.target.checked })} />}
        label="Tile across image"
      />
    </Grid>
    <Grid size={12}>
      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Position</Typography>
      <PositionGrid value={options.position} disabled={options.tile} onChange={(position) => onChange({ ...options, position })} />
    </Grid>
  </Grid>
);

interface ImageControlsProps {
  options: ImageWatermarkOptions;
  onChange: (options: ImageWatermarkOptions) => void;
  watermarkName: string;
  onWatermarkFile: (file: File) => void;
}

const ImageControls = ({ options, onChange, watermarkName, onWatermarkFile }: Readonly<ImageControlsProps>) => {
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onWatermarkFile(e.target.files[0]);
    e.target.value = '';
  };
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <Button variant="outlined" component="label" sx={{ color: COLOR, borderColor: COLOR }}>
          {watermarkName ? 'Replace Watermark Image' : 'Upload Watermark Image'}
          <input hidden accept="image/*" type="file" onChange={onFileChange} />
        </Button>
        {watermarkName && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{watermarkName}</Typography>}
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="caption">Scale: {options.scale}% of image width</Typography>
        <Slider min={5} max={100} value={options.scale} onChange={(_, v) => onChange({ ...options, scale: v as number })} sx={{ color: COLOR }} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <Typography variant="caption">Opacity: {options.opacity.toFixed(2)}</Typography>
        <Slider min={0.05} max={1} step={0.05} value={options.opacity} onChange={(_, v) => onChange({ ...options, opacity: v as number })} sx={{ color: COLOR }} />
      </Grid>
      <Grid size={12}>
        <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>Position</Typography>
        <PositionGrid value={options.position} onChange={(position) => onChange({ ...options, position })} />
      </Grid>
    </Grid>
  );
};

interface WatermarkControlsProps {
  mode: WatermarkMode;
  textOptions: TextWatermarkOptions;
  onTextChange: (options: TextWatermarkOptions) => void;
  imageOptions: ImageWatermarkOptions;
  onImageChange: (options: ImageWatermarkOptions) => void;
  watermarkName: string;
  onWatermarkFile: (file: File) => void;
}

export default function WatermarkControls({
  mode, textOptions, onTextChange, imageOptions, onImageChange, watermarkName, onWatermarkFile,
}: Readonly<WatermarkControlsProps>) {
  if (mode === 'text') return <TextControls options={textOptions} onChange={onTextChange} />;
  return <ImageControls options={imageOptions} onChange={onImageChange} watermarkName={watermarkName} onWatermarkFile={onWatermarkFile} />;
}
