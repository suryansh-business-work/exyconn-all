import { useRef, type ChangeEvent } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Flex, Text } from '@exyconn/shell/components/ui';
import type { TechImportResult } from '@exyconn/shell/graphql/generated';

interface TransferButtonsProps {
  exportLabel: string;
  importLabel: string;
  busy: boolean;
  onExport: () => void;
  onImport: (file: File) => void;
}

/** Export JSON and Import JSON, the second through a hidden file picker. */
export function TransferButtons(props: Readonly<TransferButtonsProps>) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      props.onImport(file);
    }
  };
  return (
    <Flex direction="row" spacing={1} wrap>
      <Button
        size="small"
        startIcon={<DownloadIcon />}
        disabled={props.busy}
        onClick={props.onExport}
      >
        {t(props.exportLabel)}
      </Button>
      <Button
        size="small"
        startIcon={<UploadIcon />}
        disabled={props.busy}
        onClick={() => inputRef.current?.click()}
      >
        {t(props.importLabel)}
      </Button>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept="application/json,.json"
        aria-label={t('Choose an Environment Variables JSON file')}
        onChange={onChange}
      />
    </Flex>
  );
}

/** What an import did: counts, and why anything was skipped. */
export function ImportResultAlert({
  result,
  onClose,
}: Readonly<{ result: TechImportResult; onClose: () => void }>) {
  const t = useT();
  return (
    <Alert severity={result.skipped ? 'warning' : 'success'} onClose={onClose}>
      <Text size="sm">
        {t(
          '{created} added, {updated} updated, {skipped} skipped. Imported configs arrive switched off — turn one on after checking it.',
          {
            created: result.created,
            updated: result.updated,
            skipped: result.skipped,
          },
        )}
      </Text>
      {result.messages.map((message) => (
        <Text key={message} size="sm">
          {message}
        </Text>
      ))}
    </Alert>
  );
}
