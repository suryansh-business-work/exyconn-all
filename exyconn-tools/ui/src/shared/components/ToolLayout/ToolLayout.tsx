import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, IconButton, Breadcrumbs, Link, Chip, Tooltip, Divider } from '@mui/material';
import { ArrowBack, DarkMode, LightMode, Home, NavigateNext } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';
import Footer from '../Footer/Footer';
import OwnThisTool from '../OwnThisTool/OwnThisTool';

interface ToolLayoutProps {
  children: React.ReactNode;
  toolName: string;
  toolIcon: React.ReactNode;
  toolColor: string;
  isMVP?: boolean;
  actions?: React.ReactNode;
}

const ToolLayout: React.FC<ToolLayoutProps> = ({ children, toolName, toolIcon, toolColor, isMVP = false, actions }) => {
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract tool ID from path (e.g., /tools/logo-set -> logo-set)
  const toolId = location.pathname.split('/').pop() || '';

  // Update document title
  React.useEffect(() => {
    document.title = `${toolName} | Exyconn Tools`;
    return () => {
      document.title = 'Exyconn Tools';
    };
  }, [toolName]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            justifyContent: 'space-between',
            minHeight: 52,
            px: { xs: 1.5, sm: 2 },
          }}
        >
          {/* Left side - Back & Breadcrumb */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Back to Tools">
              <IconButton
                size="small"
                onClick={() => navigate('/tools')}
                sx={{
                  bgcolor: 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 24, alignSelf: 'center' }} />

            <Breadcrumbs
              separator={<NavigateNext fontSize="small" sx={{ fontSize: 14 }} />}
              sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
            >
              <Link
                component="button"
                underline="hover"
                color="text.secondary"
                onClick={() => navigate('/tools')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                <Home sx={{ fontSize: 16 }} />
                Tools
              </Link>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 1,
                    background: `linear-gradient(135deg, ${toolColor} 0%, ${toolColor}dd 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 2px 6px ${toolColor}40`,
                    '& svg': { color: 'white', fontSize: 14 },
                  }}
                >
                  {toolIcon}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>
                  {toolName}
                </Typography>
                {isMVP && (
                  <Chip
                    label="MVP"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor: '#f59e0b',
                      color: 'white',
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                )}
              </Box>
            </Breadcrumbs>
          </Box>

          {/* Right side - Actions & Theme Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {actions}
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

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>

      {/* Own This Tool Section */}
      <OwnThisTool toolId={toolId} />

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default ToolLayout;
