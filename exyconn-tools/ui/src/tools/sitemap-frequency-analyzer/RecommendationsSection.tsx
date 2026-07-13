import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { CheckCircle, Warning, Info } from '@mui/icons-material';

interface RecommendationsSectionProps {
  recommendations: string[];
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
  const getIcon = (rec: string) => {
    if (rec.includes('Good') || rec.includes('Excellent')) {
      return <CheckCircle fontSize="small" color="success" sx={{ mt: 0.3 }} />;
    }
    if (rec.includes('Warning') || rec.includes('Consider')) {
      return <Warning fontSize="small" color="warning" sx={{ mt: 0.3 }} />;
    }
    return <Info fontSize="small" color="info" sx={{ mt: 0.3 }} />;
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Recommendations
      </Typography>
      <Box sx={{ mt: 1 }}>
        {recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
              {getIcon(rec)}
              <Typography variant="body2">{rec}</Typography>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            Add changefreq and priority values to your sitemap for optimization recommendations
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default RecommendationsSection;
