import type { DocumentAttachment } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Button, Paper, Typography } from '@exyconn/shell/components/ui';
import { useWidgetActions } from '../WidgetActions';

/** A file the agent sends — an estimate, a certificate, a rate card — opened in a viewer. */
export function DocumentCard({
  document,
  caption,
}: Readonly<{ document: DocumentAttachment; caption?: string }>) {
  const t = useT();
  const { openDocument, look } = useWidgetActions();
  return (
    <Paper variant="outlined" sx={{ width: '100%', p: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Box sx={{ color: look.text, display: 'flex' }} aria-hidden>
          <DescriptionIcon fontSize="large" />
        </Box>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography
            variant="subtitle2"
            component="p"
            sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
          >
            {document.fileName}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {t('{type} · {pages} pages · {size} KB', {
              type: document.fileType,
              pages: document.pages,
              size: document.sizeKb,
            })}
          </Typography>
        </Box>
      </Box>
      {caption && (
        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
          {caption}
        </Typography>
      )}
      <Button
        fullWidth
        variant="outlined"
        onClick={() => openDocument(document)}
        sx={{ mt: 1, color: look.text, borderColor: look.text, textTransform: 'none' }}
      >
        {t('Open {name}', { name: document.fileType })}
      </Button>
    </Paper>
  );
}
