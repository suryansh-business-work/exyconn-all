import type { MouseEvent } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Box, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { panel } from '@exyconn/shell/components/glass/glass';
import { toRecordCard } from './recordCard';
import type { CrudGridContext, RowActionSpec } from '../grid/types';

interface RecordCardRowProps<Row> {
  row: Row;
  columnDefs: ColDef<Row>[];
  context: object;
  actionSpecs: readonly RowActionSpec[];
  onClick?: (row: Row) => void;
}

/** One record as a card: its heading, a handful of facts, and its row actions. */
export function RecordCardRow<Row>({
  row,
  columnDefs,
  context,
  actionSpecs,
  onClick,
}: Readonly<RecordCardRowProps<Row>>) {
  const card = toRecordCard(columnDefs, row, context);
  const { actions } = context as CrudGridContext<Row>;
  // An action must not also open the record: on a phone the buttons sit inside the tap area.
  const run = (handler: (target: Row) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };

  return (
    <Box
      sx={[panel, { cursor: onClick ? 'pointer' : 'default' }]}
      onClick={onClick ? () => onClick(row) : undefined}
    >
      <Flex direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Text weight="bold" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
          {card.title}
        </Text>
        <Flex direction="row" spacing={0.5}>
          {actionSpecs.map((spec) => {
            const handler = actions?.[spec.key];
            const Icon = spec.icon;
            if (!handler || spec.hidden?.(row as never)) {
              return null;
            }
            return (
              <IconButton
                key={spec.key}
                aria-label={spec.label}
                color={spec.color}
                onClick={run(handler)}
              >
                <Icon fontSize="small" />
              </IconButton>
            );
          })}
        </Flex>
      </Flex>

      {card.fields.map((field) => (
        <Flex
          key={field.key}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          sx={{ mt: 0.5 }}
        >
          <Text size="caption" color="text.secondary">
            {field.label}
          </Text>
          {field.chip ? (
            <StatusChip value={field.value} />
          ) : (
            <Text size="sm" sx={{ minWidth: 0, textAlign: 'right', wordBreak: 'break-word' }}>
              {field.value}
            </Text>
          )}
        </Flex>
      ))}
    </Box>
  );
}
