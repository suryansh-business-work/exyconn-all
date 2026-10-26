import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { logTransferError, useConfigTransfer } from './useConfigTransfer';
import { ImportResultAlert, TransferButtons } from './TransferButtons';

/** Every section at once: one JSON file out, or one file in. */
export function GlobalTransferBar() {
  const t = useT();
  const transfer = useConfigTransfer(null);
  return (
    <Box sx={{ mb: 2 }}>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Text size="sm" color="text.secondary">
          {t('All Environment Variables as one JSON file, or import one.')}
        </Text>
        <TransferButtons
          exportLabel="Export everything"
          importLabel="Import JSON"
          busy={transfer.busy}
          onExport={() => {
            transfer.exportJson(null, 'all').catch(logTransferError);
          }}
          onImport={(file) => {
            transfer.importJson(file).catch(logTransferError);
          }}
        />
      </Flex>
      {transfer.result && (
        <ImportResultAlert result={transfer.result} onClose={transfer.clearResult} />
      )}
    </Box>
  );
}
