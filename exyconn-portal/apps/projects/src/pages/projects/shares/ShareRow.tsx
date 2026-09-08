import { Box, Button, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import BlockIcon from '@mui/icons-material/Block';
import type { ProjectShareFieldsFragment } from '@exyconn/shell/graphql/generated';

interface ShareRowProps {
  share: ProjectShareFieldsFragment;
  /** The expiry date through the viewer's own settings. */
  expiry: string;
  onRevoke: (share: ProjectShareFieldsFragment) => void;
}

/** The one-word answer to "can this link still be opened". */
function stateOf(share: ProjectShareFieldsFragment): { label: string; live: boolean } {
  if (share.revokedAt) {
    return { label: 'Revoked', live: false };
  }
  return share.isLive ? { label: 'Live', live: true } : { label: 'Expired', live: false };
}

/** One issued link: what it is for, whether it still works, and the way to stop it. */
export function ShareRow({ share, expiry, onRevoke }: Readonly<ShareRowProps>) {
  const state = stateOf(share);

  return (
    <Box sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: 'divider' }}>
      <Flex direction="row" alignItems="center" spacing={1}>
        <Text size="sm" weight="medium" sx={{ flex: 1, minWidth: 0 }}>
          {share.label || 'Untitled link'}
        </Text>
        <Chip size="small" color={state.live ? 'success' : 'default'} label={state.label} />
        {state.live ? (
          <Button
            size="small"
            color="error"
            startIcon={<BlockIcon />}
            onClick={() => onRevoke(share)}
          >
            Revoke
          </Button>
        ) : null}
      </Flex>
      <Text size="caption" color="text.secondary">
        Expires {expiry}
        {share.createdByName ? ` · created by ${share.createdByName}` : ''}
      </Text>
    </Box>
  );
}
