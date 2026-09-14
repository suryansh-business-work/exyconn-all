import { useT } from '@exyconn/i18n';
import { Avatar, Box, Divider, Flex, Text, fontSize } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useTaskActivityQuery } from '@exyconn/shell/graphql/generated';
import { initialsOf } from './ticket-meta';

interface TicketActivityProps {
  taskId: string;
}

/** The translator, so the module-scope sentence builder can be given the page's own `t`. */
type Translate = ReturnType<typeof useT>;

/** "priority from High to Highest" — or the shorter sentence when one side is empty. */
function describe(t: Translate, field: string, fromValue: string, toValue: string): string {
  if (field === 'created') {
    return t('created {value}', { value: toValue });
  }
  if (field === 'attachment') {
    if (toValue === '') {
      return t('removed attachment {name}', { name: fromValue });
    }
    return t('attached {name}', { name: toValue });
  }
  if (fromValue === '') {
    return t('set {field} to {value}', { field, value: toValue });
  }
  if (toValue === '') {
    return t('cleared {field}', { field });
  }
  return t('changed {field} from {from} to {to}', { field, from: fromValue, to: toValue });
}

/**
 * What has happened to this ticket, newest first — the answer to "who moved this, and when".
 * It is a record, not a form: nothing here is editable, and nothing is inferred at read time.
 */
export function TicketActivity({ taskId }: Readonly<TicketActivityProps>) {
  const t = useT();
  const { formatDateTime } = useSettings();
  const { data } = useTaskActivityQuery({
    variables: { taskId },
    fetchPolicy: 'cache-and-network',
  });

  const entries = data?.taskActivity ?? [];

  return (
    <Box>
      <Text size="label" sx={{ mb: 1 }}>
        {t('History ({count})', { count: entries.length })}
      </Text>
      <Divider sx={{ mb: 1.5 }} />

      <Flex direction="column" spacing={1.5}>
        {entries.map((entry) => (
          <Flex key={entry.id} direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar alt="" aria-hidden sx={{ width: 24, height: 24, fontSize: fontSize['3xs'] }}>
              {initialsOf(entry.actorName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Text size="sm">
                <Text component="span" size="sm" weight="medium">
                  {entry.actorName}
                </Text>{' '}
                {describe(t, entry.field, entry.fromValue, entry.toValue)}
              </Text>
              <Text size="caption" color="text.secondary">
                {formatDateTime(entry.createdAt)}
              </Text>
            </Box>
          </Flex>
        ))}

        {entries.length === 0 ? (
          <Text size="sm" color="text.secondary">
            {t('Nothing has changed on this ticket yet.')}
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
}
