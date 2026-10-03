import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Apps from '@mui/icons-material/Apps';
import AppHeader from '../../shared/components/Shell/AppHeader';
import Footer from '../../shared/components/Footer/Footer';
import NightBand from '../../shared/components/Shell/NightBand';
import StageLabel from '../../shared/components/Shell/StageLabel';
import AccentText from '../../shared/components/Shell/AccentText';
import { displaySx } from '../../shared/components/Shell/styles';
import { HUB_PATH } from '../../shared/seo/site';

/** 404 for unknown routes; its meta (noindex) comes from RouteSeo like every other page. */
const NotFoundPage: React.FC = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AppHeader />
    <Box component="main" sx={{ flex: 1, display: 'flex' }}>
      <NightBand label="Page not found" sx={{ flex: 1, py: { xs: 10, md: 14 } }}>
        <StageLabel tick>Error 404</StageLabel>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: '2.6rem', md: '4.5rem' }, mt: 2 }}>
          This page <AccentText>isn&apos;t here</AccentText>
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 2, maxWidth: 520 }}>
          The link may be old or mistyped. Every tool is still one search away on the hub.
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to={HUB_PATH}
          startIcon={<Apps />}
          sx={{ mt: 4, minHeight: 48, px: 3 }}
        >
          Browse all tools
        </Button>
      </NightBand>
    </Box>
    <Footer />
  </Box>
);

export default NotFoundPage;
