import { useRef, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Grid from '@mui/material/Grid2';
import Visibility from '@mui/icons-material/Visibility';
import Download from '@mui/icons-material/Download';
import { MdCode } from 'react-icons/md';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import {
  ImageFormat, MAX_DIMENSION,
  captureNode, clampDimension, downloadDataUrl, outputFileName, stripScripts,
} from './utils';

const COLOR = '#22c55e';

export default function HtmlToImage() {
  const [html, setHtml] = useState('');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [scale, setScale] = useState(1);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [previewHtml, setPreviewHtml] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const captureRef = useRef<HTMLDivElement>(null);

  const renderPreview = () => {
    if (!html.trim()) { setError('Paste an HTML snippet first.'); return; }
    setPreviewHtml(stripScripts(html));
    setResultUrl('');
  };

  const generate = async () => {
    const node = captureRef.current;
    if (!node) { setError('Render the preview first.'); return; }
    setGenerating(true);
    try {
      setResultUrl(await captureNode(node, { format, width, height, scale }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ToolLayout toolName="HTML to Image" toolIcon={<MdCode />} toolColor={COLOR}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>HTML Snippet</Typography>
              <TextField
                fullWidth multiline minRows={10} maxRows={20}
                label="HTML snippet"
                placeholder={'<style>\n  .card { padding: 24px; font-family: sans-serif; }\n</style>\n<div class="card">Hello world</div>'}
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                slotProps={{ htmlInput: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
              />
              <Button
                variant="outlined" startIcon={<Visibility />} onClick={renderPreview}
                disabled={!html.trim()} sx={{ mt: 2, color: COLOR, borderColor: COLOR }}
              >
                Render Preview
              </Button>
            </Paper>

            {previewHtml && (
              <Paper variant="outlined" sx={{ mt: 2, p: 2, overflow: 'auto' }}>
                <Typography variant="subtitle2" gutterBottom>Preview</Typography>
                <div
                  ref={captureRef}
                  style={{ width, height, overflow: 'hidden', background: '#ffffff', color: '#000000' }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </Paper>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Output Options</Typography>

              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth size="small" type="number" label="Width (px)" value={width}
                  onChange={(e) => setWidth(clampDimension(Number.parseInt(e.target.value, 10)))}
                  slotProps={{ htmlInput: { min: 1, max: MAX_DIMENSION } }}
                />
                <TextField
                  fullWidth size="small" type="number" label="Height (px)" value={height}
                  onChange={(e) => setHeight(clampDimension(Number.parseInt(e.target.value, 10)))}
                  slotProps={{ htmlInput: { min: 1, max: MAX_DIMENSION } }}
                />
              </Stack>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Scale</Typography>
              <ToggleButtonGroup exclusive size="small" value={scale} onChange={(_, v) => v !== null && setScale(v)} sx={{ mb: 2 }}>
                <ToggleButton value={1}>1x</ToggleButton>
                <ToggleButton value={2}>2x</ToggleButton>
                <ToggleButton value={3}>3x</ToggleButton>
              </ToggleButtonGroup>

              <Typography variant="subtitle2" sx={{ mb: 1 }}>Format</Typography>
              <ToggleButtonGroup exclusive size="small" value={format} onChange={(_, v) => v !== null && setFormat(v)} sx={{ mb: 2 }}>
                <ToggleButton value="png">PNG</ToggleButton>
                <ToggleButton value="jpeg">JPEG</ToggleButton>
                <ToggleButton value="svg">SVG</ToggleButton>
              </ToggleButtonGroup>

              {generating && <LinearProgress sx={{ my: 2 }} color="success" />}

              <Button
                variant="contained" fullWidth onClick={generate}
                disabled={!previewHtml || generating}
                sx={{ bgcolor: COLOR, '&:hover': { bgcolor: '#16a34a' }, mt: 1 }}
              >
                {generating ? 'Generating…' : 'Generate Image'}
              </Button>

              {resultUrl && (
                <>
                  <Paper variant="outlined" sx={{ mt: 2, p: 1, textAlign: 'center' }}>
                    <img src={resultUrl} alt="Generated snippet output" style={{ maxWidth: '100%' }} />
                  </Paper>
                  <Button
                    variant="outlined" fullWidth startIcon={<Download />}
                    onClick={() => downloadDataUrl(resultUrl, outputFileName(format))}
                    sx={{ mt: 2, color: COLOR, borderColor: COLOR }}
                  >
                    Download {format.toUpperCase()}
                  </Button>
                </>
              )}

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                &lt;script&gt; tags are stripped before rendering. Everything is processed locally
                in your browser — your HTML never leaves your device.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
}
