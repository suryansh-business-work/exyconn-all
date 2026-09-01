import React, { useState, useRef, useEffect } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Chip, Slider, Snackbar, Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { QrCode, Download, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import {
  QR_SIZE_MIN, QR_SIZE_MAX, QR_SIZE_DEFAULT, DEFAULT_FG_COLOR, DEFAULT_BG_COLOR,
  buildReviewUrl, renderQrToCanvas, qrToPngDataUrl, downloadDataUrl,
} from './utils';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField: React.FC<Readonly<ColorFieldProps>> = ({ label, value, onChange }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <TextField type="color" size="small" value={value}
        onChange={(e) => onChange(e.target.value)}
        slotProps={{ htmlInput: { 'aria-label': `${label} color` } }}
        sx={{ width: 48, '& input': { p: 0.25, cursor: 'pointer', height: 28 } }} />
      <Typography variant="caption" color="text.secondary" fontFamily="monospace">{value}</Typography>
    </Box>
  </Box>
);

const ReviewQRCode: React.FC = () => {
  const [placeId, setPlaceId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [size, setSize] = useState(QR_SIZE_DEFAULT);
  const [fgColor, setFgColor] = useState(DEFAULT_FG_COLOR);
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = () => {
    setGeneratedLink(buildReviewUrl(placeId));
  };

  useEffect(() => {
    if (!generatedLink || !canvasRef.current) return;
    renderQrToCanvas(canvasRef.current, generatedLink, { size, fgColor, bgColor })
      .catch(() => setError('Failed to render the QR code.'));
  }, [generatedLink, size, fgColor, bgColor]);

  const handleDownload = async () => {
    try {
      const dataUrl = await qrToPngDataUrl(generatedLink, { size, fgColor, bgColor });
      downloadDataUrl(dataUrl, 'review-qr-code.png');
    } catch {
      setError('Failed to export the QR code.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
    } catch {
      setError('Could not copy the link to the clipboard.');
    }
  };

  return (
    <ToolLayout toolName="Review QR Code Generator" toolIcon={<QrCode />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Generate Review QR Code
              </Typography>
              <TextField fullWidth size="small" label="Google Place ID"
                placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                value={placeId} onChange={(e) => setPlaceId(e.target.value)}
                helperText="Find your Place ID at Google's Place ID Finder"
                sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleGenerate}
                disabled={!placeId.trim()} startIcon={<QrCode />}
                sx={{ textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                Generate QR Code
              </Button>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 3, mb: 1 }}>Customize</Typography>
              <Typography variant="body2" color="text.secondary">Size: {size}px</Typography>
              <Slider value={size} min={QR_SIZE_MIN} max={QR_SIZE_MAX} step={10} size="small"
                onChange={(_, v) => setSize(v as number)} aria-label="QR code size" />
              <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
                <ColorField label="Background" value={bgColor} onChange={setBgColor} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem' }}>
                QR codes are generated with error-correction level M and scan reliably at any of the sizes above.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            {generatedLink && (
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Your QR Code</Typography>
                <Box sx={{ mb: 2 }}>
                  <canvas ref={canvasRef} aria-label="Review QR code preview"
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e0e0e0', borderRadius: 8 }} />
                </Box>
                <Chip size="small" label={generatedLink} sx={{ mb: 2, maxWidth: '100%' }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="contained" startIcon={<Download />}
                    onClick={handleDownload} sx={{ textTransform: 'none' }}>
                    Download PNG
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                    onClick={handleCopy} sx={{ textTransform: 'none' }}>
                    Copy Link
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
        <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="success" onClose={() => setCopied(false)}>Link copied to clipboard</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default ReviewQRCode;
