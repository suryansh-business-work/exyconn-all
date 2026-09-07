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
  const { data, loading } = useExitRecordHeldAssetsQuery({
    variables: { id: exitId },
    fetchPolicy: 'cache-and-network',
  });
  const assets = data?.getExitRecord.heldAssets ?? [];

  if (loading && !data) {
    return <Text color="text.secondary">Checking the asset register…</Text>;
  }

  let verdict = (
    <Alert severity="info">
      {assets.length} asset(s) still assigned — collect them before clearance.
    </Alert>
  );
  if (assets.length === 0) {
    verdict = <Alert severity="success">Nothing outstanding in the asset register.</Alert>;
  } else if (assetsReturned) {
    verdict = (
      <Alert severity="warning">
        Marked as returned, but {assets.length} asset(s) are still assigned in the register.
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Heading level={6} sx={{ mb: 1 }}>
        Assets held
      </Heading>
      {verdict}
      {assets.map((asset) => (
        <Flex
          key={asset.id}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ py: 0.75 }}
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
