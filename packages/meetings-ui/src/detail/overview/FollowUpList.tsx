import { useFormatters, useT } from '@exyconn/i18n';
import { List, ListItem, ListItemText, Text } from '@exyconn/shell/components/ui';
import type { MaFollowUpQuery } from '@exyconn/shell/graphql/generated';

type CarriedAction = MaFollowUpQuery['maFollowUp']['pendingActions'][number];

interface FollowUpListProps {
  title: string;
  actions: readonly CarriedAction[];
}

/** One group of actions carried over from the previous meeting, with owner and due date. */
export function FollowUpList({ title, actions }: Readonly<FollowUpListProps>) {
  const t = useT();
  const { formatDate } = useFormatters();
  if (actions.length === 0) {
    return null;
  }
  return (
    <>
      <Text size="sm" weight="semibold" sx={{ mt: 1.5, display: 'block' }}>
        {t(title)}
      </Text>
      <List dense disablePadding>
        {actions.map((action) => (
          <ListItem key={action.id} disableGutters>
            <ListItemText
              primary={action.title}
              secondary={t('{owner} · due {due}', {
                owner: action.assignedTo ?? t('Unassigned'),
                due: action.dueDate ? formatDate(action.dueDate) : t('no date'),
              })}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}
