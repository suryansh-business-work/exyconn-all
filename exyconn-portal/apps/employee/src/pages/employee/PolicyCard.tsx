import { useT } from '@exyconn/i18n';
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
  const t = useT();
  const { formatDate } = useSettings();
  const needsSigning = policy.requiresAcknowledgement && !policy.acknowledged;

  let versionLabel = t('v{version}', { version: policy.version });
  if (needsSigning) {
    versionLabel = t('v{version} · needs your signature', { version: policy.version });
  }

  let dateLabel = t('Effective {date}', { date: formatDate(policy.effectiveDate) });
  if (policy.acknowledged) {
    dateLabel = policy.acknowledgedAt
      ? t('Signed {date}', { date: formatDate(policy.acknowledgedAt) })
      : t('Signed');
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title={<Heading level={6}>{policy.title}</Heading>}
        subheader={
          <Chip size="small" color={needsSigning ? 'warning' : 'default'} label={versionLabel} />
        }
      />
      <Box sx={{ px: 2, flex: 1 }}>
        <Paragraph sx={{ color: 'text.secondary' }}>{policy.summary}</Paragraph>
      </Box>
      <CardFooter sx={{ justifyContent: 'space-between' }}>
        <Text size="caption" color="text.secondary">
          {dateLabel}
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
          {needsSigning ? t('Read and sign') : t('Read')}
        </Button>
      </CardFooter>
    </Card>
  );
}
