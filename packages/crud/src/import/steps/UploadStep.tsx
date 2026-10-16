import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT, type Interpolations } from '@exyconn/i18n';
import { Alert, Box, ButtonBase, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { TableFileFormat } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import type { ImportFile } from '../import.types';
import { ACCEPTED_FILES, ImportFileError, useImportFileReader } from '../importFile';

interface UploadStepProps {
  file: ImportFile | null;
  onFile: (file: ImportFile) => void;
  templateFormats: readonly TableFileFormat[];
  onDownloadTemplate: (format: TableFileFormat) => void;
}

interface ShownError {
  message: string;
  values?: Interpolations;
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

/**
 * Looks like an outlined button but is plain text: the whole drop zone is the one button, and a
 * button inside a button is announced twice and breaks keyboard focus (SC 4.1.2).
 */
const CHOOSE_FILE_SX = {
  typography: 'button',
  px: 1.5,
  py: 0.5,
  border: 1,
  borderColor: 'primary.main',
  borderRadius: 1,
  color: 'primary.main',
} as const;

/** How each sample format is offered. */
const TEMPLATE_LABELS: Readonly<Record<TableFileFormat, string>> = {
  CSV: 'Download sample CSV',
  XLSX: 'Download sample Excel',
};

function shownError(failure: unknown): ShownError {
  if (failure instanceof ImportFileError) {
    return { message: failure.message, values: failure.values };
  }
  return { message: errorMessage(failure, 'The file could not be read.') };
}

/** Step 1: choose or drop a CSV or Excel file; it is read and checked, nothing is imported yet. */
export function UploadStep({
  file,
  onFile,
  templateFormats,
  onDownloadTemplate,
}: Readonly<UploadStepProps>) {
  const t = useT();
  const readFile = useImportFileReader();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<ShownError | null>(null);

  const accept = (chosen: File | undefined) => {
    if (!chosen) {
      return;
    }
    setReading(true);
    setError(null);
    readFile(chosen)
      .then(onFile)
      .catch((failure: unknown) => {
        portalLogger.error('Reading an import file failed', failure);
        setError(shownError(failure));
      })
      .finally(() => setReading(false));
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    accept(chosen);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    accept(event.dataTransfer.files[0]);
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
        aria-describedby="import-upload-hint"
      >
        <UploadFileIcon color="primary" fontSize="large" />
        <Text weight="semibold">{t('Drop a CSV or Excel file here')}</Text>
        <Text id="import-upload-hint" size="sm" color="text.secondary">
          {t('Up to 10 MB and 50,000 rows. The first line must name the columns.')}
        </Text>
        <Box component="span" sx={CHOOSE_FILE_SX}>
          {reading ? t('Reading…') : t('Choose file')}
        </Box>
      </ButtonBase>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={ACCEPTED_FILES}
        aria-label={t('Choose a CSV or Excel file')}
        onChange={onChange}
      />
      {error && <Alert severity="error">{t(error.message, error.values)}</Alert>}
      {file && (
        <Alert severity="success">
          {t('{file}: {count} rows ready to map.', { file: file.name, count: file.rows.length })}
        </Alert>
      )}
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <Text size="sm" color="text.secondary">
          {t('Not sure how to lay out the file?')}
        </Text>
        {templateFormats.map((format) => (
          <Link
            key={format}
            component="button"
            type="button"
            onClick={() => onDownloadTemplate(format)}
          >
            {t(TEMPLATE_LABELS[format])}
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}
