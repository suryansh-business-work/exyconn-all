import type { ListProjectsQuery } from '@exyconn/shell/graphql/generated';

export type ProjectRow = ListProjectsQuery['listProjects'][number];
