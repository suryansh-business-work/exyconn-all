import React from 'react';
import { Box, Typography, TextField, ListItem, IconButton, Chip, Tooltip } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Field, FormikErrors, FormikTouched } from 'formik';
import { CustomSize } from '../../types';

interface SizeItemProps {
  size: CustomSize;
  index: number;
  sizeErrors: FormikErrors<CustomSize>;
  sizeTouched: FormikTouched<CustomSize>;
  onRemove: () => void;
  setFieldValue: (field: string, value: number) => void;
}

const quickPresets = [
  { w: 256, h: 256 },
  { w: 512, h: 512 },
  { w: 1024, h: 1024 },
  { w: 800, h: 600 },
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
];

const SizeItem: React.FC<SizeItemProps> = ({ size, index, sizeErrors, sizeTouched, onRemove, setFieldValue }) => {
  return (
    <ListItem
      sx={{
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 1,
        p: 1.5,
        mb: 1,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Chip label={`#${index + 1}`} size="small" color="primary" variant="outlined" />
        <Field
          as={TextField}
          name={`sizes.${index}.label`}
          label="Label"
          size="small"
          sx={{ flex: 1 }}
          error={sizeTouched.label && Boolean(sizeErrors.label)}
          helperText={sizeTouched.label && sizeErrors.label}
        />
        <Tooltip title="Remove">
          <IconButton onClick={onRemove} color="error" size="small">
            <Delete />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Field
          as={TextField}
          name={`sizes.${index}.width`}
          label="Width (px)"
          type="number"
          size="small"
          sx={{ flex: 1 }}
          inputProps={{ min: 1, max: 8192 }}
          error={sizeTouched.width && Boolean(sizeErrors.width)}
          helperText={sizeTouched.width && sizeErrors.width}
        />
        <Typography color="text.secondary">×</Typography>
        <Field
          as={TextField}
          name={`sizes.${index}.height`}
          label="Height (px)"
          type="number"
          size="small"
          sx={{ flex: 1 }}
          inputProps={{ min: 1, max: 8192 }}
          error={sizeTouched.height && Boolean(sizeErrors.height)}
          helperText={sizeTouched.height && sizeErrors.height}
        />
        <Chip label={`${size.width}×${size.height}`} size="small" variant="filled" sx={{ minWidth: 90 }} />
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
          Quick:
        </Typography>
        {quickPresets.map((preset) => (
          <Chip
            key={`${preset.w}x${preset.h}`}
            label={`${preset.w}×${preset.h}`}
            size="small"
            variant="outlined"
            onClick={() => {
              setFieldValue(`sizes.${index}.width`, preset.w);
              setFieldValue(`sizes.${index}.height`, preset.h);
            }}
            sx={{ cursor: 'pointer', fontSize: '0.65rem' }}
          />
        ))}
      </Box>
    </ListItem>
  );
};

export default SizeItem;
