import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { SmartToy, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface SummaryStatsProps {
  validCount: number;
  totalUrls: number;
  invalidCount: number;
  robotsTxtExists: boolean;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ validCount, totalUrls, invalidCount, robotsTxtExists }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 2,
      mb: 3,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'success.50',
        border: 1,
        borderColor: 'success.200',
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" fontWeight={700} color="success.main">
        {validCount}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Valid Sitemaps
      </Typography>
    </Paper>

    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: 'primary.50',
        border: 1,
        borderColor: 'primary.200',
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" fontWeight={700} color="primary.main">
        {totalUrls.toLocaleString()}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Total URLs
      </Typography>
    </Paper>

    {invalidCount > 0 && (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'error.50',
          border: 1,
          borderColor: 'error.200',
          borderRadius: 2,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={700} color="error.main">
          {invalidCount}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Invalid
        </Typography>
      </Paper>
    )}

    <Paper
      elevation={0}
      sx={{
        p: 2,
        bgcolor: robotsTxtExists ? 'info.50' : 'grey.100',
        border: 1,
        borderColor: robotsTxtExists ? 'info.200' : 'grey.300',
        borderRadius: 2,
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
        <SmartToy color={robotsTxtExists ? 'info' : 'disabled'} />
        {robotsTxtExists ? (
          <CheckCircle color="success" fontSize="small" />
        ) : (
          <ErrorIcon color="disabled" fontSize="small" />
        )}
      </Box>
      <Typography variant="body2" color="text.secondary">
        robots.txt
      </Typography>
    </Paper>
  </Box>
);

export default SummaryStats;
