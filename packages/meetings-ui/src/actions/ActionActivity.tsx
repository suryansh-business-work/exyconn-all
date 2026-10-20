import { useFormatters, useT } from '@exyconn/i18n';
import { Heading, List, ListItem, ListItemText, Text } from '@exyconn/shell/components/ui';
import type { ActionItemRow } from '../forms/action-item';

/** The item's comment thread, oldest first. */
export function ActionComments({ comments }: Readonly<{ comments: ActionItemRow['comments'] }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return (
    <>
      <Heading level={3} sx={{ typography: 'subtitle2', mt: 2 }}>
        {t('Comments')}
      </Heading>
      {comments.length === 0 ? (
        <Text size="sm" color="text.secondary">
          {t('No comments yet.')}
        </Text>
      ) : (
        <List dense>
          {comments.map((comment) => (
            <ListItem key={comment.id} disableGutters>
              <ListItemText
                primary={comment.text}
                secondary={t('{name} · {when}', {
                  name: comment.byName,
                  when: formatDateTime(comment.createdAt),
                })}
              />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}

/** Every change made to the item: which field, from what, to what, by whom and when. */
export function ActionHistory({ history }: Readonly<{ history: ActionItemRow['history'] }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  if (history.length === 0) {
    return null;
  }
  return (
    <>
      <Heading level={3} sx={{ typography: 'subtitle2', mt: 2 }}>
        {t('History')}
      </Heading>
      <List dense>
        {history.map((change) => (
          <ListItem key={`${change.at}-${change.field}`} disableGutters>
            <ListItemText
              primary={t('{field}: {from} → {to}', {
                field: change.field,
                from: change.from || '—',
                to: change.to || '—',
              })}
              secondary={t('{name} · {when}', {
                name: change.byName,
                when: formatDateTime(change.at),
              })}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}
