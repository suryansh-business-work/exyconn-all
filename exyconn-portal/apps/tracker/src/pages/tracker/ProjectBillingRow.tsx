import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import type { ProjectBillingRow as Row } from './tracker.billing';

interface ProjectBillingRowProps {
  row: Row;
  money: Intl.NumberFormat;
  onInvoice: (row: Row) => void;
  invoicing: boolean;
}

/** `12 h of 100 h` with an over-budget chip; `—` when no budget was set. */
function BudgetCell({
  used,
  budget,
  format,
}: Readonly<{ used: number; budget: number | null | undefined; format: (n: number) => string }>) {
  if (budget === null || budget === undefined) {
    return <Text color="text.secondary">—</Text>;
  }
  const over = used > budget;
  return (
    <Box>
      <Text>
        {format(used)} of {format(budget)}
      </Text>
      {over ? <Chip size="small" color="error" label="Over budget" sx={{ ml: 1 }} /> : null}
    </Box>
  );
}

/** One project, expanding to the employees whose time it bills. */
export function ProjectBillingRow({
  row,
  money,
  onInvoice,
  invoicing,
}: Readonly<ProjectBillingRowProps>) {
  const [open, setOpen] = useState(false);
  const unrated = row.employees.some((employee) => employee.rate <= 0);
  const canInvoice = Boolean(row.clientId) && !unrated && row.projectId !== '';
  const hoursLabel = (n: number) => `${n} h`;

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <IconButton
            size="small"
            aria-label={open ? 'collapse employees' : 'expand employees'}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Text weight="medium">{row.projectName}</Text>
        </TableCell>
        <TableCell>{row.clientName || <Text color="text.secondary">No client</Text>}</TableCell>
        <TableCell>
          <BudgetCell used={row.hours} budget={row.budgetHours} format={hoursLabel} />
        </TableCell>
        <TableCell>
          <BudgetCell used={row.amount} budget={row.budgetAmount} format={money.format} />
        </TableCell>
        <TableCell align="right">
          <Button
            size="small"
            startIcon={<ReceiptLongIcon />}
            disabled={!canInvoice || invoicing}
            onClick={() => onInvoice(row)}
          >
            Create invoice
          </Button>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Table size="small" sx={{ ml: 6, width: 'auto', minWidth: 480, my: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Rate / hour</TableCell>
                  <TableCell>Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {row.employees.map((employee) => (
                  <TableRow key={employee.employeeId}>
                    <TableCell>{employee.employeeName}</TableCell>
                    <TableCell>{employee.hours} h</TableCell>
                    <TableCell>
                      {employee.rate > 0 ? (
                        money.format(employee.rate)
                      ) : (
                        <Text size="sm" color="text.secondary">
                          Not set
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>{money.format(employee.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
