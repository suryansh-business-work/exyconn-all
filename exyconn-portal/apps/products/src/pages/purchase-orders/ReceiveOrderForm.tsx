import { useState } from 'react';
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
      notify(`Stock booked in against ${order.number}.`);
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not book the stock in', 'error');
    }
  };

  return (
    <Box>
      <Text size="sm" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        What arrived against {order.number}? The unit cost on each line is what the stock will be
        valued at.
      </Text>

      {order.lines.map((line) => (
        <Grid container spacing={1} alignItems="center" key={line.productId} sx={{ mb: 1.5 }}>
          <Grid item xs={12} sm={5}>
            <Text size="sm">{line.productName}</Text>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Text size="caption" color="text.secondary">
              {line.receivedQuantity} of {line.quantity} received
            </Text>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              label="Arriving now"
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
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() => {
            submit().catch((error: unknown) => console.error('Receive failed', error));
          }}
        >
          Book in
        </Button>
      </Flex>
    </Box>
  );
}
