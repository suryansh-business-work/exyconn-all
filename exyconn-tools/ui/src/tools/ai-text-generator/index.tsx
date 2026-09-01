import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, MenuItem, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AutoAwesome, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

const AITextGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('blog-intro');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const contentTypes = [
    { value: 'blog-intro', label: 'Blog Introduction' },
    { value: 'social-post', label: 'Social Media Post' },
    { value: 'product-description', label: 'Product Description' },
    { value: 'email-subject', label: 'Email Subject Lines' },
    { value: 'tagline', label: 'Tagline / Slogan' },
    { value: 'meta-description', label: 'Meta Description' },
  ];

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'persuasive', label: 'Persuasive' },
    { value: 'informative', label: 'Informative' },
    { value: 'witty', label: 'Witty' },
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult('');
    try {
      const res = await fetch(APIs.seoTools.rewrite, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Generate a ${contentTypes.find((t) => t.value === type)?.label || type} about: ${topic}. Tone: ${tone}.`,
          style: type,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate');
      const d = data.data;
      const generated = [
        `[${contentTypes.find((t) => t.value === type)?.label}] Topic: "${topic}"`,
        `Tone: ${tone}`,
        '',
        `Analysis:`,
        `- Characters: ${d.analysis.characterCount}`,
        `- Words: ${d.analysis.wordCount}`,
        `- Sentences: ${d.analysis.sentenceCount}`,
        `- Readability Grade: ${d.analysis.readabilityGrade}`,
        '',
        'Suggestions:',
        ...d.suggestions.map((s: string) => `• ${s}`),
      ].join('\n');
      setResult(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout toolName="AI Text Generator" toolIcon={<AutoAwesome />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom><AutoAwesome sx={{ mr: 1, verticalAlign: 'middle' }} />Generate Content</Typography>
              <TextField fullWidth size="small" label="Topic / Subject" placeholder="e.g., Benefits of remote work" value={topic} onChange={(e) => setTopic(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth size="small" select label="Content Type" value={type} onChange={(e) => setType(e.target.value)} sx={{ mb: 2 }}>
                {contentTypes.map((ct) => (
                  <MenuItem key={ct.value} value={ct.value}>{ct.label}</MenuItem>
                ))}
              </TextField>
              <TextField fullWidth size="small" select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} sx={{ mb: 2 }}>
                {tones.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </TextField>
              <Button fullWidth variant="contained" onClick={handleGenerate} disabled={isLoading || !topic.trim()} sx={{ textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                {isLoading ? 'Generating...' : 'Generate'}
              </Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Generated Content</Typography>
                    <Chip label={contentTypes.find((t) => t.value === type)?.label} size="small" color="primary" />
                  </Box>
                  <Button size="small" startIcon={<ContentCopy />} onClick={handleCopy} sx={{ textTransform: 'none' }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </Box>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.7 }}>
                  {result}
                </Paper>
              </Paper>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <AutoAwesome sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a topic and select content type to generate</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default AITextGenerator;
