import { Alert, Box, Flex, Text } from '@exyconn/shell/components/ui';
import { useCampaignPreviewQuery } from '@exyconn/shell/graphql/generated';

interface SendPreviewProps {
  campaignId: string;
  audienceListId: string;
}

/**
 * The first recipient's copy, exactly as the send will render it.
 *
 * Merge fields are the part of a campaign that goes wrong silently — a missing value
 * leaves a hole nobody sees until it is in ten thousand inboxes — so the preview is
 * rendered by the server, by the same code the send uses.
 */
export function SendPreview({ campaignId, audienceListId }: Readonly<SendPreviewProps>) {
  const { data, loading, error } = useCampaignPreviewQuery({
    variables: { id: campaignId, audienceListId },
  });

  if (loading) {
    return <Text size="caption">Rendering preview…</Text>;
  }
  if (error) {
    return <Alert severity="warning">{error.message}</Alert>;
  }
  const preview = data?.campaignPreview;
  if (!preview) {
    return <Alert severity="warning">This audience currently reaches nobody.</Alert>;
  }

  return (
    <Flex direction="column" spacing={0.5}>
      <Text size="label">Preview — as {preview.recipient} will see it</Text>
      <Text size="sm" weight="medium">
        {preview.subject}
      </Text>
      <Box
        sx={{
          maxHeight: 200,
          overflowY: 'auto',
          p: 1,
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      >
        <Text size="sm" sx={{ whiteSpace: 'pre-wrap' }}>
          {preview.body}
        </Text>
      </Box>
    </Flex>
  );
}
