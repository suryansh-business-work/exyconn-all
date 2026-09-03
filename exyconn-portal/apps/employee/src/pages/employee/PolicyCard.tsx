import {
  Box,
  Button,
  Card,
  CardFooter,
  CardHeader,
  Chip,
  Heading,
  Paragraph,
  Text,
} from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DrawIcon from '@mui/icons-material/Draw';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { MyPolicyFieldsFragment } from '@exyconn/shell/graphql/generated';

export type Policy = MyPolicyFieldsFragment;

interface Props {
  policy: Policy;
  onOpen: (policy: Policy) => void;
}

/**
 * One policy, as a member of staff sees it.
 *
 * The card states the version, because a signature is against a version: "signed" on a
 * policy that has since been rewritten would be a comfortable lie, and the card has to be
 * able to say "you signed v1, v2 is now in force".
 */
export function PolicyCard({ policy, onOpen }: Readonly<Props>) {
  const { formatDate } = useSettings();
  const needsSigning = policy.requiresAcknowledgement && !policy.acknowledged;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Heading level={6}>{policy.title}</Heading>}
        subheader={
          <Chip
            size="small"
            color={needsSigning ? 'warning' : 'default'}
            label={
              needsSigning ? `v${policy.version} · needs your signature` : `v${policy.version}`
            }
          />
        }
      />
      <Box sx={{ px: 2, flex: 1 }}>
        <Paragraph sx={{ color: 'text.secondary' }}>{policy.summary}</Paragraph>
      </Box>
      <CardFooter sx={{ justifyContent: 'space-between' }}>
        <Text size="caption" color="text.secondary">
          {policy.acknowledged
            ? `Signed ${policy.acknowledgedAt ? formatDate(policy.acknowledgedAt) : ''}`
            : `Effective ${formatDate(policy.effectiveDate)}`}
        </Text>
        <Button
          size="small"
          variant={needsSigning ? 'contained' : 'text'}
          startIcon={
            policy.acknowledged ? (
              <CheckCircleIcon fontSize="small" />
            ) : (
              needsSigning && <DrawIcon fontSize="small" />
            )
          }
          onClick={() => onOpen(policy)}
        >
          {needsSigning ? 'Read and sign' : 'Read'}
        </Button>
      </CardFooter>
    </Card>
  );
}
