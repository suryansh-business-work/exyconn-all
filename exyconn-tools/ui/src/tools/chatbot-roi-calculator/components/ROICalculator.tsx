import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Calculate, Refresh } from '@mui/icons-material';
import ROIInputSlider from './ROIInputSlider';
import { ROIInputs } from '../types';

interface ROICalculatorProps {
  inputs: ROIInputs;
  onChange: (inputs: ROIInputs) => void;
  onReset: () => void;
}

const ROICalculator: React.FC<ROICalculatorProps> = ({ inputs, onChange, onReset }) => {
  const handleChange = (field: keyof ROIInputs) => (value: number) => {
    onChange({ ...inputs, [field]: value });
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calculate color="primary" />
          <Typography variant="h6" fontWeight={600}>
            ROI Calculator
          </Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={onReset}>
          Reset
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Adjust the sliders below to calculate your potential savings with Smart Exy Bot.
      </Typography>

      <ROIInputSlider
        label="What is the cost per hour per agent?"
        value={inputs.costPerHour}
        min={1}
        max={200}
        onChange={handleChange('costPerHour')}
        unit="$/hr"
        marks={[
          { value: 1, label: '1' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
          { value: 150, label: '150' },
          { value: 200, label: '200' },
        ]}
      />

      <ROIInputSlider
        label="How many tickets do you get each month?"
        value={inputs.ticketsPerMonth}
        min={1}
        max={2000}
        step={1}
        onChange={handleChange('ticketsPerMonth')}
        marks={[
          { value: 1, label: '1' },
          { value: 500, label: '500' },
          { value: 1000, label: '1000' },
          { value: 1500, label: '1500' },
          { value: 2000, label: '2000' },
        ]}
      />

      <ROIInputSlider
        label="Time it takes to resolve each ticket (in mins)"
        value={inputs.resolutionTimeMinutes}
        min={1}
        max={200}
        onChange={handleChange('resolutionTimeMinutes')}
        unit="mins"
        marks={[
          { value: 1, label: '1' },
          { value: 50, label: '50' },
          { value: 100, label: '100' },
          { value: 150, label: '150' },
          { value: 200, label: '200' },
        ]}
      />

      <ROIInputSlider
        label="% of tickets you want AI to resolve automatically"
        value={inputs.automationPercentage}
        min={1}
        max={100}
        onChange={handleChange('automationPercentage')}
        unit="%"
        marks={[
          { value: 1, label: '1' },
          { value: 25, label: '25' },
          { value: 50, label: '50' },
          { value: 75, label: '75' },
          { value: 100, label: '100' },
        ]}
      />
    </Paper>
  );
};

export default ROICalculator;
