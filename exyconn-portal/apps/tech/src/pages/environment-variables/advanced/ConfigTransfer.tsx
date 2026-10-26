import DownloadIcon from '@mui/icons-material/Download';
import { useT } from '@exyconn/i18n';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { useTechConfigItemsQuery } from '@exyconn/shell/graphql/generated';
import { logTransferError, useConfigTransfer } from './useConfigTransfer';
import { ImportResultAlert, TransferButtons } from './TransferButtons';

/**
 * One section's JSON export and import: the whole section, or one config at a time. Shown only
 * for sections that hold configs.
 */
export function ConfigTransfer({ section }: Readonly<{ section: string }>) {
  const t = useT();
  const { data } = useTechConfigItemsQuery({ variables: { section } });
  const transfer = useConfigTransfer(section);
  const items = data?.techConfigItems ?? [];
  if (!data) {
    return null;
  }
  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Text weight="medium">{t('Export and import (JSON)')}</Text>
        <TransferButtons
          exportLabel="Export section"
          importLabel="Import into section"
          busy={transfer.busy}
          onExport={() => {
            transfer.exportJson(null, section).catch(logTransferError);
          }}
          onImport={(file) => {
            transfer.importJson(file).catch(logTransferError);
          }}
        />
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t('Exports include every key, secret, login and link in full. Keep the file safe.')}
      </Text>
      {transfer.result && (
        <ImportResultAlert result={transfer.result} onClose={transfer.clearResult} />
      )}
      {items.map((item) => (
        <Flex key={item.id} direction="row" alignItems="center" spacing={1}>
          <Text size="sm">{item.label}</Text>
          <Tooltip title={t('Export this config')}>
            <IconButton
              size="small"
              aria-label={t('Export {label}', { label: item.label })}
              disabled={transfer.busy}
              onClick={() => {
                transfer.exportJson([item.id], `${section}-${item.id}`).catch(logTransferError);
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Flex>
      ))}
    </Box>
  );
}
