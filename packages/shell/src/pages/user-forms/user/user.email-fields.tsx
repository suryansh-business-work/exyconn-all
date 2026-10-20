import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useT } from '@exyconn/i18n';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Box, Button, Chip, Flex, Text } from '@/components/ui';
import { RhfTextField } from '@/components/form/rhf';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { EmployeeEmailKind, useRequestEmployeeEmailCodeMutation } from '@/graphql/generated';
import { portalLogger } from '@/logging/portalLogger';
import { EmployeeEmailCodeDialog, type EmployeeEmailTarget } from '../employee-email-code';
import type { UserRow } from './user.types';

interface VerifyStatusProps {
  employeeId: string;
  kind: EmployeeEmailKind;
  /** The address as saved on the record. */
  saved: string;
  /** What the field holds now. */
  current: string;
  verifiedAt: string | null | undefined;
  onRequested: (target: EmployeeEmailTarget) => void;
}

/** Beside a saved address: Verified, a Verify button, or why it cannot be verified yet. */
function VerifyStatus({
  employeeId,
  kind,
  saved,
  current,
  verifiedAt,
  onRequested,
}: Readonly<VerifyStatusProps>) {
  const t = useT();
  const notify = useNotify();
  const [requestCode, { loading }] = useRequestEmployeeEmailCodeMutation();

  if (current.trim().toLowerCase() !== saved.toLowerCase()) {
    return (
      <Text size="caption" color="text.secondary">
        {t('Save to verify')}
      </Text>
    );
  }
  if (verifiedAt) {
    return (
      <Chip
        size="small"
        color="success"
        icon={<VerifiedIcon fontSize="small" />}
        label={t('Verified')}
      />
    );
  }
  const onVerify = async () => {
    try {
      await requestCode({ variables: { employeeId, kind } });
      notify('A code was emailed to {address}', 'success', { address: saved });
      onRequested({ employeeId, kind, address: saved });
    } catch (error) {
      portalLogger.warn('Sending an employee email code failed', { kind });
      notify(error instanceof Error ? error.message : 'Could not send the code', 'error');
    }
  };
  return (
    <Button
      size="small"
      variant="outlined"
      loading={loading}
      // onVerify reports its own failures.
      onClick={onVerify}
    >
      {t('Verify')}
    </Button>
  );
}

interface EmailRowProps {
  name: 'email' | 'personalEmail';
  label: string;
  kind: EmployeeEmailKind;
  employee: UserRow | null;
  saved: string;
  verifiedAt: string | null | undefined;
  onRequested: (target: EmployeeEmailTarget) => void;
}

/** One address field, with its verification beside it once the employee exists. */
function EmailRow({
  name,
  label,
  kind,
  employee,
  saved,
  verifiedAt,
  onRequested,
}: Readonly<EmailRowProps>) {
  const current = useWatch({ name }) as string;
  const status =
    employee && saved ? (
      <VerifyStatus
        employeeId={employee.id}
        kind={kind}
        saved={saved}
        current={current ?? ''}
        verifiedAt={verifiedAt}
        onRequested={onRequested}
      />
    ) : null;
  return (
    <Flex direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      <Box sx={{ flex: 1, width: '100%' }}>
        <RhfTextField name={name} label={label} type="email" />
      </Box>
      {status}
    </Flex>
  );
}

/**
 * The employee's two addresses: the official one they sign in with, and an optional personal
 * one. Each saved address can be proven with a code emailed to it; an address changed in the
 * form has to be saved first, since the code goes to what is on the record.
 */
export function EmailFields({ employee }: Readonly<{ employee: UserRow | null }>) {
  const [target, setTarget] = useState<EmployeeEmailTarget | null>(null);
  return (
    <>
      <EmailRow
        name="email"
        label="Official email"
        kind={EmployeeEmailKind.Official}
        employee={employee}
        saved={employee?.email ?? ''}
        verifiedAt={employee?.emailVerifiedAt}
        onRequested={setTarget}
      />
      <EmailRow
        name="personalEmail"
        label="Personal email (optional)"
        kind={EmployeeEmailKind.Personal}
        employee={employee}
        saved={employee?.personalEmail ?? ''}
        verifiedAt={employee?.personalEmailVerifiedAt}
        onRequested={setTarget}
      />
      <EmployeeEmailCodeDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
