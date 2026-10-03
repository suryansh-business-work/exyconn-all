import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  Checkbox,
  Flex,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { formatMoney } from '@exyconn/shell/utils/money';
import { PayrollCandidateStatus } from '@exyconn/shell/graphql/generated';
import { isReady, type Candidate } from './runPlan';

/** An amount the plan worked out, or a dash where it worked none out (not READY). */
function amount(value: number | null | undefined, currency: string | null | undefined) {
  return value == null ? '—' : formatMoney(value, currency);
}

/** Where a candidate stands: ready, already run (with the slip's status), or no structure. */
function CandidateStanding({ candidate }: Readonly<{ candidate: Candidate }>) {
  const t = useT();
  if (candidate.status === PayrollCandidateStatus.NoStructure) {
    return (
      <Flex direction="column">
        <Text size="sm">{t('No salary structure')}</Text>
        <Link component={RouterLink} to="/hr/salaries" underline="hover" variant="body2">
          {t('Set one up in Salaries')}
        </Link>
      </Flex>
    );
  }
  if (candidate.status === PayrollCandidateStatus.AlreadyRun) {
    return (
      <Flex direction="row" spacing={1} alignItems="center">
        <Text size="sm">{t('Already run')}</Text>
        {candidate.slipStatus && <StatusChip value={candidate.slipStatus} />}
      </Flex>
    );
  }
  return <StatusChip value={candidate.status} />;
}

interface CandidateRowProps {
  candidate: Candidate;
  picked: boolean;
  onToggle: (employeeId: string) => void;
}

function CandidateRow({ candidate, picked, onToggle }: Readonly<CandidateRowProps>) {
  const t = useT();
  const ready = isReady(candidate);
  const role = [candidate.designation, candidate.department].filter(Boolean).join(' · ');
  return (
    <TableRow hover={ready}>
      <TableCell padding="checkbox">
        <Checkbox
          checked={ready && picked}
          disabled={!ready}
          onChange={() => onToggle(candidate.employeeId)}
          slotProps={{
            input: { 'aria-label': t('Run payroll for {name}', { name: candidate.name }) },
          }}
        />
      </TableCell>
      <TableCell>
        <Text weight="medium" sx={{ display: 'block' }}>
          {candidate.name}
        </Text>
        {role && (
          <Text size="sm" color="text.secondary">
            {role}
          </Text>
        )}
      </TableCell>
      <TableCell>
        <CandidateStanding candidate={candidate} />
      </TableCell>
      <TableCell align="right">{amount(candidate.gross, candidate.currency)}</TableCell>
      <TableCell align="right">{amount(candidate.deductions, candidate.currency)}</TableCell>
      <TableCell align="right">{amount(candidate.net, candidate.currency)}</TableCell>
    </TableRow>
  );
}

interface CandidateTableProps {
  rows: readonly Candidate[];
  isPicked: (employeeId: string) => boolean;
  onToggle: (employeeId: string) => void;
  onToggleAll: () => void;
  allPicked: boolean;
  somePicked: boolean;
  readyCount: number;
}

/** Every active employee in the plan, with a tick box for each one the run can reach. */
export function CandidateTable({
  rows,
  isPicked,
  onToggle,
  onToggleAll,
  allPicked,
  somePicked,
  readyCount,
}: Readonly<CandidateTableProps>) {
  const t = useT();
  return (
    <TableContainer tabIndex={0} aria-label={t('Employees')} sx={{ maxHeight: 420 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allPicked}
                indeterminate={somePicked}
                disabled={readyCount === 0}
                onChange={onToggleAll}
                slotProps={{ input: { 'aria-label': t('Select every ready employee') } }}
              />
            </TableCell>
            <TableCell>{t('Employee')}</TableCell>
            <TableCell>{t('Status')}</TableCell>
            <TableCell align="right">{t('Gross')}</TableCell>
            <TableCell align="right">{t('Deductions')}</TableCell>
            <TableCell align="right">{t('Net')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((candidate) => (
            <CandidateRow
              key={candidate.employeeId}
              candidate={candidate}
              picked={isPicked(candidate.employeeId)}
              onToggle={onToggle}
            />
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <Text size="sm">{t('No employee matches that search.')}</Text>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
