import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { StatusMonitorModel } from './status-monitor.model';
import { ProblemReportModel } from './problem-report.model';
import { getStatusOverview } from './status.service';
import { submitProblemReport, type ProblemReportInput } from './problem-report.service';
import type { GraphQLContext } from '../../middleware/auth';

interface StatusMonitorInput {
  key: string;
  name: string;
  description: string;
  category: string;
  url: string;
  isActive: boolean;
  order: number;
}

interface ProblemReportRecord extends ProblemReportInput {
  serviceName: string;
  status: string;
  assignee: string;
  resolutionNotes: string;
}

/** Tech owns both catalogues; ADMIN passes every guard anyway. */
const techOnly = [ROLES.TECH];

export const statusMonitorsService = createCrudService<StatusMonitorInput>(
  StatusMonitorModel as never,
  'Status monitor',
);
export const problemReportsService = createCrudService<ProblemReportRecord>(
  ProblemReportModel as never,
  'Problem report',
);

const monitorCrud = createCrudResolvers(statusMonitorsService, {
  name: 'StatusMonitor',
  roles: techOnly,
  table: {
    searchFields: ['key', 'name', 'description', 'url'],
    filterFields: ['key', 'name', 'url', 'category', 'state'],
    sortFields: ['key', 'name', 'category', 'state', 'order', 'lastCheckedAt'],
    defaultSort: { field: 'order', dir: 'ASC' },
  },
  stats: { countBy: ['state', 'category'] },
});

const reportCrud = createCrudResolvers(problemReportsService, {
  name: 'ProblemReport',
  roles: techOnly,
  table: {
    searchFields: ['reference', 'subject', 'description', 'reporterName', 'reporterEmail'],
    filterFields: ['reference', 'subject', 'serviceName', 'category', 'severity', 'status'],
    sortFields: ['reference', 'subject', 'severity', 'status', 'serviceName', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'severity'] },
});

export const statusResolvers = {
  Query: {
    ...monitorCrud.Query,
    ...reportCrud.Query,
    /** Unauthenticated — this is the whole point of a public status page. */
    statusOverview: (_p: unknown, { days }: { days?: number | null }) => getStatusOverview(days),
  },
  Mutation: {
    ...monitorCrud.Mutation,
    ...reportCrud.Mutation,
    /** Unauthenticated — anyone hitting a problem must be able to say so, rate-limited by address. */
    submitProblemReport: (
      _p: unknown,
      { input }: { input: ProblemReportInput },
      ctx: GraphQLContext,
    ) => submitProblemReport(input, ctx.ip ?? 'unknown'),
  },
};
