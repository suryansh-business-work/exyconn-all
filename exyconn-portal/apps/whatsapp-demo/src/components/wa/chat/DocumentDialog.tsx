import { useT } from '@exyconn/i18n';
import { Box, Dialog, DialogContent, DialogTitle, IconButton } from '@exyconn/shell/components/ui';
import { DataTable } from '@exyconn/shell/components/data/DataTable';
import CloseIcon from '@mui/icons-material/Close';
import type { DocSection, DocumentAttachment } from '@exyconn/wa-flow';
import { useCompact, useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SPACE } from '../../../theme/wa.tokens';

function Section({ section }: Readonly<{ section: DocSection }>) {
  const c = useWaPalette();
  let body;
  if (section.kind === 'fields') {
    body = (
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: WA_SPACE.sm,
          m: 0,
        }}
      >
        {section.fields.map((f) => (
          <Box key={f.label}>
            <Box
              component="dt"
              sx={{ fontSize: WA_FONT.meta, color: c.textMuted, textTransform: 'uppercase' }}
            >
              {f.label}
            </Box>
            <Box component="dd" sx={{ m: 0, fontWeight: 500 }}>
              {f.value}
            </Box>
          </Box>
        ))}
      </Box>
    );
  } else if (section.kind === 'table') {
    const columns = section.columns.map((label, index) => ({
      key: `c${index}`,
      label,
      render: (row: { id: string; cells: string[]; flag?: 'high' | 'low' }) => (
        <Box
          component="span"
          sx={{
            fontWeight: row.flag && index === 1 ? 700 : 400,
            color: row.flag && index === 1 ? c.danger : 'inherit',
          }}
        >
          {row.cells[index]}
          {row.flag && index === 1 ? ` (${row.flag === 'high' ? 'H' : 'L'})` : ''}
        </Box>
      ),
    }));
    body = <DataTable columns={columns} rows={section.rows} />;
  } else {
    body = <Box sx={{ whiteSpace: 'pre-wrap' }}>{section.text}</Box>;
  }
  return (
    <Box component="section" sx={{ mt: WA_SPACE.lg }}>
      {section.heading ? (
        <Box component="h3" sx={{ m: 0, mb: WA_SPACE.sm, fontSize: WA_FONT.title }}>
          {section.heading}
        </Box>
      ) : null}
      {body}
    </Box>
  );
}

interface DocumentDialogProps {
  document: DocumentAttachment | null;
  onClose: () => void;
}

/** A preview of an attached document, laid out like the printed page. */
export function DocumentDialog({ document, onClose }: Readonly<DocumentDialogProps>) {
  const t = useT();
  const compact = useCompact();
  return (
    <Dialog
      open={Boolean(document)}
      onClose={onClose}
      fullScreen={compact}
      maxWidth="md"
      fullWidth
      aria-labelledby="wa-doc-title"
    >
      <DialogTitle
        id="wa-doc-title"
        sx={{ display: 'flex', alignItems: 'center', gap: WA_SPACE.sm }}
      >
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {document?.fileName}
        </Box>
        <IconButton aria-label={t('Close')} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {document ? (
          <Box sx={{ fontSize: WA_FONT.preview }}>
            <Box component="h2" sx={{ m: 0, fontSize: WA_FONT.heading }}>
              {document.preview.title}
            </Box>
            {document.preview.subtitle ? (
              <Box sx={{ opacity: 0.75 }}>{document.preview.subtitle}</Box>
            ) : null}
            {document.preview.sections.map((section, index) => (
              <Section key={`${section.kind}-${section.heading ?? index}`} section={section} />
            ))}
            {document.preview.footer ? (
              <Box sx={{ mt: WA_SPACE.xl, fontSize: WA_FONT.small, opacity: 0.75 }}>
                {document.preview.footer}
              </Box>
            ) : null}
          </Box>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
