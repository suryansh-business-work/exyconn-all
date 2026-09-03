import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  Flex,
  Text,
  TextField,
} from '@exyconn/shell/components/ui';
import DrawIcon from '@mui/icons-material/Draw';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useAcknowledgePolicyMutation } from '@exyconn/shell/graphql/generated';
import type { Policy } from './PolicyCard';

interface Props {
  policy: Policy | null;
  onClose: () => void;
  onSigned: () => void;
}

/**
 * Read a policy, and sign it.
 *
 * The signature is a typed name rather than a checkbox on purpose: a tick is something
 * people click past, and this record exists precisely to be shown to somebody later who
 * says they never agreed to it.
 */
export function PolicyReaderDialog({ policy, onClose, onSigned }: Readonly<Props>) {
  const [signedName, setSignedName] = useState('');
  const [acknowledge, { loading }] = useAcknowledgePolicyMutation();
  const notify = useNotify();
  const { formatDate } = useSettings();

  if (policy === null) {
    return null;
  }

  const needsSigning = policy.requiresAcknowledgement && !policy.acknowledged;

  const sign = async () => {
    try {
      await acknowledge({ variables: { policyId: policy.id, signedName } });
      notify('Signed — a confirmation is on its way to your inbox');
      setSignedName('');
      onSigned();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not record your signature', 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth aria-label={policy.title}>
      <DialogContent>
        <Text size="lg" weight="bold" component="div">
          {policy.title}
        </Text>
        <Text size="caption" color="text.secondary" component="div" sx={{ mb: 2 }}>
          Version {policy.version} · effective {formatDate(policy.effectiveDate)}
        </Text>

        {/* First-party content, authored by Legal in the portal — not user input. */}
        <Box
          sx={(theme) => ({
            maxHeight: '52vh',
            overflow: 'auto',
            p: 2,
            mb: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '4px',
            '& p': { my: 1 },
            '& ul, & ol': { pl: 3 },
          })}
          dangerouslySetInnerHTML={{ __html: policy.body }}
        />

        {policy.acknowledged ? (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: '4px' }}>
            You signed version {policy.version}
            {policy.acknowledgedAt ? ` on ${formatDate(policy.acknowledgedAt)}` : ''}.
          </Alert>
        ) : null}

        {needsSigning ? (
          <Flex direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              label="Type your full name to sign"
              value={signedName}
              onChange={(event) => setSignedName(event.target.value)}
              sx={{ minWidth: 260 }}
            />
            <Button
              variant="contained"
              startIcon={<DrawIcon />}
              disabled={loading || signedName.trim() === ''}
              onClick={() => void sign()}
            >
              Sign
            </Button>
          </Flex>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
