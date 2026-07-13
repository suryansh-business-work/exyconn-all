import React from 'react';
import {
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

interface GeneratorSettingsProps {
  defaultChangefreq: string;
  defaultPriority: number;
  onChangefreqChange: (value: string) => void;
  onPriorityChange: (value: number) => void;
}

const CHANGE_FREQUENCIES = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];

const GeneratorSettings: React.FC<GeneratorSettingsProps> = ({
  defaultChangefreq,
  defaultPriority,
  onChangefreqChange,
  onPriorityChange,
}) => (
  <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
      Default Settings
    </Typography>
    <Grid container spacing={2}>
      <Grid size={{ xs: 6 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Change Freq</InputLabel>
          <Select
            value={defaultChangefreq}
            onChange={(e) => onChangefreqChange(e.target.value)}
            label="Change Freq"
          >
            {CHANGE_FREQUENCIES.map((f) => (
              <MenuItem key={f} value={f}>
                {f}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 6 }}>
        <Typography variant="caption" color="text.secondary">
          Priority: {defaultPriority.toFixed(1)}
        </Typography>
        <Slider
          value={defaultPriority}
          onChange={(_, v) => onPriorityChange(v as number)}
          min={0}
          max={1}
          step={0.1}
          size="small"
        />
      </Grid>
    </Grid>
  </Paper>
);

export default GeneratorSettings;
