import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Slider,
  Button,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Brush, Delete, Undo, Download, Circle } from '@mui/icons-material';

interface Props {
  image: string;
  onSave: (editedImage: string) => void;
  onClose: () => void;
}

const EraseTool: React.FC<Props> = ({ image, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(20);
  const [brushType, setBrushType] = useState<'round' | 'square'>('round');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = Math.min(600, img.width);
      canvas.height = (canvas.width / img.width) * img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      saveToHistory();
    };
    img.src = image;
  }, [image]);

  const erase = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    if (brushType === 'round') {
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    erase(e);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveToHistory();
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      ctx.putImageData(history[newIndex], 0, 0);
      setHistoryIndex(newIndex);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <Paper elevation={3} sx={{ p: 2, maxWidth: 700 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Brush color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Erase Tool
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Undo">
            <IconButton size="small" onClick={handleUndo} disabled={historyIndex <= 0}>
              <Undo fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear All">
            <IconButton size="small" onClick={handleClear} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Circle sx={{ fontSize: brushSize / 2, color: 'primary.main' }} />
          <Slider
            value={brushSize}
            min={5}
            max={100}
            onChange={(_, v) => setBrushSize(v as number)}
            size="small"
            sx={{ width: 120 }}
          />
          <Typography variant="caption">{brushSize}px</Typography>
        </Box>
        <ToggleButtonGroup value={brushType} exclusive onChange={(_, v) => v && setBrushType(v)} size="small">
          <ToggleButton value="round">○</ToggleButton>
          <ToggleButton value="square">□</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          mb: 2,
          bgcolor: 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={erase}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{ display: 'block', cursor: 'crosshair' }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" size="small" startIcon={<Download />} onClick={handleSave}>
          Apply Changes
        </Button>
      </Box>
    </Paper>
  );
};

export default EraseTool;
