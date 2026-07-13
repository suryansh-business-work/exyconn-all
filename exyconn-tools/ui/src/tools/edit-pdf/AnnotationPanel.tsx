import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LinearProgress from '@mui/material/LinearProgress';
import Grid from '@mui/material/Grid2';
import Download from '@mui/icons-material/Download';
import Add from '@mui/icons-material/Add';
import Delete from '@mui/icons-material/Delete';
import { TextAnnotation } from './types';

interface AnnotationPanelProps {
  text: string;
  onTextChange: (value: string) => void;
  fontSize: number;
  onFontSizeChange: (value: number) => void;
  color: string;
  onColorChange: (value: string) => void;
  clickPos: { x: number; y: number } | null;
  currentPage: number;
  annotations: TextAnnotation[];
  onAddAnnotation: () => void;
  onRemoveAnnotation: (idx: number) => void;
  onDownload: () => void;
  processing: boolean;
}

const AnnotationPanel: React.FC<AnnotationPanelProps> = ({
  text, onTextChange, fontSize, onFontSizeChange, color, onColorChange,
  clickPos, currentPage, annotations, onAddAnnotation, onRemoveAnnotation,
  onDownload, processing,
}) => (
  <>
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Add Text Annotation</Typography>
      <TextField fullWidth label="Text Content" value={text} onChange={(e) => onTextChange(e.target.value)} size="small" sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label="Font Size" type="number" value={fontSize} onChange={(e) => onFontSizeChange(Number(e.target.value))} size="small" inputProps={{ min: 6, max: 120 }} />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Typography variant="body2">Color:</Typography>
            <input type="color" value={color} onChange={(e) => onColorChange(e.target.value)} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer' }} />
          </Box>
        </Grid>
      </Grid>
      {clickPos && <Typography variant="body2" sx={{ mt: 1 }}>Position: ({clickPos.x}, {clickPos.y}) on page {currentPage}</Typography>}
      {!clickPos && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Click on the PDF preview to set position</Typography>}
      <Button variant="outlined" startIcon={<Add />} onClick={onAddAnnotation} disabled={!clickPos || !text.trim()} sx={{ mt: 2, color: '#6366f1', borderColor: '#6366f1' }}>
        Add Annotation
      </Button>
    </Paper>

    {annotations.length > 0 && (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Annotations ({annotations.length})</Typography>
        <List dense disablePadding sx={{ maxHeight: 200, overflow: 'auto' }}>
          {annotations.map((a, i) => (
            <ListItem key={i} secondaryAction={<IconButton edge="end" size="small" onClick={() => onRemoveAnnotation(i)}><Delete fontSize="small" /></IconButton>}>
              <ListItemText primary={`"${a.text}" — page ${a.page}`} secondary={`x:${a.x} y:${a.y} size:${a.size}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    )}

    {processing && <LinearProgress sx={{ mt: 2 }} />}
    <Button variant="contained" fullWidth startIcon={<Download />} onClick={onDownload} disabled={!annotations.length || processing}
      sx={{ mt: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
      {processing ? 'Processing…' : 'Download Edited PDF'}
    </Button>
  </>
);

export default AnnotationPanel;
