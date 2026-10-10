/**
 * Stands every service behind the tracker resolvers in for a bare mock, so a resolver suite
 * tests what the resolver itself decides: who may call it, whose id it passes on, what it
 * audits and how it serializes. Import this BEFORE the resolvers: the mocks are registered
 * when this module loads, and the resolvers must load after them.
 */
import { Types } from 'mongoose';
import type { Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { trackerAdminService } from '../../../../src/modules/tracker/tracker.admin.service';
import { trackerBillingService } from '../../../../src/modules/tracker/tracker.billing.service';
import { trackerDeviceService } from '../../../../src/modules/tracker/tracker.device.service';
import { trackerManualService } from '../../../../src/modules/tracker/tracker.manual.service';
import { trackerMessageService } from '../../../../src/modules/tracker/tracker.message.service';
import { trackerTimeLogService } from '../../../../src/modules/tracker/tracker.timelog.service';
import { trackerWorkdayService } from '../../../../src/modules/tracker/tracker.workday.service';
import { assertEmployee, assertTrackerDevice } from '../../../../src/modules/tracker/tracker.auth';

/** A service whose named methods are bare mocks. A declaration, so the hoisted factories can call it. */
function mockStub(...names: string[]) {
  return Object.fromEntries(names.map((name) => [name, jest.fn()]));
}

jest.mock('../../../../src/modules/tracker/tracker.admin.service', () => ({
  trackerAdminService: mockStub(
    'listAccess',
    'listDevices',
    'calendar',
    'day',
    'totals',
    'grantAccess',
    'revokeAccess',
    'revokeDevice',
  ),
}));
jest.mock('../../../../src/modules/tracker/tracker.billing.service', () => ({
  trackerBillingService: mockStub('billing', 'billingByProject'),
}));
jest.mock('../../../../src/modules/tracker/tracker.device.service', () => ({
  trackerDeviceService: mockStub(
    'me',
    'login',
    'acceptConsent',
    'markAttendance',
    'heartbeat',
    'startSession',
    'stopSession',
    'syncIntervals',
    'uploadScreenshot',
    'setTimezone',
  ),
}));
jest.mock('../../../../src/modules/tracker/tracker.manual.service', () => ({
  trackerManualService: mockStub('list', 'listPending', 'review', 'create', 'withdraw'),
}));
jest.mock('../../../../src/modules/tracker/tracker.message.service', () => ({
  trackerMessageService: mockStub('thread', 'threads', 'send', 'broadcast', 'markRead'),
}));
jest.mock('../../../../src/modules/tracker/tracker.timelog.service', () => ({
  trackerTimeLogService: mockStub('summary', 'sessions', 'screenshots'),
}));
jest.mock('../../../../src/modules/tracker/tracker.workday.service', () => ({
  trackerWorkdayService: mockStub('projects', 'tasksFor', 'bookableProject', 'bookableTask'),
}));
jest.mock('../../../../src/modules/tracker/tracker.settings.service', () => ({
  getTrackerSettings: jest.fn(),
  updateTrackerSettings: jest.fn(),
}));
jest.mock('../../../../src/modules/tracker/tracker.presence.service', () => ({
  setPresence: jest.fn(),
}));
jest.mock('../../../../src/modules/tracker/tracker.auth', () => ({
  assertEmployee: jest.fn(),
  assertTrackerDevice: jest.fn(),
}));
jest.mock('../../../../src/utils/github', () => ({
  githubActions: { latestTrackerRelease: jest.fn() },
}));
jest.mock('../../../../src/modules/audit', () => ({ recordAudit: jest.fn() }));

type Mocked = Record<string, jest.Mock>;

export const admin = trackerAdminService as unknown as Mocked;
export const billing = trackerBillingService as unknown as Mocked;
export const device = trackerDeviceService as unknown as Mocked;
export const manual = trackerManualService as unknown as Mocked;
export const messages = trackerMessageService as unknown as Mocked;
export const timeLog = trackerTimeLogService as unknown as Mocked;
export const workday = trackerWorkdayService as unknown as Mocked;

/** The caller every suite signs in as. */
export const ME = new Types.ObjectId().toHexString();
export const FROM = new Date('2026-09-01T00:00:00.000Z');
export const TO = new Date('2026-10-01T00:00:00.000Z');

/** A portal session holding `roles`. */
export function as(...roles: Role[]): GraphQLContext {
  return { user: { id: ME, roles, email: 'caller@exyconn.com' } };
}

/** What a device token or an employee session resolves to, before each test. */
export function signInAsTheEmployee(): void {
  jest.mocked(assertTrackerDevice).mockResolvedValue({ userId: ME, deviceId: 'laptop-1' });
  jest.mocked(assertEmployee).mockResolvedValue({ id: ME });
}
