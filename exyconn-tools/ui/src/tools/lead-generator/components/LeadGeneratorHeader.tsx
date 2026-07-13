import React from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import { ArrowBack, TravelExplore, Science } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LeadGeneratorHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        py: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title="Back to Tools">
          <IconButton onClick={() => navigate('/tools')} edge="start" sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
        </Tooltip>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
            }}
          >
            <TravelExplore sx={{ color: 'white', fontSize: 22 }} />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.15rem' }, lineHeight: 1.2 }}
              >
                Lead Generator
              </Typography>
              <Chip
                icon={<Science sx={{ fontSize: 14 }} />}
                label="MVP"
                size="small"
                color="warning"
                sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: 10 } }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Find businesses in any area using Google Maps
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LeadGeneratorHeader;
