import type { MouseEvent } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import { Box, ButtonBase, Flex, IconButton, Text } from '@exyconn/shell/components/ui';
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

/**
 * One record as a card: its heading, a handful of facts, and its row actions.
 *
 * The heading is the card's button (WCAG 2.2 SC 2.1.1, 4.1.2), stretched over the whole card
 * so a tap anywhere still opens the record. Making the card itself the button would nest the
 * row actions inside it, which is invalid and reads to a screen reader as one long button.
 */
export function RecordCardRow<Row>({
  row,
  columnDefs,
  context,
  actionSpecs,
  onClick,
}: Readonly<RecordCardRowProps<Row>>) {
  const t = useT();
  const card = toRecordCard(columnDefs, row, context);
  const { actions } = context as CrudGridContext<Row>;
  // An action must not also open the record: on a phone the buttons sit inside the tap area.
  const run = (handler: (target: Row) => void) => (event: MouseEvent) => {
    event.stopPropagation();
    handler(row);
  };

  return (
    <Box sx={[panel, { position: 'relative' }]}>
      <Flex direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <CardTitle title={card.title} onOpen={onClick ? () => onClick(row) : undefined} />
        {/* Above the stretched title, so an action is its own target. */}
        <Flex direction="row" spacing={0.5} sx={{ position: 'relative', zIndex: 1 }}>
          {actionSpecs.map((spec) => {
            const handler = actions?.[spec.key];
            const Icon = spec.icon;
            if (!handler || spec.hidden?.(row as never)) {
              return null;
            }
            return (
              <IconButton
                key={spec.key}
                aria-label={t(spec.label)}
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
            {t(field.label)}
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

interface CardTitleProps {
  title: string;
  /** Absent when the list has no record to open: the title is then plain text. */
  onOpen?: () => void;
}

/** The card's heading — and, when the record can be opened, the button that opens it. */
function CardTitle({ title, onOpen }: Readonly<CardTitleProps>) {
  if (!onOpen) {
    return (
      <Text weight="bold" sx={{ minWidth: 0, wordBreak: 'break-word' }}>
        {title}
      </Text>
    );
  }
  return (
    <ButtonBase
      onClick={onOpen}
      // The ripple needs the button to be its own positioning box, which would shrink the
      // stretched target below back to the title alone.
      disableRipple
      sx={{
        // Static, so the ::after below is placed against the card, not against this button.
        position: 'static',
        minWidth: 0,
        justifyContent: 'flex-start',
        textAlign: 'left',
        font: 'inherit',
        fontWeight: 'bold',
        wordBreak: 'break-word',
        // Stretched over the whole card: the rest of it is a tap target too, but only this is
        // in the tab order and announced.
        '&::after': { content: '""', position: 'absolute', inset: 0 },
      }}
    >
      {title}
    </ButtonBase>
  );
}
