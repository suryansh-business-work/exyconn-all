import { useT } from '@exyconn/i18n';
import { Alert, Box, Flex, Heading, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useExitRecordHeldAssetsQuery } from '@exyconn/shell/graphql/generated';

interface HeldAssetsPanelProps {
  exitId: string;
  /** What the record currently claims, so a contradiction with the register is visible. */
  assetsReturned: boolean;
}

/**
 * What the leaver still holds according to the asset register, shown above the
 * exit form. It never flips `assetsReturned` itself: IT's check-in is the source of
 * truth, and HR ticks the box once the register agrees.
 */
export function HeldAssetsPanel({ exitId, assetsReturned }: Readonly<HeldAssetsPanelProps>) {
  const t = useT();
  const { data, loading } = useExitRecordHeldAssetsQuery({
    variables: { id: exitId },
    fetchPolicy: 'cache-and-network',
  });
  const assets = data?.getExitRecord.heldAssets ?? [];

  if (loading && !data) {
    return <Text color="text.secondary">{t('Checking the asset register…')}</Text>;
  }

  let verdict = (
    <Alert severity="info">
      {t('{count} asset(s) still assigned — collect them before clearance.', {
        count: assets.length,
      })}
    </Alert>
  );
  if (assets.length === 0) {
    verdict = <Alert severity="success">{t('Nothing outstanding in the asset register.')}</Alert>;
  } else if (assetsReturned) {
    verdict = (
      <Alert severity="warning">
        {t('Marked as returned, but {count} asset(s) are still assigned in the register.', {
          count: assets.length,
        })}
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Heading level={6} sx={{ mb: 1 }}>
        {t('Assets held')}
      </Heading>
      {verdict}
      {assets.map((asset) => (
        <Flex
          key={asset.id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 1 }}
        >
          <Text>
            <Text weight="medium">{asset.assetTag}</Text> · {asset.name}
          </Text>
          <StatusChip value={asset.status} />
        </Flex>
      ))}
    </Box>
  );
}
