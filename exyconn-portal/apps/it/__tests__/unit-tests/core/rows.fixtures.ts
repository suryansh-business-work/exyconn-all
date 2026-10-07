import {
  AssetCategory,
  AssetEdrStatus,
  AssetStatus,
  ItAccessKind,
  ItAccessStatus,
  ItChangeStatus,
  ItChangeType,
  ItCloudKind,
  ItEnvironment,
  ItIncidentCategory,
  ItIncidentSeverity,
  ItIncidentStatus,
  ItRisk,
  ItServiceStatus,
  type AssetFieldsFragment,
  type ItAccessRequestFieldsFragment,
  type ItChangeFieldsFragment,
  type ItCloudResourceFieldsFragment,
  type ItIncidentFieldsFragment,
} from '@exyconn/shell/graphql/generated';

/** The one person the assignee pickers offer. */
export const ASSIGNEE = { id: 'emp-1', name: 'Ana Rao', email: 'ana@example.test' };
export const ASSIGNEE_LABEL = 'Ana Rao (ana@example.test)';

export function accessRow(
  overrides: Partial<ItAccessRequestFieldsFragment> = {},
): ItAccessRequestFieldsFragment {
  return {
    id: 'acc-1',
    employeeId: 'emp-1',
    employeeName: 'Ana Rao',
    application: 'Slack',
    kind: ItAccessKind.Grant,
    accessLevel: 'Editor',
    reason: 'Joins the support team',
    status: ItAccessStatus.Pending,
    requestedByName: 'Ravi',
    decidedByName: '',
    decidedAt: null,
    decisionNote: '',
    fulfilledAt: null,
    expiresAt: null,
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
  };
}

export function assetRow(overrides: Partial<AssetFieldsFragment> = {}): AssetFieldsFragment {
  return {
    id: 'asset-1',
    assetTag: 'LT-001',
    name: 'ThinkPad X1',
    category: AssetCategory.Laptop,
    status: AssetStatus.InStock,
    manufacturer: 'Lenovo',
    modelName: 'X1 Carbon',
    serialNumber: 'SN-42',
    assignedToId: '',
    assignedToName: '',
    location: 'Pune',
    purchaseDate: '2025-01-10T00:00:00.000Z',
    warrantyExpiry: '2028-01-10T00:00:00.000Z',
    purchaseCost: 1500,
    notes: 'Keyboard replaced',
    installedSoftware: ['Office'],
    edrStatus: AssetEdrStatus.Protected,
    edrCheckedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

export function changeRow(overrides: Partial<ItChangeFieldsFragment> = {}): ItChangeFieldsFragment {
  return {
    id: 'chg-1',
    title: 'Upgrade Mongo',
    description: 'Minor version bump on the primary',
    type: ItChangeType.Normal,
    risk: ItRisk.Medium,
    environment: ItEnvironment.Production,
    system: 'Database',
    status: ItChangeStatus.PendingApproval,
    plannedStart: '2026-10-10T10:00:00.000Z',
    plannedEnd: '2026-10-10T11:00:00.000Z',
    implementedAt: null,
    ownerName: 'Meera',
    rollbackPlan: 'Restore the snapshot',
    decidedByName: '',
    decidedAt: null,
    decisionNote: '',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
  };
}

export function cloudRow(
  overrides: Partial<ItCloudResourceFieldsFragment> = {},
): ItCloudResourceFieldsFragment {
  return {
    id: 'cloud-1',
    name: 'prod-db-1',
    kind: ItCloudKind.Database,
    provider: 'Hetzner',
    environment: ItEnvironment.Production,
    region: 'eu-central',
    endpoint: 'db.internal',
    expiresAt: null,
    monthlyCost: 1200,
    status: ItServiceStatus.Active,
    ownerName: 'Meera',
    notes: '',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T09:00:00.000Z',
    ...overrides,
  };
}

export function incidentRow(
  overrides: Partial<ItIncidentFieldsFragment> = {},
): ItIncidentFieldsFragment {
  return {
    id: 'inc-1',
    title: 'VPN down',
    description: 'Nobody can reach the office network',
    severity: ItIncidentSeverity.Sev2,
    category: ItIncidentCategory.Outage,
    status: ItIncidentStatus.Identified,
    startedAt: '2026-10-05T08:00:00.000Z',
    resolvedAt: null,
    impact: 'All remote staff',
    affectedSystems: ['VPN', 'Firewall'],
    commanderName: 'Meera',
    rootCause: '',
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-05T08:00:00.000Z',
    timeline: [
      {
        id: 'tl-1',
        at: '2026-10-05T08:05:00.000Z',
        status: ItIncidentStatus.Investigating,
        note: 'Looking into it',
        authorName: 'Ravi',
      },
    ],
    followUps: [
      { id: 'fu-1', title: 'Renew certificate', ownerName: 'Ravi', dueAt: null, done: false },
      {
        id: 'fu-2',
        title: 'Add monitoring',
        ownerName: '',
        dueAt: '2026-11-01T00:00:00.000Z',
        done: true,
      },
    ],
    ...overrides,
  };
}
