import { assertPermission, PERMISSION_MODULES } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import { withIds } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';
import { SupportTicketModel } from '../employee/support.model';
import { AssetModel } from '../assets/asset.model';
import { LicenceModel } from '../assets/licence.model';
import { AnnouncementModel } from '../announcements/announcement.model';
import {
  ItAccessRequestModel,
  ItChangeModel,
  ItCloudResourceModel,
  ItIncidentModel,
  ItPurchaseRequestModel,
  ItVulnerabilityModel,
} from './models';
import {
  ACTIVE_INCIDENT,
  endsWithin,
  IN_SERVICE_ASSET,
  IT_ANNOUNCEMENT,
  IT_TICKET,
  OPEN_TICKET,
  OPEN_VULNERABILITY,
} from './itsm.queries';
import { getItSettings } from './settings';
import { ACCESS_AWAITING } from './access';
import { CHANGE_AWAITING } from './changes';
import { PURCHASE_AWAITING } from './purchases';

/** Dashboard, profile, cost and reports read under one permission-matrix module. */
export const INSIGHTS_MODULE = 'ItInsights';
PERMISSION_MODULES.add(INSIGHTS_MODULE);
export const itOnly = [ROLES.IT];

/** How many rows each list on the dashboard shows. */
const DASHBOARD_LIST_SIZE = 5;

/** Ticket counts for IT's slice of the support queue. */
function ticketCounts() {
  const open = { ...IT_TICKET, ...OPEN_TICKET };
  return Promise.all([
    SupportTicketModel.countDocuments(open),
    SupportTicketModel.countDocuments({ ...open, dueAt: { $ne: null, $lt: new Date() } }),
    SupportTicketModel.countDocuments({ ...open, assigneeId: '' }),
  ]);
}

/** Everything waiting on an IT decision, across the three workflows. */
function pendingCounts() {
  return Promise.all([
    ItAccessRequestModel.countDocuments({ status: { $in: [...ACCESS_AWAITING] } }),
    ItChangeModel.countDocuments({ status: { $in: [...CHANGE_AWAITING] } }),
    ItPurchaseRequestModel.countDocuments({ status: { $in: [...PURCHASE_AWAITING] } }),
  ]);
}

/** What the company owns, and what is about to lapse. */
async function estateCounts() {
  const settings = await getItSettings();
  return Promise.all([
    AssetModel.countDocuments(),
    AssetModel.countDocuments({ status: 'ASSIGNED' }),
    AssetModel.countDocuments({ status: 'IN_REPAIR' }),
    AssetModel.countDocuments({
      ...IN_SERVICE_ASSET,
      warrantyExpiry: endsWithin(settings.warrantyWarningDays),
    }),
    LicenceModel.countDocuments({
      status: 'ACTIVE',
      renewalDate: endsWithin(settings.renewalWarningDays),
    }),
    ItCloudResourceModel.countDocuments({
      status: { $ne: 'RETIRED' },
      expiresAt: endsWithin(settings.certificateWarningDays),
    }),
  ]);
}

function riskCounts() {
  return Promise.all([
    ItIncidentModel.countDocuments(ACTIVE_INCIDENT),
    ItIncidentModel.countDocuments({ ...ACTIVE_INCIDENT, category: 'OUTAGE' }),
    ItVulnerabilityModel.countDocuments(OPEN_VULNERABILITY),
    ItVulnerabilityModel.countDocuments({ ...OPEN_VULNERABILITY, severity: 'CRITICAL' }),
  ]);
}

/** The lists under the tiles: live incidents, what is about to change, what IT announced. */
async function dashboardLists() {
  const now = new Date();
  const [recentIncidents, upcomingChanges, announcements] = await Promise.all([
    ItIncidentModel.find().sort({ startedAt: -1 }).limit(DASHBOARD_LIST_SIZE).lean(),
    ItChangeModel.find({ status: { $in: ['APPROVED', 'SCHEDULED'] }, plannedEnd: { $gte: now } })
      .sort({ plannedStart: 1 })
      .limit(DASHBOARD_LIST_SIZE)
      .lean(),
    AnnouncementModel.find({
      ...IT_ANNOUNCEMENT,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ pinned: -1, publishedAt: -1 })
      .limit(DASHBOARD_LIST_SIZE)
      .lean(),
  ]);
  return {
    recentIncidents: withIds(recentIncidents),
    upcomingChanges: withIds(upcomingChanges),
    announcements: withIds(announcements),
  };
}

/** IT › Dashboard, in one round trip: counts from indexed queries, three short lists. */
export async function itDashboard(_p: unknown, _a: unknown, ctx: GraphQLContext) {
  await assertPermission(ctx, INSIGHTS_MODULE, itOnly, 'VIEW');
  const [tickets, pending, estate, risk, lists] = await Promise.all([
    ticketCounts(),
    pendingCounts(),
    estateCounts(),
    riskCounts(),
    dashboardLists(),
  ]);
  const [openTickets, overdueTickets, unassignedTickets] = tickets;
  const [pendingAccess, pendingChanges, pendingPurchases] = pending;
  const [
    assetsTotal,
    assetsAssigned,
    assetsInRepair,
    warrantiesEnding,
    licencesRenewing,
    expiring,
  ] = estate;
  const [activeIncidents, activeOutages, openVulnerabilities, criticalVulnerabilities] = risk;
  return {
    openTickets,
    overdueTickets,
    unassignedTickets,
    pendingAccess,
    pendingChanges,
    pendingPurchases,
    assetsTotal,
    assetsAssigned,
    assetsInRepair,
    warrantiesEnding,
    licencesRenewing,
    certificatesExpiring: expiring,
    activeIncidents,
    activeOutages,
    openVulnerabilities,
    criticalVulnerabilities,
    ...lists,
  };
}
