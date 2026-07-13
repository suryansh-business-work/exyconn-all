import React from 'react';
import { Box, Container, Typography, Button, Paper, Chip, Divider } from '@mui/material';
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
  const tool = findToolById(toolId);
  if (!tool) return null;

  const { pricing } = tool;
  const toolName = tool.name;
  const features = pricing ? pricing.features : genericFeatures;

  return (
    <Box
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
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
              sx={{ bgcolor: 'primary.main', color: 'white', mb: 2, fontWeight: 600 }}
            />
            <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
              Own this {toolName}
            </Typography>
            {pricing ? (
              <Typography variant="h3" fontWeight={800} color="primary.light" sx={{ mb: 1 }}>
                ${pricing.price}{' '}
                <Typography component="span" variant="h6" color="grey.400">
                  {pricing.currency}
                </Typography>
              </Typography>
            ) : (
              <Typography variant="h4" fontWeight={700} color="primary.light" sx={{ mb: 1 }}>
                Contact for Pricing
              </Typography>
            )}
            <Typography variant="body1" color="grey.400" sx={{ mb: 3 }}>
              Get the complete source code and deploy on your own infrastructure.
            </Typography>

            <Box sx={{ mb: 3 }}>
              {features.map((feature, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: 'success.light' }} />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>

            {pricing?.alterationNote && (
              <Paper
                sx={{
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                  p: 2,
                  mb: 3,
                }}
              >
                <Typography variant="body2" color="warning.light" fontWeight={500}>
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
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                }}
              >
                Contact to Purchase
              </Button>
            </Box>

            <Typography variant="body2" color="grey.400" sx={{ mt: 1 }}>
              Mail to services@exyconn.com if you are interested to purchase
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper
              sx={{
                bgcolor: 'rgba(255,255,255,0.03)',
                border: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                p: 4,
                textAlign: 'center',
              }}
            >
              <Typography variant="overline" color="grey.500" sx={{ letterSpacing: 2 }}>
                WHAT YOU GET
              </Typography>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="grey.300">
                    📦 Source Code
                  </Typography>
                  <Typography variant="caption" color="grey.500">
                    Complete React + TypeScript codebase
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="grey.300">
                    🔧 Backend API
                  </Typography>
                  <Typography variant="caption" color="grey.500">
                    Node.js/Express server with all endpoints
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="grey.300">
                    📖 Documentation
                  </Typography>
                  <Typography variant="caption" color="grey.500">
                    Setup guide and API documentation
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="grey.300">
                    🎯 Lifetime License
                  </Typography>
                  <Typography variant="caption" color="grey.500">
                    Use in unlimited projects
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Button
                variant="text"
                endIcon={<OpenInNew fontSize="small" />}
                href="https://tools.exyconn.com"
                target="_blank"
                sx={{ color: 'primary.light' }}
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
