import { useT } from '@exyconn/i18n';
import { Grid, Stack, Heading, Text } from '@exyconn/shell/components/ui';
import { LoadingState } from '@exyconn/shell/components/feedback/CenteredState';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { useClientHubProjectsQuery } from '@exyconn/shell/graphql/generated';
import { ProjectCard } from './ProjectCard';

/** The client's projects, each as a read-only card. Assigned in Projects › Project › Client. */
export function ProjectsPage() {
  const t = useT();
  const { data, loading } = useClientHubProjectsQuery();
  const projects = data?.clientHubProjects ?? [];

  if (loading && !data) {
    return <LoadingState />;
  }
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Heading level={4}>{t('Projects')}</Heading>
        <Text color="text.secondary">
          {t('Where each of your projects stands — dates, hours, milestones and work in progress.')}
        </Text>
      </Stack>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Projects we run for you appear here." />
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid key={project.id} size={{ xs: 12, md: 6 }}>
              <ProjectCard project={project} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
