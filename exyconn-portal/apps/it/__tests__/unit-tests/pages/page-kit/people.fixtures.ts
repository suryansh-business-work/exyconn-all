import {
  AssetCategory,
  AssetEdrStatus,
  AssetStatus,
  ExitStage,
  ItAccessKind,
  ItAccessStatus,
  OnboardingOwner,
  type ItEmployeeProfileQuery,
  type ItOffboardingQuery,
  type ItOnboardingQuery,
} from '@exyconn/shell/graphql/generated';
import { STAMP } from './fixtures';

type Joiner = ItOnboardingQuery['itOnboarding'][number];
type Leaver = ItOffboardingQuery['itOffboarding'][number];
type Profile = ItEmployeeProfileQuery['itEmployeeProfile'];
type AccessGrant = Joiner['access'][number];

export function accessGrant(overrides: Partial<AccessGrant> = {}): AccessGrant {
  return {
    __typename: 'ItAccessGrant',
    employeeId: 'emp-1',
    application: 'Slack',
    accessLevel: '',
    grantedAt: '2026-08-01T00:00:00.000Z',
    expiresAt: null,
    ...overrides,
  };
}

export function joinerRow(overrides: Partial<Joiner> = {}): Joiner {
  const item = { __typename: 'OnboardingItem' as const, owner: OnboardingOwner.It, notes: '' };
  return {
    __typename: 'ItOnboardingRow',
    checklistId: 'checklist-1',
    employeeId: 'emp-1',
    employeeName: 'Asha Rao',
    joinDate: '2026-10-12',
    pendingItems: 1,
    missingApplications: ['Zoom'],
    items: [
      { ...item, key: 'laptop', label: 'Laptop', dueOn: '2026-10-10', done: false },
      { ...item, key: 'email', label: 'Email account', dueOn: '2026-10-11', done: true },
    ],
    access: [accessGrant()],
    ...overrides,
  };
}

export function leaverRow(overrides: Partial<Leaver> = {}): Leaver {
  return {
    __typename: 'ItOffboardingRow',
    exitId: 'exit-1',
    employeeId: 'emp-2',
    employeeName: 'Vikram Shah',
    stage: ExitStage.NoticePeriod,
    lastWorkingDate: '2026-10-31',
    accountActive: true,
    knowledgeTransferDone: false,
    revokesPending: 0,
    assets: [
      {
        __typename: 'Asset',
        id: 'asset-1',
        assetTag: 'LT-7',
        name: 'MacBook Air',
        category: AssetCategory.Laptop,
      },
    ],
    access: [accessGrant({ employeeId: 'emp-2' })],
    ...overrides,
  };
}

type ProfileAsset = Profile['assets'][number];

export function profileAsset(overrides: Partial<ProfileAsset> = {}): ProfileAsset {
  return {
    __typename: 'Asset',
    id: 'asset-1',
    assetTag: 'LT-7',
    name: 'MacBook Air',
    category: AssetCategory.Laptop,
    status: AssetStatus.Assigned,
    manufacturer: 'Apple',
    modelName: 'M3',
    serialNumber: 'SN-123',
    assignedToId: 'emp-1',
    assignedToName: 'Asha Rao',
    location: 'Pune',
    purchaseDate: null,
    warrantyExpiry: null,
    purchaseCost: 0,
    notes: '',
    installedSoftware: [],
    edrStatus: AssetEdrStatus.Protected,
    edrCheckedAt: null,
    ...overrides,
  };
}

type OpenRequest = Profile['openRequests'][number];

export function openRequest(overrides: Partial<OpenRequest> = {}): OpenRequest {
  return {
    __typename: 'ItAccessRequest',
    id: 'request-1',
    employeeId: 'emp-1',
    employeeName: 'Asha Rao',
    application: 'Zoom',
    kind: ItAccessKind.RoleChange,
    accessLevel: '',
    reason: '',
    status: ItAccessStatus.Pending,
    requestedByName: '',
    decidedByName: '',
    decidedAt: null,
    decisionNote: '',
    fulfilledAt: null,
    expiresAt: null,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...overrides,
  };
}

export function profileRow(overrides: Partial<Profile> = {}): Profile {
  return {
    __typename: 'ItEmployeeProfile',
    id: 'emp-1',
    name: 'Asha Rao',
    email: 'asha@exyconn.test',
    department: 'Engineering',
    designation: 'Developer',
    roles: ['EMPLOYEE'],
    isActive: true,
    isBlocked: false,
    lastActiveAt: '2026-10-01T09:00:00.000Z',
    openTickets: 2,
    assets: [],
    licences: [],
    access: [],
    openRequests: [],
    ...overrides,
  };
}
