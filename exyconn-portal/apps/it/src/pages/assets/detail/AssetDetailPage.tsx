import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Flex,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useAssetAssignmentsQuery, useGetAssetQuery } from '@exyconn/shell/graphql/generated';
import { AssetNotesForm } from '../forms/asset-notes';
import { AssetAssignmentHistory } from './AssetAssignmentHistory';
import { AssetFacts, type AssetFact } from './AssetFacts';
import { AssetLicenceSeats } from './AssetLicenceSeats';

/**
 * One asset: what it is, who has it, what it has cost, and every hand-over it has been
 * through. Reached by clicking a row in the register, which is where somebody already is
 * when they need to answer a question about a specific machine.
 */
export function AssetDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { data, loading, refetch } = useGetAssetQuery({ variables: { id }, skip: id === '' });
  const { data: historyData, loading: historyLoading } = useAssetAssignmentsQuery({
    variables: { assetId: id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });

  const asset = data?.getAsset;

  if (loading && !asset) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!asset) {
    return (
      <Typography variant="body1" sx={{
        color: "text.secondary"
      }}>That asset no longer exists.
              </Typography>
    );
  }

  const dateOrDash = (value?: string | null) => (value ? formatDate(value) : '—');
  const facts: AssetFact[] = [
    { label: 'Manufacturer', value: asset.manufacturer || '—' },
    { label: 'Model', value: asset.modelName || '—' },
    { label: 'Serial number', value: asset.serialNumber || '—' },
    { label: 'Location', value: asset.location || '—' },
    { label: 'Purchased', value: dateOrDash(asset.purchaseDate) },
    { label: 'Warranty ends', value: dateOrDash(asset.warrantyExpiry) },
    { label: 'Purchase cost', value: asset.purchaseCost.toLocaleString() },
    { label: 'Currently held by', value: asset.assignedToName || 'Nobody' },
  ];

  return (
    <Stack spacing={2.5}>
      <Flex direction="row" alignItems="center" spacing={1.5}>
        <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => navigate('/it/assets')}>
          Assets
        </Button>
      </Flex>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Flex direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="h5" sx={{
            fontWeight: 800
          }}>
            {asset.name}
          </Typography>
          <Chip size="small" label={asset.assetTag} />
          <StatusChip value={asset.category} />
          <StatusChip value={asset.status} />
        </Flex>
      </Card>

      <AssetFacts facts={facts} />

      <AssetAssignmentHistory
        rows={historyData?.assetAssignments ?? []}
        loading={historyLoading}
        formatDate={formatDate}
      />

      <AssetLicenceSeats
        employeeId={asset.assignedToId}
        employeeName={asset.assignedToName}
        formatDate={formatDate}
      />

      <Card variant="outlined" sx={{ p: { xs: 2, md: 2.5 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1.5
          }}>
          Notes
        </Typography>
        <AssetNotesForm
          asset={asset}
          onDone={() => {
            refetch().catch(() => undefined);
          }}
        />
      </Card>
    </Stack>
  );
}
