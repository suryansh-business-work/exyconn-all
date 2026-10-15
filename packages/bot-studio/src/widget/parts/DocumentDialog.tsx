import type { DocSection, DocumentAttachment } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@exyconn/shell/components/ui';

function Section({ section }: Readonly<{ section: DocSection }>) {
  if (section.kind === 'text') {
    return (
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {section.text}
      </Typography>
    );
  }
  if (section.kind === 'fields') {
    return (
      <Box
        component="dl"
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, m: 0 }}
      >
        {section.fields.map((field) => (
          <Box key={field.label}>
            <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
              {field.label}
            </Typography>
            <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>
              {field.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return (
    <TableContainer tabIndex={0}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {section.columns.map((column) => (
              <TableCell key={column}>{column}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {section.rows.map((row) => (
            <TableRow key={row.id}>
              {section.columns.map((column, index) => (
                <TableCell key={column}>{row.cells[index] ?? ''}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface DocumentDialogProps {
  document: DocumentAttachment | null;
  onClose: () => void;
}

/** The document's preview — what the visitor would download from a live agent. */
export function DocumentDialog({ document, onClose }: Readonly<DocumentDialogProps>) {
  const t = useT();
  const preview = document?.preview;
  return (
    <Dialog open={Boolean(document)} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      {preview && (
        <>
          <DialogTitle>
            {preview.title}
            {preview.subtitle && (
              <Typography
                variant="body2"
                component="span"
                sx={{ display: 'block', color: 'text.secondary' }}
              >
                {preview.subtitle}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
            {preview.sections.map((section) => (
              <Box key={`${section.kind}-${section.heading ?? ''}`}>
                {section.heading && (
                  <Typography variant="subtitle2" component="h3" sx={{ mb: 0.5 }}>
                    {section.heading}
                  </Typography>
                )}
                <Section section={section} />
              </Box>
            ))}
            {preview.footer && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {preview.footer}
              </Typography>
            )}
          </DialogContent>
        </>
      )}
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
