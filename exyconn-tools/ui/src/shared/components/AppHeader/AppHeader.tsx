import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip, Button } from '@mui/material';
import { DarkMode, LightMode, Home, ArrowBack } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  showBack?: boolean;
  title?: string;
}

const LOGO_URL = 'https://ik.imagekit.io/esdata1/exyconn/logo/exyconn.svg';

const AppHeader: React.FC<Props> = ({ showBack = false, title }) => {
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const isToolsPage = location.pathname === '/' || location.pathname === '/tools';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between', minHeight: 48, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showBack && !isToolsPage && (
            <Tooltip title="Back to Tools">
              <IconButton size="small" onClick={() => navigate('/tools')} sx={{ mr: 0.5 }}>
                <ArrowBack fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate('/tools')}
          >
            <img src={LOGO_URL} alt="Exyconn Logo" style={{ height: 28, width: 'auto' }} />
            <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {title || 'Tools'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {!isToolsPage && (
            <Button
              size="small"
              startIcon={<Home fontSize="small" />}
              onClick={() => navigate('/tools')}
              sx={{ mr: 1, fontSize: '0.75rem' }}
            >
              All Tools
            </Button>
          )}
          <Tooltip title={`${mode === 'light' ? 'Dark' : 'Light'} mode`}>
            <IconButton size="small" onClick={toggleTheme}>
              {mode === 'light' ? (
                <DarkMode fontSize="small" />
              ) : (
                <LightMode fontSize="small" sx={{ color: '#fbbf24' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
