import { Alert, Box, Divider, Flex, Stack, Text, fontSize } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { ShareForm } from '../forms/share';
import { ShareRow } from './ShareRow';
import { useProjectShares } from './useProjectShares';

interface ProjectSharesDrawerProps {
  /** The project whose links are being managed, or null when the drawer is closed. */
  project: { id: string; name: string } | null;
  onClose: () => void;
}

/**
 * The read-only links handed out for one project: what exists, what is still live, and one
 * more if it is needed.
 *
 * A freshly created link is shown once, in an alert, and never again — only its hash is
 * stored, so there is nothing to show a second time. Saying so on screen is what stops
 * somebody closing the drawer and expecting to find it later.
 */
export function ProjectSharesDrawer({ project, onClose }: Readonly<ProjectSharesDrawerProps>) {
  const { formatDate } = useSettings();
  const shares = useProjectShares(project?.id ?? '');

  const close = () => {
    shares.forget();
    onClose();
  };

  return (
    <CrudDialog open={project !== null} title={`Share "${project?.name ?? ''}"`} onClose={close}>
      <Stack spacing={2}>
        <Text size="sm" color="text.secondary">
          A share link opens a read-only page showing the project&apos;s status, dates, budget
          against tracked hours, milestones and ticket counts. It shows no comments, no screenshots
          and nobody&apos;s individual time.
        </Text>

        {shares.newUrl ? (
          <Alert severity="success" onClose={shares.forget}>
            <Text size="sm" sx={{ mb: 1 }}>
              Copy this link now — it is not stored and cannot be shown again.
            </Text>
            <Box
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
                fontFamily: 'monospace',
                fontSize: fontSize.xs,
                wordBreak: 'break-all',
              }}
            >
              {shares.newUrl}
            </Box>
            <Flex direction="row" spacing={1} sx={{ mt: 1 }}>
              <Text
                component="button"
                size="sm"
                onClick={shares.copyNewUrl}
                sx={{
                  border: 0,
                  bgcolor: 'transparent',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  p: 0,
                }}
              >
                Copy link
              </Text>
            </Flex>
          </Alert>
        ) : null}

        {project ? (
          <ShareForm projectId={project.id} onCreated={shares.onCreated} onCancel={close} />
        ) : null}

        <Divider />

        <Text size="label">Links ({shares.shares.length})</Text>
        {shares.shares.map((share) => (
          <ShareRow
            key={share.id}
            share={share}
            expiry={formatDate(share.expiresAt)}
            onRevoke={shares.revoke}
          />
        ))}
        {shares.shares.length === 0 ? (
          <Text size="sm" color="text.secondary">
            No links have been issued for this project.
          </Text>
        ) : null}
      </Stack>
    </CrudDialog>
  );
}
