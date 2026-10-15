import { useT } from '@exyconn/i18n';
import { Box, Chip, Flex, Heading, Link, Text, fontWeight } from '@exyconn/shell/components/ui';
import type { TaskFieldsFragment } from '@exyconn/shell/graphql/generated';
import { TICKET_TYPES, TicketFacetIcon, ticketPath } from '../projects/ticket';

interface TicketChildrenProps {
  issues: readonly TaskFieldsFragment[];
  /** Column id -> column name, so each child says where it stands. */
  statusOf: ReadonlyMap<string, string>;
}

/** The tickets filed under an epic, each a link to its own page. */
export function TicketChildren({ issues, statusOf }: Readonly<TicketChildrenProps>) {
  const t = useT();
  return (
    <Box>
      <Heading level={6} sx={{ mb: 1 }}>
        {t('Child issues ({count})', { count: issues.length })}
      </Heading>
      {issues.length === 0 ? (
        <Text size="sm" color="text.secondary">
          {t('Nothing is filed under this epic yet. Pick it as the Epic on any ticket.')}
        </Text>
      ) : (
        <Flex direction="column" spacing={1}>
          {issues.map((child) => (
            <Flex
              key={child.id}
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
            >
              <TicketFacetIcon facet={TICKET_TYPES[child.type]} kind="Type" />
              <Link href={ticketPath(child.key)} sx={{ fontWeight: fontWeight.semibold }}>
                {child.key}
              </Link>
              <Text size="sm" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                {child.title}
              </Text>
              <Chip size="small" label={statusOf.get(child.columnId) ?? ''} />
            </Flex>
          ))}
        </Flex>
      )}
    </Box>
  );
}
