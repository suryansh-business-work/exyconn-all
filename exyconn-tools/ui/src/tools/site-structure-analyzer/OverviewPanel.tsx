import React from 'react';
import { Paper, Box, Typography, Chip, Stack, IconButton, Tooltip } from '@mui/material';
import { Download, Warning } from '@mui/icons-material';
import { SiteStructure } from './types';

interface OverviewPanelProps {
  result: SiteStructure;
  onExportJSON: () => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ result, onExportJSON }) => {
  return (
    <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Overview
        </Typography>
        <Tooltip title="Export JSON">
          <IconButton size="small" onClick={onExportJSON}>
            <Download fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Stack spacing={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Pages Analyzed
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {result.totalPages}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Internal Links
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {result.totalInternalLinks}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Max Depth
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {result.maxDepth}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Orphan Pages
          </Typography>
          <Chip
            label={result.orphanPages.length}
            size="small"
            color={result.orphanPages.length > 0 ? 'warning' : 'success'}
          />
        </Box>
      </Stack>

      {result.orphanPages.length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'warning.50',
            borderRadius: 1,
            border: 1,
            borderColor: 'warning.200',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Warning fontSize="small" color="warning" />
            <Typography variant="caption" fontWeight={600}>
              Orphan Pages
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Pages with no incoming links (hard to discover):
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {result.orphanPages.slice(0, 3).map((p, i) => (
              <Typography key={i} variant="caption" noWrap>
                {p}
              </Typography>
            ))}
            {result.orphanPages.length > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{result.orphanPages.length - 3} more
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default OverviewPanel;
