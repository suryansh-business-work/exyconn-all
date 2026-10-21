import { useMemo, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Grid, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { CardGridSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { LEGAL_KIND_LABELS } from '@exyconn/shell/components/legal';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDeleteLegalGroupMutation,
  useLegalAssignablesQuery,
  useListLegalGroupsQuery,
  type LegalItemKind,
} from '@exyconn/shell/graphql/generated';
import { GroupCard } from './GroupCard';
import { LegalGroupForm, type LegalGroupRow } from './forms/legal-group';

interface Props {
  kind: LegalItemKind;
  /** True once the page's Add group button asks for the create form. */
  creating: boolean;
  onCreated: () => void;
}

/** One register's groups, each with the items in it. */
export function GroupsPanel({ kind, creating, onCreated }: Readonly<Props>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const groups = useListLegalGroupsQuery({ fetchPolicy: 'cache-and-network' });
  const items = useLegalAssignablesQuery({ fetchPolicy: 'cache-and-network' });
  const [deleteGroup] = useDeleteLegalGroupMutation();
  const [editing, setEditing] = useState<LegalGroupRow | null>(null);
  const labels = LEGAL_KIND_LABELS[kind];

  const rows = useMemo(
    () => (groups.data?.listLegalGroups ?? []).filter((group) => group.kind === kind),
    [groups.data, kind],
  );
  const membersOf = useMemo(() => {
    const byGroup = new Map<string, { id: string; title: string }[]>();
    for (const item of items.data?.legalAssignables ?? []) {
      if (item.kind === kind && item.groupId) {
        byGroup.set(item.groupId, [...(byGroup.get(item.groupId) ?? []), item]);
      }
    }
    return byGroup;
  }, [items.data, kind]);

  const remove = async (group: LegalGroupRow) => {
    const ok = await confirm({
      title: 'Delete group',
      message: 'Delete "{name}"? Its items stay, ungrouped, and nobody loses what they hold.',
      messageValues: { name: group.name },
      confirmText: 'Delete',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await deleteGroup({ variables: { id: group.id } });
      notify('Group deleted');
      await Promise.all([groups.refetch(), items.refetch()]);
    } catch (err) {
      notify(errorMessage(err, 'Could not delete the group'), 'error');
    }
  };

  const close = () => {
    setEditing(null);
    onCreated();
  };
  const saved = () => {
    close();
    groups
      .refetch()
      .catch((err: unknown) => notify(errorMessage(err, 'Could not reload'), 'error'));
  };

  if (groups.loading && !groups.data) {
    return <CardGridSkeleton />;
  }
  return (
    <>
      {groups.error && <Text color="error">{groups.error.message}</Text>}
      {rows.length === 0 && (
        <EmptyState
          title={t('No {kinds} groups yet', { kinds: t(labels.many).toLowerCase() })}
          description={t('Use Add group to start one, e.g. Part Time Employee Contracts.')}
        />
      )}
      <Grid container spacing={2}>
        {rows.map((group) => (
          <Grid key={group.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <GroupCard
              group={group}
              members={membersOf.get(group.id) ?? []}
              onEdit={setEditing}
              onDelete={remove}
            />
          </Grid>
        ))}
      </Grid>
      <CrudDialog
        open={creating || editing !== null}
        title={editing ? t('Edit group') : t('Add group')}
        onClose={close}
      >
        <LegalGroupForm
          key={editing?.id ?? 'new'}
          kind={kind}
          initial={editing}
          onDone={saved}
          onCancel={close}
        />
      </CrudDialog>
    </>
  );
}
