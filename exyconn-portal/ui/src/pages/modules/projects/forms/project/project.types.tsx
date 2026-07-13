import type { ListProjectsQuery } from '@/graphql/generated';

export type ProjectRow = ListProjectsQuery['listProjects'][number];
