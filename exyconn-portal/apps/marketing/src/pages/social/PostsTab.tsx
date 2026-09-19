import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Flex, MenuItem, Text, TextField } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { densePanel } from '@exyconn/shell/components/glass/glass';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { SocialMediaPostStatus, useSocialMediaPostsQuery } from '@exyconn/shell/graphql/generated';
import { SocialPostForm, type SocialMediaPostRow } from './forms/social-post';
import { useComposerData } from './useComposerData';
import { usePostActions } from './usePostActions';
import { accountLabel } from './social.labels';

const UNSENT = new Set<string>(['DRAFT', 'SCHEDULED', 'FAILED']);
const EXCERPT = 90;
const excerpt = (text: string) =>
  text.length > EXCERPT ? `${text.slice(0, EXCERPT)}…` : text || '—';

/** Social › Posts: every post on every account, what it did, and the ones still to go out. */
export function PostsTab() {
  const t = useT();
  const { formatDateTime } = useSettings();
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<SocialMediaPostRow | null>(null);
  const composer = useComposerData();
  const posts = useSocialMediaPostsQuery({
    variables: {
      accountId: accountId || null,
      status: (status || null) as SocialMediaPostStatus | null,
      limit: 200,
    },
    fetchPolicy: 'cache-and-network',
  });
  const reload = () => {
    posts.refetch().catch((error: unknown) => portalLogger.warn('Could not reload posts', error));
  };
  const actions = usePostActions(reload);
  const accountName = new Map(composer.accounts.map((a) => [a.id, accountLabel(a)]));
  const run = (work: Promise<void>) => {
    work.catch((error: unknown) => portalLogger.error('A post action failed', error));
  };

  const columns: Column<SocialMediaPostRow>[] = [
    {
      key: 'accountId',
      label: 'Account',
      render: (r) => accountName.get(r.accountId) ?? r.network,
    },
    {
      key: 'text',
      label: 'Post',
      render: (r) => (
        <Box>
          <Text size="sm">{excerpt(r.text)}</Text>
          {r.status === 'FAILED' && (
            <Text size="caption" color="error">
              {r.error}
            </Text>
          )}
        </Box>
      ),
    },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    {
      key: 'when',
      label: 'When',
      render: (r) => {
        const at = r.publishedAt ?? r.scheduledAt;
        return at ? formatDateTime(at) : t('Not scheduled');
      },
    },
    { key: 'likes', label: 'Likes', render: (r) => r.metrics.likes },
    { key: 'comments', label: 'Comments', render: (r) => r.metrics.comments },
    { key: 'shares', label: 'Shares', render: (r) => r.metrics.shares },
    { key: 'views', label: 'Views', render: (r) => r.metrics.views },
  ];
  const rowActions: RowAction<SocialMediaPostRow>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      ariaLabel: 'edit post',
      onClick: setEditing,
      hidden: (r) => !UNSENT.has(r.status),
    },
    {
      icon: <SendIcon fontSize="small" />,
      tooltip: 'Publish now',
      ariaLabel: 'publish post now',
      color: 'primary',
      onClick: (r) => run(actions.publishNow(r)),
      hidden: (r) => !UNSENT.has(r.status),
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Delete',
      ariaLabel: 'delete post',
      color: 'error',
      onClick: (r) => run(actions.deletePost(r)),
      hidden: (r) => !UNSENT.has(r.status),
    },
    {
      icon: <OpenInNewIcon fontSize="small" />,
      tooltip: 'Open on the network',
      ariaLabel: 'open post on the network',
      onClick: (r) => globalThis.open(r.permalink, '_blank', 'noopener'),
      hidden: (r) => !r.permalink,
    },
  ];

  return (
    <>
      <Flex direction="row" spacing={1.5} wrap sx={{ mb: 1.5 }}>
        <TextField
          select
          size="small"
          label={t('Account')}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">{t('All accounts')}</MenuItem>
          {composer.accounts.map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {accountLabel(a)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t('Status')}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t('Any status')}</MenuItem>
          {Object.values(SocialMediaPostStatus).map((value) => (
            <MenuItem key={value} value={value}>
              <StatusChip value={value} />
            </MenuItem>
          ))}
        </TextField>
      </Flex>
      <Box sx={densePanel}>
        <DataTable
          columns={columns}
          rows={[...(posts.data?.socialMediaPosts ?? [])]}
          actions={rowActions}
          loading={posts.loading}
          onRefresh={posts.refetch}
          emptyMessage="No posts yet. Sync an account, or write one in Compose."
        />
      </Box>
      <CrudDialog open={editing !== null} title={t('Edit post')} onClose={() => setEditing(null)}>
        {editing && (
          <SocialPostForm
            accounts={composer.accounts}
            rules={composer.rules}
            initial={editing}
            onCancel={() => setEditing(null)}
            onDone={() => {
              setEditing(null);
              reload();
            }}
          />
        )}
      </CrudDialog>
    </>
  );
}
