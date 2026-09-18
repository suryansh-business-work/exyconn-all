import { useNavigate, useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Card,
  Chip,
  Flex,
  Stack,
  Typography,
  fontWeight,
} from '@exyconn/shell/components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useAssetAssignmentsQuery, useGetAssetQuery } from '@exyconn/shell/graphql/generated';
import { AssetNotesForm } from '../forms/asset-notes';
import { AssetAssignmentHistory } from './AssetAssignmentHistory';
import { AssetFacts, type AssetFact } from './AssetFacts';
import { AssetLicenceSeats } from './AssetLicenceSeats';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';

/**
 * One asset: what it is, who has it, what it has cost, and every hand-over it has been
 * through. Reached by clicking a row in the register, which is where somebody already is
 * when they need to answer a question about a specific machine.
 */
export function AssetDetailPage() {
  const { id = '' } = useParams();
  const t = useT();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { data, loading, refetch } = useGetAssetQuery({ variables: { id }, skip: id === '' });
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useAssetAssignmentsQuery({
    variables: { assetId: id },
    skip: id === '',
    fetchPolicy: 'cache-and-network',
  });

  const asset = data?.getAsset;

  if (loading && !asset) {
    return <LoadingState />;
  }

  if (!asset) {
    return (
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
        }}
      >
        {t('That asset no longer exists.')}
      </Typography>
    );
  }

  const dateOrDash = (value?: string | null) => (value ? formatDate(value) : '—');
  const facts: AssetFact[] = [
    { label: t('Manufacturer'), value: asset.manufacturer || '—' },
    { label: t('Model'), value: asset.modelName || '—' },
    { label: t('Serial number'), value: asset.serialNumber || '—' },
    { label: t('Location'), value: asset.location || '—' },
    { label: t('Purchased'), value: dateOrDash(asset.purchaseDate) },
    { label: t('Warranty ends'), value: dateOrDash(asset.warrantyExpiry) },
    { label: t('Purchase cost'), value: asset.purchaseCost.toLocaleString() },
    { label: t('Currently held by'), value: asset.assignedToName || t('Nobody') },
  ];

  return (
    <Stack spacing={2}>
      <Flex direction="row" alignItems="center" spacing={1.5}>
        <Button startIcon={<ArrowBackIcon />} size="small" onClick={() => navigate('/it/assets')}>
          {t('Assets')}
        </Button>
      </Flex>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Flex direction="row" alignItems="center" spacing={1.5}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: fontWeight.bold,
            }}
          >
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
        onRefresh={refetchHistory}
        formatDate={formatDate}
      />

      <AssetLicenceSeats
        employeeId={asset.assignedToId}
        employeeName={asset.assignedToName}
        formatDate={formatDate}
      />

      <Card variant="outlined" sx={{ p: { xs: 2, md: 2 } }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 1.5,
          }}
        >
          {t('Notes')}
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
