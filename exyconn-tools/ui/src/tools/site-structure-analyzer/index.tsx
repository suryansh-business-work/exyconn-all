import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AccountTree } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { SiteStructure } from './types';
import InputSection from './InputSection';
import OverviewPanel from './OverviewPanel';
import StructureTable from './StructureTable';

const SiteStructureAnalyzer: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxPages, setMaxPages] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SiteStructure | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.websiteTools.analyzeStructure, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, maxPages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze structure');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site-structure.json';
    a.click();
  };

  return (
    <ToolLayout toolName="Site Structure Analyzer" toolIcon={<AccountTree />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InputSection
              websiteUrl={websiteUrl}
              maxPages={maxPages}
              isLoading={isLoading}
              onUrlChange={setWebsiteUrl}
              onMaxPagesChange={setMaxPages}
              onAnalyze={handleAnalyze}
            />
            {result && <OverviewPanel result={result} onExportJSON={handleExportJSON} />}
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <StructureTable pages={result?.pages || []} />
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SiteStructureAnalyzer;
