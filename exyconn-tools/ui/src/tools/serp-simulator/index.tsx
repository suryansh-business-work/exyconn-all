import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Chip, Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Visibility, CheckCircle, Warning } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface SERPPreview {
  title: string;
  description: string;
  url: string;
  displayUrl: string;
}

interface SERPAnalysis {
  title: { text: string; length: number; maxLength: number };
  description: { text: string; length: number; maxLength: number };
}

interface SERPIssue {
  field: string;
  message: string;
  severity: string;
}

interface SERPResult {
  preview: SERPPreview;
  analysis: SERPAnalysis;
  issues: SERPIssue[];
  score: number;
}

const SERPSimulator: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SERPResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSimulate = async () => {
    if (!title.trim() || !description.trim() || !url.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(APIs.seoTools.serpSimulator, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, url: url.startsWith('http') ? url : `https://${url}` }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="SERP Simulator" toolIcon={<Visibility />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Preview Google Search Result
              </Typography>
              <TextField fullWidth size="small" label="Page Title" placeholder="Your page title"
                value={title} onChange={(e) => setTitle(e.target.value)}
                helperText={`${title.length}/60 characters`} sx={{ mb: 2 }} />
              <TextField fullWidth size="small" label="Meta Description" placeholder="Your meta description"
                value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3}
                helperText={`${description.length}/160 characters`} sx={{ mb: 2 }} />
              <TextField fullWidth size="small" label="URL" placeholder="https://example.com/page"
                value={url} onChange={(e) => setUrl(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleSimulate} disabled={isLoading}
                startIcon={<Visibility />} sx={{ textTransform: 'none' }}>
                {isLoading ? 'Simulating...' : 'Preview SERP'}
              </Button>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            {/* Live Preview */}
            <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Google Preview</Typography>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, fontFamily: 'Arial, sans-serif' }}>
                <Typography sx={{ color: '#1a0dab', fontSize: '1.1rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' }, mb: 0.25 }}>
                  {(result?.preview.title || title || 'Your Page Title').substring(0, 60)}
                  {(title || '').length > 60 && '...'}
                </Typography>
                <Typography sx={{ color: '#006621', fontSize: '0.8rem', mb: 0.5 }}>
                  {result?.preview.displayUrl || url || 'example.com'}
                </Typography>
                <Typography sx={{ color: '#545454', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {(result?.preview.description || description || 'Your meta description will appear here...').substring(0, 160)}
                  {(description || '').length > 160 && '...'}
                </Typography>
              </Box>
            </Paper>

            {result && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Analysis</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip size="small" label={`Score: ${result.score}/100`}
                    color={result.score >= 80 ? 'success' : result.score >= 50 ? 'warning' : 'error'} />
                  <Chip size="small" label={`Title: ${result.analysis.title.length}/${result.analysis.title.maxLength}`}
                    color={result.analysis.title.length <= result.analysis.title.maxLength ? 'success' : 'warning'} variant="outlined" />
                  <Chip size="small" label={`Desc: ${result.analysis.description.length}/${result.analysis.description.maxLength}`}
                    color={result.analysis.description.length <= result.analysis.description.maxLength ? 'success' : 'warning'} variant="outlined" />
                </Box>
                <Divider sx={{ mb: 1.5 }} />
                {result.issues.map((issue, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    {issue.severity === 'warning' ? <Warning sx={{ fontSize: 14, color: 'warning.main' }} /> : <CheckCircle sx={{ fontSize: 14, color: 'info.main' }} />}
                    <Typography variant="caption" color="text.secondary">{issue.message}</Typography>
                  </Box>
                ))}
                {result.issues.length === 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main">All optimized!</Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </ToolLayout>
  );
};

export default SERPSimulator;
