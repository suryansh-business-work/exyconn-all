import type { ReactElement } from 'react';
import { useT } from '@exyconn/i18n';
import NearMeIcon from '@mui/icons-material/NearMe';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import GestureIcon from '@mui/icons-material/Gesture';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import ImageIcon from '@mui/icons-material/Image';
import DrawIcon from '@mui/icons-material/Draw';
import UndoIcon from '@mui/icons-material/Undo';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {
  Flex,
  IconButton,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { PDF_FONT_SIZES, PDF_INKS, type PdfTool } from './pdf-editor.types';
import type { PdfAnnotationsApi } from './usePdfAnnotations';

const TOOLS: ReadonlyArray<{ value: PdfTool; label: string; icon: ReactElement }> = [
  { value: 'select', label: 'Select and move', icon: <NearMeIcon fontSize="small" /> },
  { value: 'text', label: 'Add text', icon: <TextFieldsIcon fontSize="small" /> },
  { value: 'draw', label: 'Draw freehand', icon: <GestureIcon fontSize="small" /> },
  { value: 'rect', label: 'Rectangle', icon: <CropSquareIcon fontSize="small" /> },
  { value: 'highlight', label: 'Highlight', icon: <BorderColorIcon fontSize="small" /> },
  {
    value: 'whiteout',
    label: 'White-out (cover text)',
    icon: <FormatPaintIcon fontSize="small" />,
  },
  { value: 'image', label: 'Add image', icon: <ImageIcon fontSize="small" /> },
  { value: 'signature', label: 'Add signature', icon: <DrawIcon fontSize="small" /> },
];

interface PdfToolbarProps {
  api: PdfAnnotationsApi;
  zoom: number;
  onZoom: (zoom: number) => void;
  /** Image and Signature first need a picture; the dialog asks for it. */
  onPickStamp: (tool: 'image' | 'signature') => void;
}

/** Tools, pen, undo and zoom — the strip above the pages. */
export function PdfToolbar({ api, zoom, onZoom, onPickStamp }: Readonly<PdfToolbarProps>) {
  const t = useT();
  const choose = (_event: unknown, next: PdfTool | null) => {
    if (next === 'image' || next === 'signature') {
      onPickStamp(next);
    } else if (next) {
      api.setTool(next);
    }
  };
  return (
    <Flex direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={api.tool}
        onChange={choose}
        aria-label={t('Editing tool')}
      >
        {TOOLS.map((tool) => (
          <ToggleButton key={tool.value} value={tool.value} aria-label={t(tool.label)}>
            <Tooltip title={t(tool.label)}>{tool.icon}</Tooltip>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <TextField
        select
        size="small"
        label={t('Ink')}
        value={api.color}
        onChange={(event) => api.setColor(event.target.value)}
        sx={{ minWidth: 110 }}
      >
        {PDF_INKS.map((ink) => (
          <MenuItem key={ink.value} value={ink.value}>
            {t(ink.label)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        label={t('Text size')}
        value={api.fontSize}
        onChange={(event) => api.setFontSize(Number(event.target.value))}
        sx={{ minWidth: 100 }}
      >
        {PDF_FONT_SIZES.map((size) => (
          <MenuItem key={size} value={size}>
            {size} pt
          </MenuItem>
        ))}
      </TextField>
      <IconButton aria-label={t('Undo')} onClick={api.undo} disabled={!api.canUndo}>
        <UndoIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t('Delete selected')}
        onClick={() => api.selectedId && api.remove(api.selectedId)}
        disabled={!api.selectedId}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t('Zoom out')}
        onClick={() => onZoom(zoom - 0.25)}
        disabled={zoom <= 0.5}
      >
        <ZoomOutIcon fontSize="small" />
      </IconButton>
      <IconButton
        aria-label={t('Zoom in')}
        onClick={() => onZoom(zoom + 0.25)}
        disabled={zoom >= 2}
      >
        <ZoomInIcon fontSize="small" />
      </IconButton>
    </Flex>
  );
}
