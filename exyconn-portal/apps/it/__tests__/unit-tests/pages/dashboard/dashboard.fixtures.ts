import {
  AnnouncementCategory,
  ItChangeStatus,
  ItEnvironment,
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
  ItRisk,
  type ItDashboardQuery,
} from '@exyconn/shell/graphql/generated';

type Dashboard = ItDashboardQuery['itDashboard'];

/** An IT dashboard with nothing in its lists. */
export function emptyDashboard(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    openTickets: 12,
    overdueTickets: 3,
    unassignedTickets: 4,
    pendingAccess: 2,
    pendingChanges: 1,
    pendingPurchases: 5,
    assetsTotal: 40,
    assetsAssigned: 31,
    assetsInRepair: 2,
    warrantiesEnding: 1,
    licencesRenewing: 2,
    certificatesExpiring: 3,
    activeIncidents: 2,
    activeOutages: 1,
    openVulnerabilities: 6,
    criticalVulnerabilities: 2,
    recentIncidents: [],
    upcomingChanges: [],
    announcements: [],
    ...overrides,
  };
}

/** The same dashboard with one row in each list. */
export function fullDashboard(): Dashboard {
  return emptyDashboard({
    recentIncidents: [
      {
        id: 'inc-1',
        title: 'VPN down',
        severity: ItIncidentSeverity.Sev1,
        category: ItIncidentCategory.Outage,
        status: ItIncidentStatus.Investigating,
        startedAt: '2026-10-05T08:00',
      },
    ],
    upcomingChanges: [
      {
        id: 'chg-1',
        title: 'Upgrade Mongo',
        environment: ItEnvironment.Production,
        risk: ItRisk.High,
        status: ItChangeStatus.Scheduled,
        plannedStart: '2026-10-10T10:00',
      },
    ],
    announcements: [
      {
        id: 'ann-1',
        title: 'Firewall maintenance',
        category: AnnouncementCategory.Maintenance,
        publishedAt: '2026-10-01',
      },
    ],
  });
}
