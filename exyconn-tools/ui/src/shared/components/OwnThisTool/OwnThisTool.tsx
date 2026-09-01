import React from 'react';
import { Box, Container, Typography, Button, Paper, Chip, Divider } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid2';
import { CheckCircle, Email, OpenInNew } from '@mui/icons-material';
import { toolsData, ToolItem } from '../../data/toolsData';

interface OwnThisToolProps {
  toolId: string;
}

// Helper to find tool by ID from toolsData
const findToolById = (id: string): ToolItem | undefined => {
  for (const category of toolsData) {
    const found = category.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
};

const genericFeatures = [
  'Full source code (React + TypeScript)',
  'Backend API included',
  'Documentation & setup guide',
  'Commercial usage license',
  'Lifetime updates',
];

const OwnThisTool: React.FC<OwnThisToolProps> = ({ toolId }) => {
  const theme = useTheme();
  const tool = findToolById(toolId);
  if (!tool) return null;

  const { pricing } = tool;
  const toolName = tool.name;
  const features = pricing ? pricing.features : genericFeatures;

  const isDark = theme.palette.mode === 'dark';
  const accent = isDark ? 'primary.light' : 'primary.main';
  const surfaceBg = alpha(theme.palette.text.primary, 0.04);
  const surfaceBorder = alpha(theme.palette.text.primary, 0.12);
  const ctaGradient = `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderTop: 1,
        borderBottom: 1,
        borderColor: 'divider',
        py: { xs: 6, md: 8 },
        mt: 4,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip
              label="FOR DEVELOPERS & BUSINESSES"
              size="small"
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 2, fontWeight: 600 }}
            />
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
              Own this {toolName}
            </Typography>
            {pricing ? (
              <Typography variant="h3" fontWeight={800} color={accent} sx={{ mb: 1 }}>
                ${pricing.price}{' '}
                <Typography component="span" variant="h6" color="text.secondary">
                  {pricing.currency}
                </Typography>
              </Typography>
            ) : (
              <Typography variant="h4" fontWeight={700} color={accent} sx={{ mb: 1 }}>
                Contact for Pricing
              </Typography>
            )}
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Get the complete source code and deploy on your own infrastructure.
            </Typography>

            <Box sx={{ mb: 3 }}>
              {features.map((feature) => (
                <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: isDark ? 'success.light' : 'success.main' }} />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>

            {pricing?.alterationNote && (
              <Paper
                sx={{
                  bgcolor: surfaceBg,
                  border: 1,
                  borderColor: surfaceBorder,
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography
                  variant="body2"
                  color={isDark ? 'warning.light' : 'warning.dark'}
                  fontWeight={500}
                >
                  ⚠️ {pricing.alterationNote}
                </Typography>
              </Paper>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<Email />}
                href={`mailto:services@exyconn.com?subject=Inquiry about purchasing ${toolName}`}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  background: ctaGradient,
                }}
              >
                Contact to Purchase
              </Button>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Mail to services@exyconn.com if you are interested to purchase
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              sx={{
                bgcolor: surfaceBg,
                border: 1,
                borderColor: surfaceBorder,
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
                WHAT YOU GET
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.primary">
                    📦 Source Code
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Complete React + TypeScript codebase
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.primary">
                    🔧 Backend API
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Node.js/Express server with all endpoints
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.primary">
                    📖 Documentation
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Setup guide and API documentation
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.primary">
                    🎯 Lifetime License
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use in unlimited projects
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button
                variant="text"
                endIcon={<OpenInNew fontSize="small" />}
                href="https://tools.exyconn.com"
                target="_blank"
                sx={{ color: accent }}
              >
                View more tools at Exyconn
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default OwnThisTool;
