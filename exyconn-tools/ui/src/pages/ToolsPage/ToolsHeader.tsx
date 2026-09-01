import React from 'react';
import {
  AppBar, Toolbar, Box, ButtonBase, Typography, TextField, InputAdornment,
  IconButton, Tooltip, Badge,
} from '@mui/material';
import { Search, Clear, DarkMode, LightMode, Key } from '@mui/icons-material';
import { useSecrets } from '../../shared/context/SecretsContext';
import { hasSecret } from '../../shared/services/secrets';
import { secretsConfig } from '../../shared/components/SecretsDrawer/secretsConfig';
import Logo from '../../shared/components/Logo/Logo';
import { ToolsHeaderProps } from './types';

const ToolsHeader: React.FC<Readonly<ToolsHeaderProps>> = ({
  searchQuery, onSearchChange, mode, onToggleTheme, onLogoClick, onOpenSecrets,
}) => {
  const { isOpen: secretsOpen } = useSecrets();
  // Recomputed whenever the drawer opens or closes — the only moments a key can
  // change — so the badge reflects storage rather than a value read once at boot.
  const anyKeyConfigured = React.useMemo(
    () => secretsConfig.some((field) => hasSecret(field.key)),
    [secretsOpen],
  );

  return (
    <AppBar position="sticky" elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar sx={{ gap: { xs: 1, sm: 2 }, minHeight: 56, px: { xs: 1.5, sm: 3 } }}>
        <ButtonBase onClick={onLogoClick} aria-label="Exyconn Tools home"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 1, flexShrink: 0 }}>
          <Logo height={30} />
          <Typography variant="h6"
            sx={{ fontWeight: 700, color: 'text.primary', display: { xs: 'none', md: 'block' } }}>
            Free Tools
          </Typography>
        </ButtonBase>

        <Box sx={{ flex: 1, maxWidth: 420, mx: 'auto' }}>
          <TextField fullWidth size="small" placeholder="Search tools..." value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><Search fontSize="small" color="action" /></InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" aria-label="Clear search" onClick={() => onSearchChange('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } } }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <Tooltip title="API Keys & Secrets">
            <IconButton onClick={onOpenSecrets} size="small"
              sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'action.selected' } }}>
              <Badge variant="dot" color="warning" invisible={anyKeyConfigured}>
                <Key fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={`${mode === 'light' ? 'Dark' : 'Light'} mode`}>
            <IconButton onClick={onToggleTheme}>
              {mode === 'light' ? <DarkMode /> : <LightMode sx={{ color: 'warning.main' }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default ToolsHeader;
