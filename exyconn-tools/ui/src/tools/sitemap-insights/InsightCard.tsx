import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';

interface InsightCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const InsightCard: React.FC<InsightCardProps> = ({ title, icon, children }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {icon}
        <Typography variant="subtitle2" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      {children}
    </CardContent>
  </Card>
);

export default InsightCard;
