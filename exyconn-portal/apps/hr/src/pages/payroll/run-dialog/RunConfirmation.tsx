import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Collapse,
  DialogContentText,
  Flex,
  List,
  ListItem,
  ListItemText,
} from '@exyconn/shell/components/ui';
import { formatMoney } from '@exyconn/shell/utils/money';
import { totalsOf, type Candidate } from './runPlan';

/** Names shown before the rest fold away behind "Show all". */
const VISIBLE_NAMES = 8;

function NameList({ people }: Readonly<{ people: readonly Candidate[] }>) {
  return (
    <List dense disablePadding>
      {people.map((c) => (
        <ListItem key={c.employeeId} disableGutters>
          <ListItemText primary={c.name} secondary={formatMoney(c.net ?? 0, c.currency)} />
        </ListItem>
      ))}
    </List>
  );
}

interface RunConfirmationProps {
  picked: readonly Candidate[];
  period: string;
}

/** The last look before the run: how many, how much, who, and that it cannot be undone. */
export function RunConfirmation({ picked, period }: Readonly<RunConfirmationProps>) {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const totals = totalsOf(picked);
  const first = picked.slice(0, VISIBLE_NAMES);
  const rest = picked.slice(VISIBLE_NAMES);

  return (
    <Flex direction="column" spacing={1.5}>
      <DialogContentText>
        {t(
          'Run payroll for {count} employees for {period}? Total net {amount}. Each employee gets a salary slip and a notification; this month cannot be run again for them.',
          { count: totals.count, period, amount: formatMoney(totals.net) },
        )}
      </DialogContentText>
      <NameList people={first} />
      {rest.length > 0 && (
        <>
          <Collapse in={showAll}>
            <NameList people={rest} />
          </Collapse>
          <Button
            size="small"
            onClick={() => setShowAll((open) => !open)}
            aria-expanded={showAll}
            sx={{ alignSelf: 'flex-start' }}
          >
            {showAll ? t('Show fewer') : t('Show all {count}', { count: totals.count })}
          </Button>
        </>
      )}
    </Flex>
  );
}
