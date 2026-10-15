import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import { Alert, Button, ButtonBase, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { readCsvFile, type CsvFile, type CsvFileError } from '../csvFile';

interface UploadStepProps {
  file: CsvFile | null;
  onFile: (file: CsvFile) => void;
  onDownloadTemplate: () => void;
}

const DROP_ZONE_SX = {
  width: '100%',
  flexDirection: 'column',
  gap: 1,
  p: 4,
  border: 2,
  borderStyle: 'dashed',
  borderColor: 'divider',
  borderRadius: 1,
  '&:hover, &.Mui-focusVisible, &[data-dragging="true"]': {
    borderColor: 'primary.main',
    bgcolor: 'action.hover',
  },
} as const;

/** Step 1: choose or drop a CSV; it is read and checked here, nothing is sent yet. */
export function UploadStep({ file, onFile, onDownloadTemplate }: Readonly<UploadStepProps>) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<CsvFileError | null>(null);

  const accept = async (chosen: File | undefined) => {
    if (!chosen) {
      return;
    }
    setReading(true);
    setError(null);
    const result = await readCsvFile(chosen);
    setReading(false);
    if (result.ok) {
      onFile(result.file);
    } else {
      setError(result.error);
    }
  };

  const failed = (failure: unknown) => {
    setReading(false);
    portalLogger.error('Reading a CRM import file failed', failure);
    setError({ message: errorMessage(failure, 'The file could not be read.') });
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    accept(chosen).catch(failed);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]).catch(failed);
  };

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  return (
    <Stack spacing={2}>
      <ButtonBase
        sx={DROP_ZONE_SX}
        data-dragging={dragging}
        disabled={reading}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-describedby="crm-import-upload-hint"
      >
        <UploadFileIcon color="primary" fontSize="large" />
        <Text weight="semibold">{t('Drop a CSV file here')}</Text>
        <Text id="crm-import-upload-hint" size="sm" color="text.secondary">
          {t('Up to 10 MB and 50,000 rows. The first line must name the columns.')}
        </Text>
        <Button component="span" variant="outlined" size="small" tabIndex={-1}>
          {reading ? t('Reading…') : t('Choose file')}
        </Button>
      </ButtonBase>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept=".csv,text/csv"
        aria-label={t('Choose a CSV file')}
        onChange={onChange}
      />
      {error && <Alert severity="error">{t(error.message, error.values)}</Alert>}
      {file && (
        <Alert severity="success">
          {t('{file}: {count} rows ready to map.', { file: file.name, count: file.rows.length })}
        </Alert>
      )}
      <Text size="sm" color="text.secondary">
        {t('Not sure how to lay out the file?')}{' '}
        <Link component="button" type="button" onClick={onDownloadTemplate}>
          {t('Download template')}
        </Link>
      </Text>
    </Stack>
  );
}
