import React from 'react';
import {
  AppBar, Toolbar, Box, Typography, TextField, InputAdornment,
  IconButton, Tooltip, Badge,
} from '@mui/material';
import { Search, Clear, DarkMode, LightMode, Key } from '@mui/icons-material';
import { ToolsHeaderProps } from './types';

const LOGO_URL = 'https://ik.imagekit.io/esdata1/exyconn/logo/exyconn.svg';

const ToolsHeader: React.FC<ToolsHeaderProps> = ({
  searchQuery, onSearchChange, mode, onToggleTheme, onLogoClick, onOpenSecrets,
}) => (
  <AppBar position="sticky" elevation={0}
    sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
    <Toolbar sx={{ justifyContent: 'space-between', minHeight: 56, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }} onClick={onLogoClick}>
        <img src={LOGO_URL} alt="Exyconn" style={{ height: 32, width: 'auto' }} />
        <Typography variant="h6"
          sx={{ fontWeight: 700, color: 'text.primary', display: { xs: 'none', sm: 'block' } }}>
          Free Tools
        </Typography>
      </Box>

      <Box sx={{ flex: 1, maxWidth: 400, mx: 3, display: { xs: 'none', md: 'block' } }}>
        <TextField fullWidth size="small" placeholder="Search tools..." value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}><Clear fontSize="small" /></IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } } }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="API Keys & Secrets">
          <IconButton onClick={onOpenSecrets} size="small"
            sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
            <Badge variant="dot" color="warning" invisible={!!localStorage.getItem('openai_api_key')}>
              <Key fontSize="small" />
            </Badge>
          </IconButton>
        </Tooltip>
        <Tooltip title={`${mode === 'light' ? 'Dark' : 'Light'} mode`}>
          <IconButton onClick={onToggleTheme}>
            {mode === 'light' ? <DarkMode /> : <LightMode sx={{ color: '#fbbf24' }} />}
          </IconButton>
        </Tooltip>
      </Box>
    </Toolbar>

    <Box sx={{ px: 2, pb: 1.5, display: { xs: 'block', md: 'none' } }}>
      <TextField fullWidth size="small" placeholder="Search tools..." value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onSearchChange('')}><Clear fontSize="small" /></IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'action.hover' } }}
      />
    </Box>
  </AppBar>
);

export default ToolsHeader;
