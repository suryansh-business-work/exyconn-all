import React, { useRef, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Download from '@mui/icons-material/Download';

const CANVAS_H = 150;

interface SignatureControlsProps {
  position: string;
  onPositionChange: (value: string) => void;
  pageTarget: string;
  onPageTargetChange: (value: string) => void;
  sigSize: string;
  onSigSizeChange: (value: string) => void;
  processing: boolean;
  hasFile: boolean;
  hasResult: boolean;
  onSign: () => void;
  onDownload: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const SignatureControls: React.FC<SignatureControlsProps> = ({
  position, onPositionChange, pageTarget, onPageTargetChange,
  sigSize, onSigSizeChange, processing, hasFile, hasResult,
  onSign, onDownload, canvasRef,
}) => {
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = CANVAS_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000';
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [canvasRef]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    const m = e as React.MouseEvent;
    return { x: m.clientX - rect.left, y: m.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => { drawingRef.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Draw Your Signature</Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2, touchAction: 'none' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: CANVAS_H, cursor: 'crosshair', display: 'block' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      </Box>
      <Button size="small" onClick={clearCanvas} sx={{ mb: 2 }}>Clear Signature</Button>
      <Grid container spacing={2}>
        <Grid size={{ xs: 4 }}>
          <TextField select fullWidth label="Position" value={position} onChange={(e) => onPositionChange(e.target.value)} size="small">
            <MenuItem value="bottom-left">Bottom Left</MenuItem>
            <MenuItem value="bottom-right">Bottom Right</MenuItem>
            <MenuItem value="center">Center</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField select fullWidth label="Page" value={pageTarget} onChange={(e) => onPageTargetChange(e.target.value)} size="small">
            <MenuItem value="first">First</MenuItem>
            <MenuItem value="last">Last</MenuItem>
            <MenuItem value="all">All</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField select fullWidth label="Size" value={sigSize} onChange={(e) => onSigSizeChange(e.target.value)} size="small">
            <MenuItem value="small">Small</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="large">Large</MenuItem>
          </TextField>
        </Grid>
      </Grid>
      {processing && <LinearProgress sx={{ mt: 2 }} />}
      <Button variant="contained" fullWidth onClick={onSign} disabled={!hasFile || processing}
        sx={{ mt: 2, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}>
        {processing ? 'Signing…' : 'Sign PDF'}
      </Button>
      {hasResult && (
        <Button variant="outlined" fullWidth startIcon={<Download />} onClick={onDownload}
          sx={{ mt: 2, color: '#0ea5e9', borderColor: '#0ea5e9' }}>
          Download Signed PDF
        </Button>
      )}
    </Paper>
  );
};

export default SignatureControls;
