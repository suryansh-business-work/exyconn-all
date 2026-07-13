import React, { useState } from 'react';
import { Container, Alert, Snackbar, Paper, Typography, Slider, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SmartToy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { UserAgentRule } from './types';
import SitemapUrlsSection from './SitemapUrlsSection';
import UserAgentRulesSection from './UserAgentRulesSection';
import GeneratedOutput from './GeneratedOutput';

const RobotsSitemapGenerator: React.FC = () => {
  const [sitemaps, setSitemaps] = useState<string[]>(['']);
  const [rules, setRules] = useState<UserAgentRule[]>([{ id: '1', userAgent: '*', allow: ['/'], disallow: [] }]);
  const [crawlDelay, setCrawlDelay] = useState<number>(0);
  const [generatedTxt, setGeneratedTxt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addSitemap = () => setSitemaps([...sitemaps, '']);
  const removeSitemap = (index: number) => setSitemaps(sitemaps.filter((_, i) => i !== index));
  const updateSitemap = (index: number, value: string) => {
    const updated = [...sitemaps];
    updated[index] = value;
    setSitemaps(updated);
  };

  const addRule = () => {
    setRules([...rules, { id: Date.now().toString(), userAgent: '*', allow: [], disallow: [] }]);
  };
  const removeRule = (id: string) => setRules(rules.filter((r) => r.id !== id));
  const updateRule = (id: string, field: keyof UserAgentRule, value: string | string[]) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addPath = (ruleId: string, type: 'allow' | 'disallow') => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, [type]: [...r[type], '/'] } : r)));
  };
  const updatePath = (ruleId: string, type: 'allow' | 'disallow', index: number, value: string) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r;
        const updated = [...r[type]];
        updated[index] = value;
        return { ...r, [type]: updated };
      })
    );
  };
  const removePath = (ruleId: string, type: 'allow' | 'disallow', index: number) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, [type]: r[type].filter((_, i) => i !== index) } : r)));
  };

  const generateRobots = () => {
    const lines: string[] = [];
    rules.forEach((rule) => {
      lines.push(`User-agent: ${rule.userAgent}`);
      rule.disallow.forEach((p) => p.trim() && lines.push(`Disallow: ${p}`));
      rule.allow.forEach((p) => p.trim() && lines.push(`Allow: ${p}`));
      if (crawlDelay > 0) lines.push(`Crawl-delay: ${crawlDelay}`);
      lines.push('');
    });
    sitemaps.forEach((s) => s.trim() && lines.push(`Sitemap: ${s}`));
    setGeneratedTxt(lines.join('\n'));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedTxt);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedTxt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    a.click();
  };

  return (
    <ToolLayout toolName="Robots.txt Sitemap Generator" toolIcon={<SmartToy />} toolColor="#84cc16">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SitemapUrlsSection
              sitemaps={sitemaps}
              onAdd={addSitemap}
              onRemove={removeSitemap}
              onUpdate={updateSitemap}
            />
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                Crawl Delay: {crawlDelay === 0 ? 'None' : `${crawlDelay} seconds`}
              </Typography>
              <Slider
                value={crawlDelay}
                onChange={(_, v) => setCrawlDelay(v as number)}
                min={0}
                max={30}
                step={1}
                marks={[
                  { value: 0, label: '0' },
                  { value: 10, label: '10' },
                  { value: 30, label: '30' },
                ]}
                size="small"
              />
            </Paper>
            <UserAgentRulesSection
              rules={rules}
              onAddRule={addRule}
              onRemoveRule={removeRule}
              onUpdateRule={updateRule}
              onAddPath={addPath}
              onUpdatePath={updatePath}
              onRemovePath={removePath}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={generateRobots}
              startIcon={<SmartToy />}
              sx={{ mt: 2, bgcolor: '#84cc16', '&:hover': { bgcolor: '#65a30d' } }}
            >
              Generate robots.txt
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <GeneratedOutput generatedTxt={generatedTxt} onCopy={handleCopy} onDownload={handleDownload} />
          </Grid>
        </Grid>
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

export default RobotsSitemapGenerator;
