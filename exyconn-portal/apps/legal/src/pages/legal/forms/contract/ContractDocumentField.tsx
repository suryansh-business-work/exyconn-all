import { useState, type ChangeEvent } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Alert, Box, Button, Flex, FormHelperText, Link, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@exyconn/shell/utils/file';
import { useUploadImageMutation } from '@exyconn/shell/graphql/generated';
import { PdfEditorDialog } from '../../pdf-editor';

/** Where contract PDFs land on the CDN. */
const CONTRACT_FOLDER = 'legal-contracts';
const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

const fileNameOf = (url: string) =>
  decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? 'contract.pdf');

interface ContractDocumentFieldProps {
  /** A signed contract warns that editing makes a new version the signatures do not cover. */
  signed: boolean;
}

/**
 * The PDF a counterparty reads and signs: upload one, open it, or edit it in place. Editing
 * saves a new file and points the contract at it; the old one is kept, untouched.
 */
export function ContractDocumentField({ signed }: Readonly<ContractDocumentFieldProps>) {
  const t = useT();
  const notify = useNotify();
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name: 'documentUrl', control });
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadImage] = useUploadImageMutation();
  const url = String(field.value ?? '');

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (file.type !== 'application/pdf' || file.size > MAX_IMAGE_BYTES) {
      notify('Choose a PDF of {mb} MB or less', 'error', { mb: MAX_MB });
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadImage({
        variables: {
          file: await fileToDataUrl(file),
          fileName: file.name,
          folder: CONTRACT_FOLDER,
        },
      });
      if (!data?.uploadImage) {
        throw new Error('Upload returned no URL');
      }
      field.onChange(data.uploadImage);
    } catch (error) {
      notify(errorMessage(error, 'The PDF could not be uploaded'), 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Text size="sm" weight="medium" sx={{ mb: 1 }}>
        {t('Contract PDF')}
      </Text>
      <Flex direction="row" alignItems="center" gap={1} flexWrap="wrap" useFlexGap>
        {url && (
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <PictureAsPdfIcon fontSize="small" />
            {fileNameOf(url)}
          </Link>
        )}
        <Button
          variant="outlined"
          size="small"
          component="label"
          startIcon={<UploadFileIcon />}
          loading={uploading}
        >
          {url ? t('Replace PDF') : t('Upload PDF')}
          <input
            hidden
            type="file"
            accept="application/pdf"
            onChange={upload}
            aria-label={t('Upload the contract PDF')}
          />
        </Button>
        {url && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => setEditing(true)}
          >
            {t('Edit PDF')}
          </Button>
        )}
        {url && (
          <Button variant="text" size="small" color="error" onClick={() => field.onChange('')}>
            {t('Remove')}
          </Button>
        )}
      </Flex>
      <FormHelperText error={Boolean(fieldState.error)}>
        {t(
          fieldState.error?.message ??
            'Optional while drafting. The PDF a counterparty reads before signing, up to {mb} MB; its bytes are hashed when they sign.',
          { mb: MAX_MB },
        )}
      </FormHelperText>
      {signed && url && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {t(
            'This contract is signed. Editing makes a new file that the existing signatures do not cover.',
          )}
        </Alert>
      )}
      <PdfEditorDialog
        url={editing ? url : null}
        fileName={fileNameOf(url)}
        folder={CONTRACT_FOLDER}
        onClose={() => setEditing(false)}
        onSaved={(saved) => {
          field.onChange(saved);
          setEditing(false);
        }}
      />
    </Box>
  );
}
