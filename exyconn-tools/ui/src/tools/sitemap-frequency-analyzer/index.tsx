import React, { useState } from 'react';
import {
  Container,
  Alert,
  Snackbar,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Speed, ContentCopy, Download } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { FrequencyResponse, FrequencyStats } from './types';
import DistributionChart from './DistributionChart';
import RecommendationsSection from './RecommendationsSection';

const getChangefreqColor = (freq: string): string => {
  const colors: Record<string, string> = {
    always: '#dc2626',
    hourly: '#ea580c',
    daily: '#d97706',
    weekly: '#65a30d',
    monthly: '#0d9488',
    yearly: '#2563eb',
    never: '#6b7280',
  };
  return colors[freq] || '#9ca3af';
};

/** The priority ranges the endpoint reports are labelled "High (0.8-1.0)", "Medium (…)" and "Low (…)". */
const getPriorityColor = (range: string): string => {
  if (range.startsWith('High')) return '#dc2626';
  if (range.startsWith('Medium')) return '#d97706';
  return '#6b7280';
};

/** Every URL has a changefreq or is counted as lacking one, so together they are all the URLs. */
const toFrequencyStats = (data: FrequencyResponse): FrequencyStats => ({
  changefreq: Object.fromEntries(data.changefreqStats.map((entry) => [entry.freq, entry.count])),
  priority: Object.fromEntries(data.priorityStats.map((entry) => [entry.range, entry.count])),
  totalUrls: data.changefreqStats.reduce((sum, entry) => sum + entry.count, 0) + data.urlsWithoutChangefreq,
  recommendations: data.recommendations,
});

const SitemapFrequencyAnalyzer: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<FrequencyStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a sitemap URL');
      return;
    }
    setLoading(true);
    setStats(null);

    try {
      const res = await fetch(APIs.sitemapTools.frequency, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Frequency analysis failed');
      setStats(toFrequencyStats(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to analyze sitemap');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (analysis: FrequencyStats) => {
    navigator.clipboard.writeText(JSON.stringify(analysis, null, 2));
    setCopied(true);
  };

  const handleDownload = (analysis: FrequencyStats) => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = 'sitemap-frequency-analysis.json';
    a.click();
  };

  return (
    <ToolLayout toolName="Sitemap Frequency Analyzer" toolIcon={<Speed />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Speed />}
              sx={{ minWidth: 140, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
            >
              {loading ? 'Analyzing' : 'Analyze'}
            </Button>
          </Box>
        </Paper>

        {!stats && !loading && (
          <Paper elevation={0} sx={{ p: 4, border: 1, borderColor: 'divider', borderRadius: 2, textAlign: 'center' }}>
            <Speed sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#8b5cf6' }} />
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
              }}
            >
              Enter a sitemap URL to analyze update frequency and priority
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 1,
              }}
            >
              Get insights on changefreq distribution, priority settings, and optimization recommendations
            </Typography>
          </Paper>
        )}

        {stats && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                      }}
                    >
                      Analysis Results
                    </Typography>
                    <Chip size="small" label={`${stats.totalUrls.toLocaleString()} URLs`} color="primary" />
                  </Box>
                  <Box>
                    <Tooltip title="Copy JSON">
                      <IconButton size="small" onClick={() => handleCopy(stats)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownload(stats)}>
                        <Download fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DistributionChart
                title="Change Frequency Distribution"
                data={stats.changefreq}
                totalUrls={stats.totalUrls}
                getColor={getChangefreqColor}
                emptyMessage="No changefreq values found in sitemap"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <DistributionChart
                title="Priority Distribution"
                data={stats.priority}
                totalUrls={stats.totalUrls}
                getColor={getPriorityColor}
                emptyMessage="No priority values found in sitemap"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <RecommendationsSection recommendations={stats.recommendations} />
            </Grid>
          </Grid>
        )}
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
        <Alert severity="success">Copied to clipboard!</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SitemapFrequencyAnalyzer;
