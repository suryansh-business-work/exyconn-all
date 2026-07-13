import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Description } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import FileUploadArea from './FileUploadArea';
import MarkdownOutput from './MarkdownOutput';

const DocxToMarkdown: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (
      droppedFile?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      droppedFile?.name.endsWith('.docx')
    ) {
      setFile(droppedFile);
      setMarkdown('');
    } else {
      setError('Please drop a DOCX file');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMarkdown('');
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(APIs.converterTools.docxToMarkdown, {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { success: boolean; error?: string; data?: { markdown: string } };
      if (!res.ok) throw new Error(data.error || 'Conversion failed');
      setMarkdown(data.data?.markdown || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file?.name.replace('.docx', '.md') || 'converted.md';
    a.click();
  };

  return (
    <ToolLayout toolName="DOCX to Markdown" toolIcon={<Description />} toolColor="#2563eb">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FileUploadArea
              file={file}
              loading={loading}
              dragOver={dragOver}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
              onDragOver={() => setDragOver(true)}
              onDragLeave={() => setDragOver(false)}
              onRemoveFile={() => setFile(null)}
              onConvert={handleConvert}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <MarkdownOutput markdown={markdown} onCopy={handleCopy} onDownload={handleDownload} />
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

export default DocxToMarkdown;
