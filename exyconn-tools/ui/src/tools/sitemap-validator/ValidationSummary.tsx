import React from 'react';
import { Paper, Box, Typography, Chip, Stack } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';
import { ValidationResult } from './types';

interface ValidationSummaryProps {
  result: ValidationResult;
  errorCount: number;
  warningCount: number;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ValidationSummary: React.FC<ValidationSummaryProps> = ({ result, errorCount, warningCount }) => (
  <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      {result.isValid ? <CheckCircle color="success" /> : <ErrorIcon color="error" />}
      <Typography variant="subtitle2" fontWeight={600}>
        {result.isValid ? 'Valid Sitemap' : 'Invalid Sitemap'}
      </Typography>
    </Box>
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          URLs Found
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {result.urlCount.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          File Size
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {formatBytes(result.fileSize)}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Errors
        </Typography>
        <Chip label={errorCount} size="small" color={errorCount > 0 ? 'error' : 'success'} />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Warnings
        </Typography>
        <Chip label={warningCount} size="small" color={warningCount > 0 ? 'warning' : 'success'} />
      </Box>
    </Stack>
  </Paper>
);

export default ValidationSummary;
