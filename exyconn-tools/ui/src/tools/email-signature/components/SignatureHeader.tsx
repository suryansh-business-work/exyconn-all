import React from 'react';
import { Box, Typography, IconButton, useTheme, useMediaQuery, Tooltip, Chip } from '@mui/material';
import { ArrowBack, Email, AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const SignatureHeader: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Email sx={{ color: 'white', fontSize: 22 }} />
          </Box>

          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.15rem' },
                lineHeight: 1.2,
              }}
            >
              Email Signature Generator
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary">
                Create professional email signatures in minutes
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<AutoAwesome sx={{ fontSize: 16 }} />}
          label="Real-time Preview"
          size="small"
          color="success"
          variant="outlined"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        />
      </Box>
    </Box>
  );
};

export default SignatureHeader;
