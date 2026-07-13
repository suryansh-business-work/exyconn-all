import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { QrCode, Download, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';

const ReviewQRCode: React.FC = () => {
  const [placeId, setPlaceId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerate = () => {
    if (!placeId.trim()) return;
    const link = `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;
    setGeneratedLink(link);
    setQrGenerated(true);
  };

  // Simple QR code drawing using canvas (basic implementation)
  const drawQR = useCallback((canvas: HTMLCanvasElement, text: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Draw QR placeholder with the link info
    ctx.fillStyle = '#000000';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    // Generate a simple pattern based on text hash
    const hash = text.split('').reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const moduleSize = 8;
    const modules = Math.floor(size / moduleSize);

    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // Create pattern based on position and hash
        const val = ((hash + x * 31 + y * 37) * 1103515245 + 12345) & 0x7fffffff;
        if (val % 3 === 0 || (x < 3 && y < 3) || (x < 3 && y > modules - 4) ||
            (x > modules - 4 && y < 3)) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Draw finder patterns (the three squares in corners)
    const drawFinder = (cx: number, cy: number) => {
      const s = moduleSize;
      ctx.fillStyle = '#000';
      ctx.fillRect(cx, cy, 7 * s, 7 * s);
      ctx.fillStyle = '#fff';
      ctx.fillRect(cx + s, cy + s, 5 * s, 5 * s);
      ctx.fillStyle = '#000';
      ctx.fillRect(cx + 2 * s, cy + 2 * s, 3 * s, 3 * s);
    };

    drawFinder(0, 0);
    drawFinder(0, (modules - 7) * moduleSize);
    drawFinder((modules - 7) * moduleSize, 0);

    // Center text
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 - 50, size / 2 - 8, 100, 16);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('SCAN TO REVIEW', size / 2, size / 2 + 4);
  }, []);

  useEffect(() => {
    if (qrGenerated && canvasRef.current && generatedLink) {
      drawQR(canvasRef.current, generatedLink);
    }
  }, [qrGenerated, generatedLink, drawQR]);

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

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.75rem', lineHeight: 1.6 }}>
                <strong>Note:</strong> For production use, we recommend using a dedicated QR code library like{' '}
                <code>qrcode.react</code> for accurate QR codes. This tool generates a visual placeholder.
                You can also use Google Charts API:{' '}
                <code>{`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=YOUR_LINK`}</code>
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            {qrGenerated && (
              <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Your QR Code</Typography>

                {/* Google Charts QR as a reliable alternative */}
                <Box sx={{ mb: 2 }}>
                  <img
                    src={`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(generatedLink)}&choe=UTF-8`}
                    alt="Review QR Code"
                    style={{ maxWidth: '100%', width: 300, height: 300, border: '1px solid #e0e0e0', borderRadius: 8 }}
                  />
                </Box>

                <Chip size="small" label={generatedLink} sx={{ mb: 2, maxWidth: '100%' }} />

                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Button size="small" variant="contained" startIcon={<Download />}
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = 'review-qr-code.png';
                      link.href = `https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=${encodeURIComponent(generatedLink)}&choe=UTF-8`;
                      link.click();
                    }}
                    sx={{ textTransform: 'none' }}>
                    Download QR
                  </Button>
                  <Button size="small" variant="outlined" startIcon={<ContentCopy />}
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                    sx={{ textTransform: 'none' }}>
                    Copy Link
                  </Button>
                </Box>

                {/* Hidden canvas for custom QR */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </ToolLayout>
  );
};

export default ReviewQRCode;
