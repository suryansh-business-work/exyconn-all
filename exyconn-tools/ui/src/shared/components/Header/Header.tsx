import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Tooltip, Divider } from '@mui/material';
import { DarkMode, LightMode, AutoFixHigh, Undo, Redo } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  historyCount?: number;
  historyIndex?: number;
}

const Header: React.FC<Props> = ({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  historyCount = 0,
  historyIndex = -1,
}) => {
  const { mode, toggleTheme } = useTheme();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
    >
      <Toolbar variant="dense" sx={{ justifyContent: 'space-between', minHeight: 48, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AutoFixHigh sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 700 }}>
            Logo Set
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Undo/Redo Buttons */}
          {historyCount > 0 && (
            <>
              <Tooltip title={canUndo ? `Undo (${historyIndex}/${historyCount - 1})` : 'Nothing to undo'}>
                <span>
                  <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
                    <Undo fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canRedo ? `Redo (${historyIndex + 2}/${historyCount})` : 'Nothing to redo'}>
                <span>
                  <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
                    <Redo fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            </>
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

export default Header;
