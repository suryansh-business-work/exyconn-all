import { useState } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useT } from '@exyconn/i18n';
import { PAYOUT_METHOD_LABELS, fieldsFor, isSecretField, type FieldSpec } from '@exyconn/payout';
import { Box, Button, Flex, Text } from '@/components/ui';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { SECRET_ENUM } from './forms/payout-account/payout-account.schema';
import type { PayoutAccountApi, PayoutAccountRow } from './forms/payout-account';

interface DetailRowProps {
  spec: FieldSpec;
  row: PayoutAccountRow;
  reveal: PayoutAccountApi['reveal'];
}

/** A plain detail as stored; a sealed one masked until Show fetches it (and the server logs it). */
function DetailRow({ spec, row, reveal }: Readonly<DetailRowProps>) {
  const t = useT();
  const notify = useNotify();
  const [shown, setShown] = useState<string | null>(null);
  const { field } = spec;
  const secret = isSecretField(field);
  const stored = secret ? row.hints[field] : String(row[field] ?? '');

  const show = async () => {
    if (!secret) {
      return;
    }
    try {
      setShown(await reveal(row, SECRET_ENUM[field]));
    } catch (err) {
      notify(errorMessage(err, 'Could not show it'), 'error');
    }
  };

  return (
    <Flex direction="row" justifyContent="space-between" alignItems="center" spacing={1} wrap>
      <Box>
        <Text size="sm" color="text.secondary">
          {t(spec.label)}
        </Text>
        <Text sx={{ wordBreak: 'break-all' }}>{shown ?? (stored || '—')}</Text>
      </Box>
      {secret && stored && shown === null && (
        <Button
          size="small"
          startIcon={<VisibilityIcon fontSize="small" />}
          onClick={() => {
            show().catch(() => setShown(null));
          }}
          aria-label={t('Show {label}', { label: t(spec.label) })}
        >
          {t('Show')}
        </Button>
      )}
    </Flex>
  );
}

/** Every detail of one account, read-only — what Finance needs to send a refund. */
export function PayoutAccountDetails({
  row,
  reveal,
}: Readonly<{ row: PayoutAccountRow; reveal: PayoutAccountApi['reveal'] }>) {
  const t = useT();
  return (
    <Flex direction="column" spacing={2}>
      <Text weight="medium">
        {t(PAYOUT_METHOD_LABELS[row.method].label)} · {row.country} · {row.currency}
      </Text>
      {fieldsFor(row.method, row.country).map((spec) => (
        <DetailRow key={spec.field} spec={spec} row={row} reveal={reveal} />
      ))}
    </Flex>
  );
}
