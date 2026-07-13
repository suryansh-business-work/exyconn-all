import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box } from '@mui/material';
import { Home, NavigateNext } from '@mui/icons-material';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageBreadcrumbProps {
  items?: BreadcrumbItem[];
  currentPage: string;
}

const pathLabelMap: Record<string, string> = {
  tools: 'Tools',
  'logo-set': 'Logo Set',
  'email-signature': 'Email Signature',
  'lead-generator': 'Lead Generator',
  'contact-extractor': 'Contact Extractor',
};

const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ items, currentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-generate breadcrumbs from path if items not provided
  const breadcrumbItems: BreadcrumbItem[] =
    items ||
    (() => {
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const autoItems: BreadcrumbItem[] = [];
      let currentPath = '';

      pathSegments.slice(0, -1).forEach((segment) => {
        currentPath += `/${segment}`;
        autoItems.push({
          label: pathLabelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          path: currentPath,
        });
      });

      return autoItems;
    })();

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNext fontSize="small" />}
        sx={{
          '& .MuiBreadcrumbs-separator': { mx: 0.5 },
          '& .MuiLink-root': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          },
        }}
      >
        <Link component="button" color="inherit" onClick={() => navigate('/tools')} sx={{ cursor: 'pointer' }}>
          <Home fontSize="small" />
          Home
        </Link>

        {breadcrumbItems.map((item) => (
          <Link
            key={item.path}
            component="button"
            color="inherit"
            onClick={() => item.path && navigate(item.path)}
            sx={{ cursor: 'pointer' }}
          >
            {item.label}
          </Link>
        ))}

        <Typography color="text.primary" sx={{ fontWeight: 500 }}>
          {currentPage}
        </Typography>
      </Breadcrumbs>
    </Box>
  );
};

export default PageBreadcrumb;
