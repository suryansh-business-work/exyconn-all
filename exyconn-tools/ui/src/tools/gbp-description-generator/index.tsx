import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Snackbar, Chip,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { LocationOn, CheckCircle, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface GBPDescription {
  variant: number;
  text: string;
  length: number;
  isWithinLimit: boolean;
}

interface GBPResult {
  businessName: string;
  descriptions: GBPDescription[];
  tips: string[];
}

const GBPDescriptionGenerator: React.FC = () => {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState('');
  const [uniquePoints, setUniquePoints] = useState('');
  const [result, setResult] = useState<GBPResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!businessName.trim() || !businessType.trim() || !location.trim()) {
      setError('Business name, type, and location are required.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.seoTools.gbpDescription, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType: businessType.trim(),
          location: location.trim(),
          services: services.split(',').map((s) => s.trim()).filter(Boolean),
          uniquePoints: uniquePoints.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setIsLoading(false); }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <ToolLayout toolName="GBP Description Generator" toolIcon={<LocationOn />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Generate Business Description
              </Typography>
              <TextField fullWidth size="small" label="Business Name" placeholder="Exyconn Technologies"
                value={businessName} onChange={(e) => setBusinessName(e.target.value)} sx={{ mb: 1.5 }} />
              <TextField fullWidth size="small" label="Business Type" placeholder="digital marketing agency"
                value={businessType} onChange={(e) => setBusinessType(e.target.value)} sx={{ mb: 1.5 }} />
              <TextField fullWidth size="small" label="Location" placeholder="New York, NY"
                value={location} onChange={(e) => setLocation(e.target.value)} sx={{ mb: 1.5 }} />
              <TextField fullWidth size="small" label="Services (comma-separated)" placeholder="SEO, web design, branding"
                value={services} onChange={(e) => setServices(e.target.value)} sx={{ mb: 1.5 }} />
              <TextField fullWidth size="small" label="Unique Points (comma-separated)" placeholder="Award-winning, 10+ years experience"
                value={uniquePoints} onChange={(e) => setUniquePoints(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleGenerate}
                disabled={isLoading || !businessName.trim() || !businessType.trim() || !location.trim()}
                startIcon={<LocationOn />}
                sx={{ textTransform: 'none', bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}>
                {isLoading ? 'Generating...' : 'Generate Descriptions'}
              </Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {result.descriptions.map((desc) => (
                  <Paper key={desc.variant} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>Variant {desc.variant}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip size="small" label={`${desc.length}/750 chars`}
                          color={desc.isWithinLimit ? 'success' : 'error'} variant="outlined" />
                        <Button size="small" startIcon={<ContentCopy sx={{ fontSize: '14px !important' }} />}
                          onClick={() => handleCopy(desc.text, desc.variant)}
                          sx={{ textTransform: 'none', fontSize: '0.7rem' }}>
                          {copiedIdx === desc.variant ? 'Copied!' : 'Copy'}
                        </Button>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.7, bgcolor: 'action.hover', p: 2, borderRadius: 1 }}>
                      {desc.text}
                    </Typography>
                  </Paper>
                ))}

                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Tips</Typography>
                  <List dense>
                    {result.tips.map((tip, idx) => (
                      <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText primary={tip} primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default GBPDescriptionGenerator;
