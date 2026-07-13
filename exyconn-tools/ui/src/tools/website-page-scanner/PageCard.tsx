import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  Card,
  CardContent,
  Collapse,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Article,
  Image as ImageIcon,
  Link as LinkIcon,
  Title,
} from '@mui/icons-material';
import { PageInfo } from './types';

interface PageCardProps {
  page: PageInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

const getStatusColor = (status?: number): 'default' | 'success' | 'warning' | 'error' => {
  if (!status) return 'default';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'warning';
  return 'error';
};

const PageCard: React.FC<PageCardProps> = ({ page, isExpanded, onToggle }) => {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                {page.title}
              </Typography>
              <Chip
                label={`HTTP ${page.statusCode}`}
                size="small"
                color={getStatusColor(page.statusCode)}
                sx={{ fontSize: 10 }}
              />
              <Chip label={`Depth ${page.depth}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {page.url}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Article fontSize="small" color="action" />
                <Typography variant="caption">{page.wordCount} words</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ImageIcon fontSize="small" color="action" />
                <Typography variant="caption">{page.images} images</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LinkIcon fontSize="small" color="action" />
                <Typography variant="caption">{page.links} links</Typography>
              </Box>
            </Stack>
          </Box>
          <IconButton size="small" onClick={onToggle}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={isExpanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {page.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {page.description}
              </Typography>
            )}
            {page.headings.h1.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <Title fontSize="small" />
                  <Typography variant="caption" fontWeight={600}>
                    H1 Headings
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {page.headings.h1.map((h, i) => (
                    <Chip key={i} label={h} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            )}
            {page.headings.h2.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
                  H2 Headings
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {page.headings.h2.slice(0, 5).map((h, i) => (
                    <Chip key={i} label={h} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  ))}
                  {page.headings.h2.length > 5 && (
                    <Chip label={`+${page.headings.h2.length - 5} more`} size="small" />
                  )}
                </Stack>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default PageCard;
