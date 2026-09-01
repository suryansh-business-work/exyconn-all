import React from 'react';
import { Box, Container, Typography, Link, Divider, Stack } from '@mui/material';
import { OpenInNew } from '@mui/icons-material';
import Logo from '../Logo/Logo';

const footerLinks = [
  { label: 'Legal', href: 'https://exyconn.com/legal' },
  { label: 'Grievance', href: 'https://exyconn.com/grievance' },
  { label: 'Privacy Policy', href: 'https://exyconn.com/privacy-policy' },
  { label: 'Terms of Service', href: 'https://exyconn.com/terms' },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            py: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Left - Logo & Copyright */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Logo height={24} sx={{ opacity: 0.85 }} />
            <Divider orientation="vertical" flexItem sx={{ height: 20, alignSelf: 'center' }} />
            <Typography variant="body2" color="text.secondary">
              © {currentYear} Exyconn. All rights reserved.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', opacity: 0.6 }}>
              v1.0.0
            </Typography>
          </Box>

          {/* Right - Links */}
          <Stack
            direction="row"
            spacing={2}
            divider={<Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />}
            sx={{ flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                color="text.secondary"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.8rem',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {link.label}
                <OpenInNew sx={{ fontSize: 12, opacity: 0.6 }} />
              </Link>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
