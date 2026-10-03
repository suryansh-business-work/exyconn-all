import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Logo from '../Logo/Logo';
import NightBand from '../Shell/NightBand';
import StageLabel from '../Shell/StageLabel';
import { toolsData, getToolCounts } from '../../data/toolsData';
import { categoryPath } from '../../seo/site';
import { footerLinks } from './footerLinks';

const linkSx = {
  color: 'text.secondary',
  fontSize: '0.9rem',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0.5,
  minHeight: 32,
  '&:hover': { color: 'text.primary' },
} as const;

/** Night footer: brand, every category, company links. */
const Footer: React.FC = () => {
  const { total } = getToolCounts();
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ mt: 'auto' }}>
      <NightBand sx={{ pt: { xs: 6, md: 8 }, pb: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'minmax(0, 1.2fr) minmax(0, 2fr) minmax(0, 0.9fr)' },
          }}
        >
          <Box>
            <Logo height={28} />
            <Typography sx={{ color: 'text.secondary', mt: 2, maxWidth: 340, fontSize: '0.95rem' }}>
              {total} free tools for SEO, documents, images and AI — built by Exyconn, private by default, no signup.
            </Typography>
          </Box>
          <Box component="nav" aria-label="Tool categories">
            <StageLabel tick>Categories</StageLabel>
            <Box
              component="ul"
              sx={{
                listStyle: 'none',
                mt: 1.5,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                columnGap: 3,
              }}
            >
              {toolsData.map((category) => (
                <li key={category.slug}>
                  <Link component={RouterLink} to={categoryPath(category.slug)} underline="none" sx={linkSx}>
                    {category.category}
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
          <Box component="nav" aria-label="Exyconn">
            <StageLabel tick>Exyconn</StageLabel>
            <Box component="ul" sx={{ listStyle: 'none', mt: 1.5 }}>
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} target="_blank" rel="noopener noreferrer" underline="none" sx={linkSx}>
                    {link.label}
                    <OpenInNew sx={{ fontSize: 12, opacity: 0.7 }} aria-hidden />
                  </Link>
                </li>
              ))}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            mt: 6,
            pt: 3,
            borderTop: 1,
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'space-between',
          }}
        >
          <StageLabel>© {year} Exyconn. All rights reserved.</StageLabel>
          <StageLabel>tools.exyconn.com</StageLabel>
        </Box>
      </NightBand>
    </Box>
  );
};

export default Footer;
