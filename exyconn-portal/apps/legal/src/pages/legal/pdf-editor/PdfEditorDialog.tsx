import { useState, type KeyboardEvent } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { fileToDataUrl } from '@exyconn/shell/utils/file';
import { useUploadImageMutation } from '@exyconn/shell/graphql/generated';
import { applyAnnotations } from './applyAnnotations';
import { PdfPage } from './PdfPage';
import { PdfToolbar } from './PdfToolbar';
import { StampDialog } from './StampDialog';
import { usePdfAnnotations } from './usePdfAnnotations';
import { usePdfFile } from './usePdfFile';

interface PdfEditorDialogProps {
  /** The PDF to edit; null keeps the dialog closed. */
  url: string | null;
  fileName: string;
  /** Where the saved copy is uploaded on the CDN. */
  folder: string;
  onClose: () => void;
  /** The saved copy's URL. The original file is left as it was. */
  onSaved: (url: string) => void;
}

/** The on-screen page width at 100%, kept inside a phone's screen. */
const pageWidth = (zoom: number) => Math.round(Math.min(820, globalThis.innerWidth - 48) * zoom);

/**
 * Edits a PDF in the browser: add text, draw, box, highlight, white out, place an image or a
 * signature, then save. Saving writes the edits into a new file and uploads it — the original
 * is never overwritten, so anything already signed keeps pointing at what was signed.
 */
export function PdfEditorDialog({
  url,
  fileName,
  folder,
  onClose,
  onSaved,
}: Readonly<PdfEditorDialogProps>) {
  const t = useT();
  const notify = useNotify();
  const file = usePdfFile(url);
  const api = usePdfAnnotations();
  const [zoom, setZoom] = useState(1);
  const [stampFor, setStampFor] = useState<'image' | 'signature' | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadImage] = useUploadImageMutation();

  const save = async () => {
    if (!file.bytes) {
      return;
    }
    setSaving(true);
    try {
      const edited = await applyAnnotations(file.bytes, api.annotations);
      const name = fileName.replace(/\.pdf$/i, '') + '-edited.pdf';
      const dataUrl = await fileToDataUrl(
        new File([new Uint8Array(edited)], name, { type: 'application/pdf' }),
      );
      const { data } = await uploadImage({ variables: { file: dataUrl, fileName: name, folder } });
      if (!data?.uploadImage) {
        throw new Error('Upload returned no URL');
      }
      notify('The edited PDF is saved', 'success');
      onSaved(data.uploadImage);
    } catch (error) {
      portalLogger.error('Legal: saving an edited PDF failed', error);
      notify(errorMessage(error, 'The edited PDF could not be saved'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const typing = api.editingId !== null;
    if (!typing && api.selectedId && (event.key === 'Delete' || event.key === 'Backspace')) {
      api.remove(api.selectedId);
    }
    if (event.key === 'Escape' && api.tool !== 'select') {
      api.setTool('select');
    }
  };

  const { doc } = file;
  const pages = doc ? Array.from({ length: doc.numPages }, (_value, index) => index) : [];

  return (
    <Dialog
      open={url !== null}
      // With a drawing tool in hand, Escape puts it down rather than closing the editor and
      // losing every annotation; from Select it closes as usual.
      onClose={(_event, reason) => {
        if (reason !== 'escapeKeyDown' || api.tool === 'select') {
          onClose();
        }
      }}
      fullScreen
      onKeyDown={onKeyDown}
    >
      <DialogTitle>{t('Edit PDF')}</DialogTitle>
      <Box sx={{ px: 3, pb: 1 }}>
        <PdfToolbar api={api} zoom={zoom} onZoom={setZoom} onPickStamp={setStampFor} />
      </Box>
      <DialogContent dividers sx={{ bgcolor: 'action.hover' }}>
        {file.error && <Alert severity="error">{t(file.error)}</Alert>}
        {!doc && !file.error && (
          <Flex alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress aria-label={t('Opening the PDF')} />
          </Flex>
        )}
        <Flex direction="column" alignItems="center" spacing={3}>
          {doc &&
            pages.map((index) => (
              <PdfPage
                key={index}
                doc={doc}
                index={index}
                width={pageWidth(zoom)}
                api={api}
                label={t('Page {page} of {count}', { page: index + 1, count: pages.length })}
              />
            ))}
        </Flex>
      </DialogContent>
      <DialogActions>
        <Text size="caption" color="text.secondary" sx={{ mr: 'auto', pl: 1 }}>
          {t('Saving creates a new file; the original stays as it was.')}
        </Text>
        <Button onClick={onClose}>{t('Cancel')}</Button>
        <Button
          variant="contained"
          onClick={save}
          loading={saving}
          disabled={!file.bytes || api.annotations.length === 0}
        >
          {t('Save PDF')}
        </Button>
      </DialogActions>
      <StampDialog
        kind={stampFor}
        onClose={() => setStampFor(null)}
        onReady={(stamp) => {
          api.setStamp(stamp);
          api.setTool(stampFor ?? 'image');
          setStampFor(null);
        }}
      />
    </Dialog>
  );
}
