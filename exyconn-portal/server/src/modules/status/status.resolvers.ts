import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import { StatusMonitorModel } from './status-monitor.model';
import { StatusIncidentModel } from './status-incident.model';
import { StatusMaintenanceModel } from './status-maintenance.model';
import { ProblemReportModel } from './problem-report.model';
import { getStatusOverview } from './status.service';
import { submitProblemReport, type ProblemReportInput } from './problem-report.service';
import { notifyReporterOfStatus, problemReportStatus } from './problem-report.notify';
import {
  addStatusIncidentUpdate,
  createStatusIncident,
  type CreateIncidentInput,
} from './status.incidents';
import type { IncidentUpdateStatus } from './status.constants';
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

interface MaintenanceInput {
  title: string;
  body: string;
  affectedServiceKeys: string[];
  startsAt: Date;
  endsAt: Date;
  createdBy?: string;
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
export const statusIncidentsService = createCrudService<never>(
  StatusIncidentModel as never,
  'Incident',
);
export const statusMaintenanceService = createCrudService<MaintenanceInput>(
  StatusMaintenanceModel as never,
  'Maintenance window',
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

/** Incidents are opened and updated through their own mutations; only delete is generic. */
const incidentCrud = createCrudResolvers(statusIncidentsService, {
  name: 'StatusIncident',
  roles: techOnly,
  table: {
    searchFields: ['title', 'serviceName', 'reason'],
    filterFields: ['serviceKey', 'source', 'impact', 'state'],
    sortFields: ['title', 'serviceName', 'source', 'impact', 'startedAt', 'resolvedAt'],
    defaultSort: { field: 'startedAt', dir: 'DESC' },
  },
  stats: { countBy: ['source', 'impact'] },
});

const maintenanceCrud = createCrudResolvers(statusMaintenanceService, {
  name: 'StatusMaintenance',
  plural: 'StatusMaintenanceWindows',
  roles: techOnly,
  table: {
    searchFields: ['title', 'body'],
    filterFields: ['title'],
    sortFields: ['title', 'startsAt', 'endsAt', 'createdBy'],
    defaultSort: { field: 'startsAt', dir: 'DESC' },
  },
  stats: { countBy: ['createdBy'] },
});

/** A window that ends before it starts is a typo, not a plan. */
function assertWindow(input: MaintenanceInput): void {
  if (new Date(input.endsAt) <= new Date(input.startsAt)) {
    badRequest('The maintenance window must end after it starts');
  }
}

type UpdatedReport = Parameters<typeof notifyReporterOfStatus>[0] & { id: string };

export const statusResolvers = {
  Query: {
    ...monitorCrud.Query,
    ...reportCrud.Query,
    ...incidentCrud.Query,
    ...maintenanceCrud.Query,
    /** Unauthenticated — this is the whole point of a public status page. */
    statusOverview: (_p: unknown, { days }: { days?: number | null }) => getStatusOverview(days),
    /** Unauthenticated — a reporter follows up with the reference they were given. */
    problemReportStatus: (_p: unknown, { reference }: { reference: string }, ctx: GraphQLContext) =>
      problemReportStatus(reference, ctx.ip ?? 'unknown'),
  },
  Mutation: {
    ...monitorCrud.Mutation,
    ...reportCrud.Mutation,
    deleteStatusIncident: incidentCrud.Mutation.deleteStatusIncident,
    ...maintenanceCrud.Mutation,
    /** Unauthenticated — anyone hitting a problem must be able to say so, rate-limited by address. */
    submitProblemReport: (
      _p: unknown,
      { input }: { input: ProblemReportInput },
      ctx: GraphQLContext,
    ) => submitProblemReport(input, ctx.ip ?? 'unknown'),

    /** The generated update, plus a word to the reporter when the status moved. */
    updateProblemReport: async (
      p: unknown,
      args: { id: string; input: ProblemReportRecord },
      ctx: GraphQLContext,
    ) => {
      const before = await ProblemReportModel.findById(args.id).select('status').lean();
      const updated = (await reportCrud.Mutation.updateProblemReport(
        p,
        args as never,
        ctx,
      )) as UpdatedReport;
      if (before && before.status !== updated.status) {
        await notifyReporterOfStatus(updated);
      }
      return updated;
    },

    createStatusIncident: async (
      _p: unknown,
      { input }: { input: CreateIncidentInput },
      ctx: GraphQLContext,
    ) => {
      const user = await assertPermission(ctx, 'StatusIncident', techOnly, 'CREATE');
      return withId(await createStatusIncident(input, user.email));
    },

    addStatusIncidentUpdate: async (
      _p: unknown,
      { id, status, body }: { id: string; status: IncidentUpdateStatus; body: string },
      ctx: GraphQLContext,
    ) => {
      const user = await assertPermission(ctx, 'StatusIncident', techOnly, 'EDIT');
      return withId(await addStatusIncidentUpdate(id, status, body, user.email));
    },

    createStatusMaintenance: async (
      p: unknown,
      { input }: { input: MaintenanceInput },
      ctx: GraphQLContext,
    ) => {
      const user = await assertPermission(ctx, 'StatusMaintenance', techOnly, 'CREATE');
      assertWindow(input);
      const stamped = { input: { ...input, createdBy: user.email } };
      return maintenanceCrud.Mutation.createStatusMaintenance(p, stamped as never, ctx);
    },

    updateStatusMaintenance: (
      p: unknown,
      args: { id: string; input: MaintenanceInput },
      ctx: GraphQLContext,
    ) => {
      assertWindow(args.input);
      return maintenanceCrud.Mutation.updateStatusMaintenance(p, args as never, ctx);
    },
  },
};
