import React from 'react';
import { Box, Paper, Typography, Divider, Chip } from '@mui/material';
import { Savings, AccessTime, SmartToy, TrendingUp, AutoAwesome } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import ROIResultCard from './ROIResultCard';
import { ROIResults as ROIResultsType } from '../types';

interface ROIResultsProps {
  results: ROIResultsType;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
};

const formatHours = (value: number): string => {
  if (value >= 1000) {
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return value.toFixed(1);
};

const ROIResults: React.FC<ROIResultsProps> = ({ results }) => {
  const isPositiveROI = results.annualROI > 0;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="success" />
          <Typography variant="h6" fontWeight={600}>
            Your Savings
          </Typography>
        </Box>
        <Chip icon={<AutoAwesome />} label="Real-time calculation" size="small" color="primary" variant="outlined" />
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ROIResultCard
            label="Total Savings"
            value={`${formatCurrency(results.totalSavings)} /yr`}
            color="success"
            icon={<Savings fontSize="large" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <ROIResultCard
            label="Hours Saved"
            value={`${formatHours(results.hoursSaved)} hours /yr`}
            color="primary"
            icon={<AccessTime fontSize="large" />}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: 'grey.100',
              border: 1,
              borderColor: 'grey.300',
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <SmartToy color="action" />
            </Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
              Smart Exy Bot Cost
            </Typography>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              ${results.smartExyBotCost.toLocaleString()} /yr
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <ROIResultCard
            label="Annual ROI"
            value={`${results.annualROI.toLocaleString()}%`}
            color={isPositiveROI ? 'success' : 'error'}
            icon={<TrendingUp fontSize="large" />}
            highlighted={isPositiveROI}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h6" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
          Ready to capture this ROI?
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Build your chatbot with Smart Exy Bot and start automating support today.
        </Typography>
      </Box>
    </Paper>
  );
};

export default ROIResults;
