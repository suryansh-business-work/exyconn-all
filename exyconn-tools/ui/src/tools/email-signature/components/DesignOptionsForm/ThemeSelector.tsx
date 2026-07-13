import React from 'react';
import { Box, Typography, Tooltip, Divider, alpha, } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { LightMode, DarkMode, Gradient, Domain, AutoAwesomeMotion } from '@mui/icons-material';
import { ThemeType, signatureThemes } from '../../types';

const themeIcons: Record<ThemeType, React.ReactNode> = {
  light: <LightMode />,
  dark: <DarkMode />,
  gradient: <Gradient />,
  corporate: <Domain />,
  elegant: <AutoAwesomeMotion />,
};

interface ThemeSelectorProps {
  selectedTheme: ThemeType;
  onThemeChange: (theme: ThemeType) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedTheme, onThemeChange }) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Divider sx={{ my: 1 }} />
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
        Color Theme
      </Typography>
      <Grid container spacing={1.5}>
        {signatureThemes.map((theme) => (
          <Grid size={{ xs: 6, sm: 2.4 }} key={theme.id}>
            <Tooltip title={theme.description}>
              <Box
                onClick={() => onThemeChange(theme.id)}
                sx={{
                  p: 1.5,
                  border: 2,
                  borderColor: selectedTheme === theme.id ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                  bgcolor: selectedTheme === theme.id ? alpha('#2563eb', 0.08) : 'transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    mx: 'auto',
                    mb: 0.5,
                    background: theme.bgColor,
                    border: '2px solid',
                    borderColor: theme.accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box sx={{ color: theme.accentColor }}>{themeIcons[theme.id]}</Box>
                </Box>
                <Typography variant="caption" fontWeight={600}>
                  {theme.name}
                </Typography>
              </Box>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default ThemeSelector;
