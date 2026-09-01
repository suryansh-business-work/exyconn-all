import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { SearchOff, Home } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

/** 404 page shown for unknown routes (replaces the old silent redirect). */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Page not found | Exyconn Tools';
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 2,
        }}
      >
        <SearchOff sx={{ fontSize: 64, color: 'text.disabled' }} />
        <Typography variant="h1" sx={{
          fontWeight: 800, lineHeight: 1, color: 'text.disabled',
          fontSize: { xs: '3.5rem', sm: '5rem' },
        }}>
          404
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          Page not found
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          The page you are looking for doesn&apos;t exist or may have moved.
          Browse all free tools instead.
        </Typography>
        <Button variant="contained" startIcon={<Home />}
          onClick={() => navigate('/tools')} sx={{ mt: 1 }}>
          Browse all tools
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
