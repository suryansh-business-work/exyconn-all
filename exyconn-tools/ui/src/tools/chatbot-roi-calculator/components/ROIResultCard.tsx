import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface ROIResultCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error';
  icon?: React.ReactNode;
  highlighted?: boolean;
}

const ROIResultCard: React.FC<ROIResultCardProps> = ({
  label,
  value,
  subtitle,
  color = 'primary',
  icon,
  highlighted = false,
}) => {
  const colorMap = {
    primary: {
      bg: 'primary.50',
      border: 'primary.200',
      text: 'primary.main',
    },
    success: {
      bg: 'success.50',
      border: 'success.200',
      text: 'success.main',
    },
    warning: {
      bg: 'warning.50',
      border: 'warning.200',
      text: 'warning.main',
    },
    info: {
      bg: 'info.50',
      border: 'info.200',
      text: 'info.main',
    },
    error: {
      bg: 'error.50',
      border: 'error.200',
      text: 'error.main',
    },
  };

  const colors = colorMap[color];

  return (
    <Paper
      elevation={highlighted ? 2 : 0}
      sx={{
        p: 3,
        bgcolor: colors.bg,
        border: highlighted ? 2 : 1,
        borderColor: colors.border,
        borderRadius: 2,
        textAlign: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
        ...(highlighted && {
          transform: 'scale(1.02)',
        }),
      }}
    >
      {icon && <Box sx={{ mb: 1, color: colors.text }}>{icon}</Box>}
      <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={700} sx={{ color: colors.text, mb: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export default ROIResultCard;
