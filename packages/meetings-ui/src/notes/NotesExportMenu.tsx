import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import DownloadIcon from '@mui/icons-material/Download';
import { Button, Menu, MenuItem } from '@exyconn/shell/components/ui';
import { useRichTextExport } from '@exyconn/shell/hooks/useRichTextExport';
import {
  fileName,
  notesToHtml,
  notesToJson,
  notesToMarkdown,
  notesToText,
  saveTextFile,
} from './notes-export';
import type { NotesContent } from './notes-sections';

type Format = 'pdf' | 'docx' | 'md' | 'txt' | 'json';

const FORMATS: ReadonlyArray<{ format: Format; label: string }> = [
  { format: 'pdf', label: 'PDF' },
  { format: 'docx', label: 'Word document' },
  { format: 'md', label: 'Markdown' },
  { format: 'txt', label: 'Plain text' },
  { format: 'json', label: 'JSON' },
];

interface NotesExportMenuProps {
  /** The meeting title: the file's name and the document's heading. */
  title: string;
  content: NotesContent;
}

/**
 * "Download" the notes being looked at. PDF and Word go through the portal's rich-text
 * exporter; Markdown, text and JSON are written here.
 */
export function NotesExportMenu({ title, content }: Readonly<NotesExportMenuProps>) {
  const t = useT();
  const exportRichText = useRichTextExport();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const save = async (format: Format) => {
    setAnchor(null);
    if (format === 'pdf' || format === 'docx') {
      await exportRichText(notesToHtml(title, content, t), title, format);
    } else if (format === 'md') {
      saveTextFile(fileName(title, 'md'), 'text/markdown', notesToMarkdown(title, content, t));
    } else if (format === 'txt') {
      saveTextFile(fileName(title, 'txt'), 'text/plain', notesToText(title, content, t));
    } else {
      saveTextFile(fileName(title, 'json'), 'application/json', notesToJson(title, content));
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<DownloadIcon />}
        aria-haspopup="menu"
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {t('Download')}
      </Button>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {FORMATS.map((item) => (
          <MenuItem key={item.format} onClick={() => save(item.format)}>
            {t(item.label)}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
