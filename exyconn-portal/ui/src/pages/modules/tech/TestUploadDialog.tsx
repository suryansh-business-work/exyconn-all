import { useRef, useState } from 'react';
import { Box, Button, CircularProgress, Link, Flex, Text } from '@/components/ui';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { CrudDialog } from '../../../components/data/CrudDialog';
import { useNotify } from '../../../components/feedback/NotificationProvider';
import { useTestImageUploadMutation } from '../../../graphql/generated';
import { fileToDataUrl, MAX_AVATAR_BYTES } from '../../../utils/file';

interface TestUploadDialogProps {
  configId: string;
  configLabel: string;
  open: boolean;
  onClose: () => void;
}

/** Uploads a chosen file through a specific image config to validate it. */
export function TestUploadDialog({ configId, configLabel, open, onClose }: TestUploadDialogProps) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [testUpload] = useTestImageUploadMutation();

  const handleClose = () => {
    setResultUrl(null);
    onClose();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      notify('File must be 2 MB or smaller', 'error');
      return;
    }
    setUploading(true);
    setResultUrl(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data } = await testUpload({
        variables: { id: configId, file: dataUrl, fileName: file.name },
      });
      const url = data?.testImageUpload ?? null;
      setResultUrl(url);
      notify('Test upload succeeded');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <CrudDialog open={open} title="Test file upload" onClose={handleClose}>
      <Flex direction="column" spacing={2.5}>
        <Text size="sm" color="text.secondary">
          Upload a file using the &ldquo;{configLabel}&rdquo; provider configuration.
        </Text>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
          data-testid="test-upload-input"
        />
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Choose file & upload'}
        </Button>
        {resultUrl && (
          <Box>
            <Box
              component="img"
              src={resultUrl}
              alt="Uploaded preview"
              sx={{ width: '100%', borderRadius: 1, mb: 1 }}
            />
            <Link href={resultUrl} target="_blank" rel="noopener" variant="body2">
              {resultUrl}
            </Link>
          </Box>
        )}
        <Flex direction="row" justifyContent="flex-end">
          <Button color="inherit" onClick={handleClose}>
            Close
          </Button>
        </Flex>
      </Flex>
    </CrudDialog>
  );
}
