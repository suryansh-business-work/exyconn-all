import { Avatar, Box, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useTaskActivityQuery } from '@exyconn/shell/graphql/generated';
import { initialsOf } from './ticket-meta';

interface TicketActivityProps {
  taskId: string;
}

/** "priority from High to Highest" — or the shorter sentence when one side is empty. */
function describe(field: string, fromValue: string, toValue: string): string {
  if (field === 'created') {
    return `created ${toValue}`;
  }
  if (fromValue === '') {
    return `set ${field} to ${toValue}`;
  }
  if (toValue === '') {
    return `cleared ${field}`;
  }
  return `changed ${field} from ${fromValue} to ${toValue}`;
}

/**
 * What has happened to this ticket, newest first — the answer to "who moved this, and when".
 * It is a record, not a form: nothing here is editable, and nothing is inferred at read time.
 */
export function TicketActivity({ taskId }: Readonly<TicketActivityProps>) {
  const { formatDateTime } = useSettings();
  const { data } = useTaskActivityQuery({
    variables: { taskId },
    fetchPolicy: 'cache-and-network',
  });

  const entries = data?.taskActivity ?? [];

  return (
    <Box>
      <Text size="label" sx={{ mb: 1 }}>
        History ({entries.length})
      </Text>
      <Divider sx={{ mb: 1.5 }} />

      <Flex direction="column" spacing={1.25}>
        {entries.map((entry) => (
          <Flex key={entry.id} direction="row" spacing={1.25} alignItems="flex-start">
            <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
              {initialsOf(entry.actorName)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Text size="sm">
                <Text component="span" size="sm" weight="medium">
                  {entry.actorName}
                </Text>{' '}
                {describe(entry.field, entry.fromValue, entry.toValue)}
              </Text>
              <Text size="caption" color="text.secondary">
                {formatDateTime(entry.createdAt)}
              </Text>
            </Box>
          </Flex>
        ))}

        {entries.length === 0 ? (
          <Text size="sm" color="text.secondary">
            Nothing has changed on this ticket yet.
          </Text>
        ) : null}
      </Flex>
    </Box>
  );
}
