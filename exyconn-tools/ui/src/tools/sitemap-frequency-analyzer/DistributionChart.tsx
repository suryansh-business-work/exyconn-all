import React from 'react';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';

interface DistributionChartProps {
  title: string;
  data: Record<string, number>;
  totalUrls: number;
  getColor: (key: string) => string;
  emptyMessage: string;
}

const DistributionChart: React.FC<DistributionChartProps> = ({
  title,
  data,
  totalUrls,
  getColor,
  emptyMessage,
}) => {
  const maxCount = Math.max(...Object.values(data), 1);
  const entries = Object.entries(data);

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {entries.length > 0 ? (
          entries
            .sort((a, b) => b[1] - a[1])
            .map(([key, count]) => (
              <Box key={key} sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                    {title.includes('Priority') ? `Priority ${key}` : key}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {count.toLocaleString()} ({((count / totalUrls) * 100).toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(count / maxCount) * 100}
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: 'grey.100',
                    '& .MuiLinearProgress-bar': { bgcolor: getColor(key) },
                  }}
                />
              </Box>
            ))
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            {emptyMessage}
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default DistributionChart;
