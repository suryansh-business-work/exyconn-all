import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Grid, Text, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useReceivePurchaseOrderMutation } from '@exyconn/shell/graphql/generated';
import type { PurchaseOrderRow } from './forms/purchase-order';

interface ReceiveOrderFormProps {
  order: PurchaseOrderRow;
  onDone: () => void;
  onCancel: () => void;
}

/** What is still owed on a line. */
function outstandingOf(line: PurchaseOrderRow['lines'][number]): number {
  return Math.max(line.quantity - line.receivedQuantity, 0);
}

/**
 * Books goods in against an order.
 *
 * Each line is pre-filled with what is still outstanding, because "it all turned up" is the
 * common case and re-typing it invites a typo into a stock level. Receiving is additive, so a
 * part delivery today and the rest next week add up rather than replacing each other.
 */
export function ReceiveOrderForm({ order, onDone, onCancel }: Readonly<ReceiveOrderFormProps>) {
  const t = useT();
  const notify = useNotify();
  const [receive, { loading }] = useReceivePurchaseOrderMutation();
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(order.lines.map((line) => [line.productId, outstandingOf(line)])),
  );

  const submit = async (): Promise<void> => {
    const lines = order.lines
      .map((line) => ({ productId: line.productId, quantity: quantities[line.productId] ?? 0 }))
      .filter((line) => line.quantity > 0);

    if (lines.length === 0) {
      notify('Enter what arrived before booking it in.', 'error');
      return;
    }

    try {
      await receive({ variables: { id: order.id, lines } });
      notify(t('Stock booked in against {number}.', { number: order.number }));
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not book the stock in', 'error');
    }
  };

  return (
    <Box>
      <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t(
          'What arrived against {number}? The unit cost on each line is what the stock will be valued at.',
          { number: order.number },
        )}
      </Text>

      {order.lines.map((line) => (
        <Grid
          container
          spacing={1}
          key={line.productId}
          sx={{
            alignItems: 'center',
            mb: 1.5,
          }}
        >
          <Grid
            size={{
              xs: 12,
              sm: 5,
            }}
          >
            <Text size="sm">{line.productName}</Text>
          </Grid>
          <Grid
            size={{
              xs: 6,
              sm: 3,
            }}
          >
            <Text size="caption" color="text.secondary">
              {t('{received} of {ordered} received', {
                received: line.receivedQuantity,
                ordered: line.quantity,
              })}
            </Text>
          </Grid>
          <Grid
            size={{
              xs: 6,
              sm: 4,
            }}
          >
            <TextField
              label={t('Arriving now')}
              type="number"
              fullWidth
              value={quantities[line.productId] ?? 0}
              onChange={(event) =>
                setQuantities((current) => ({
                  ...current,
                  [line.productId]: Math.max(Number(event.target.value) || 0, 0),
                }))
              }
            />
          </Grid>
        </Grid>
      ))}

      <Flex direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() => {
            submit().catch((error: unknown) => console.error('Receive failed', error));
          }}
        >
          {t('Book in')}
        </Button>
      </Flex>
    </Box>
  );
}
