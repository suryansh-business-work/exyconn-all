import React from 'react';
import { Box, Typography, Slider, TextField, Paper, InputAdornment } from '@mui/material';

interface ROIInputSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  unit?: string;
  helperText?: string;
  marks?: { value: number; label: string }[];
}

const ROIInputSlider: React.FC<ROIInputSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  helperText,
  marks,
}) => {
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === '' ? min : Number(event.target.value);
    onChange(Math.max(min, Math.min(max, newValue)));
  };

  const defaultMarks = [
    { value: min, label: min.toString() },
    { value: Math.round((max - min) * 0.25 + min), label: Math.round((max - min) * 0.25 + min).toString() },
    { value: Math.round((max - min) * 0.5 + min), label: Math.round((max - min) * 0.5 + min).toString() },
    { value: Math.round((max - min) * 0.75 + min), label: Math.round((max - min) * 0.75 + min).toString() },
    { value: max, label: max.toString() },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="body1" fontWeight={500} color="text.primary">
            {label}
          </Typography>
          {helperText && (
            <Typography variant="caption" color="text.secondary">
              {helperText}
            </Typography>
          )}
        </Box>
        <TextField
          size="small"
          value={value}
          onChange={handleInputChange}
          type="number"
          inputProps={{
            min,
            max,
            step,
            style: { textAlign: 'center', width: 60 },
          }}
          InputProps={{
            endAdornment: unit ? (
              <InputAdornment position="end">
                <Typography variant="caption" color="text.secondary">
                  {unit}
                </Typography>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
            },
          }}
        />
      </Box>
      <Slider
        value={value}
        onChange={handleSliderChange}
        min={min}
        max={max}
        step={step}
        marks={marks || defaultMarks}
        valueLabelDisplay="auto"
        sx={{
          '& .MuiSlider-track': {
            height: 6,
          },
          '& .MuiSlider-rail': {
            height: 6,
          },
          '& .MuiSlider-thumb': {
            width: 20,
            height: 20,
          },
          '& .MuiSlider-markLabel': {
            fontSize: '0.75rem',
            color: 'text.secondary',
          },
        }}
      />
    </Paper>
  );
};

export default ROIInputSlider;
