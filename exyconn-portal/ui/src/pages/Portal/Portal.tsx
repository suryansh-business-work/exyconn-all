import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Box, Grid, Flex, Text, Typography } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { accessibleModules, type ModuleDefinition } from '@exyconn/shell/config/modules';
import { useCrossAppNavigate } from '@exyconn/shell/hooks/useCrossAppNavigate';
import { ModuleCard } from './ModuleCard';
import { ModuleToolbar } from './ModuleToolbar';
import { visibleModules, type ModuleSort } from './moduleQuery';

/** Post-login landing: the modules the current role can open, searchable and sortable. */
export function Portal() {
  const { user } = useAuth();
  const t = useT();
  const navigateTo = useCrossAppNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ModuleSort>('default');
  if (!user) return null;

  const modules = accessibleModules(user.roles);
  const shown = visibleModules(modules, search, sort, t);
  const open = (module: ModuleDefinition) => navigateTo(module.key, module.path);

  return (
    <Box>
      <Flex direction="column" spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          {t('Hello, {name}', { name: user.name.split(' ')[0] })}
        </Typography>
        <Text color="text.secondary">
          {t(
            modules.length === 1
              ? 'You have access to {count} module.'
              : 'You have access to {count} modules.',
            {
              count: modules.length,
            },
          )}
        </Text>
      </Flex>
      {modules.length > 0 && (
        <ModuleToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
        />
      )}
      {/* Announces how many modules a search leaves, which a screen reader cannot see change. */}
      <Box role="status">
        {search.trim() && (
          <Text size="sm" color="text.secondary" sx={{ mb: 2 }}>
            {t('{count} of {total} modules shown', {
              count: shown.length,
              total: modules.length,
            })}
          </Text>
        )}
      </Box>
      {modules.length > 0 && shown.length === 0 ? (
        <EmptyState
          title="No modules match “{search}”"
          titleValues={{ search: search.trim() }}
          description="Try another word, or clear the search."
          actionLabel="Clear search"
          onAction={() => setSearch('')}
        />
      ) : (
        <Grid container spacing={2} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {shown.map((module) => (
            <Grid key={module.key} component="li" size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ModuleCard module={module} onOpen={open} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
