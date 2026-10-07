import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { SupportSlaPolicyModel } from '../../../../src/modules/support/sla-policy.model';
import {
  dueAtForPriority,
  ensureSupportSlaPolicies,
  supportSlaSummary,
} from '../../../../src/modules/support/sla.service';
import { logger } from '../../../../src/utils/logger';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-09-01T12:00:00.000Z');
const hours = (n: number) => new Date(NOW.getTime() + n * HOUR);

const ticket = (category: string, extra: Record<string, unknown>) =>
  SupportTicketModel.create({
    employeeId: 'emp-1',
    subject: 'Something is broken',
    category,
    description: 'Details.',
    priority: 'HIGH',
    ...extra,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ensureSupportSlaPolicies', () => {
  it('logs the seed only when something was created', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => undefined);

    await ensureSupportSlaPolicies();
    await ensureSupportSlaPolicies();

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith('Seeded 3 support SLA policy/policies');
  });

  it('counts nothing when the driver reports no upsert count', async () => {
    jest
      .spyOn(SupportSlaPolicyModel, 'updateOne')
      .mockResolvedValue({ acknowledged: true } as never);

    await expect(ensureSupportSlaPolicies()).resolves.toBe(0);
  });
});

describe('dueAtForPriority', () => {
  it('promises nothing for a priority that has no policy at all', async () => {
    await expect(dueAtForPriority('HIGH', NOW)).resolves.toBeNull();
  });
});

describe('supportSlaSummary', () => {
  it('sorts the open queue into on track, due soon and breached at the given moment', async () => {
    await ticket('OTHER', { createdAt: hours(-2), dueAt: hours(6) });
    await ticket('OTHER', { createdAt: hours(-7), dueAt: hours(1) });
    await ticket('OTHER', { createdAt: hours(-9), dueAt: hours(-1) });
    await ticket('OTHER', { createdAt: hours(-9), dueAt: hours(-4), resolvedAt: hours(-5) });
    await ticket('OTHER', { createdAt: hours(-9), dueAt: null });

    await expect(supportSlaSummary({}, NOW)).resolves.toEqual({
      onTrack: 1,
      dueSoon: 1,
      breached: 1,
    });
  });

  it('counts only the desk’s own slice when scoped', async () => {
    await ticket('IT', { createdAt: hours(-7), dueAt: hours(1) });
    await ticket('HR', { createdAt: hours(-9), dueAt: hours(-1) });
    await ticket('HR', { createdAt: hours(-9), dueAt: hours(-4), resolvedAt: hours(-2) });

    await expect(supportSlaSummary({ category: 'IT' }, NOW)).resolves.toEqual({
      onTrack: 0,
      dueSoon: 1,
      breached: 0,
    });
    await expect(supportSlaSummary({ category: 'HR' }, NOW)).resolves.toEqual({
      onTrack: 0,
      dueSoon: 0,
      breached: 2,
    });
  });
});
