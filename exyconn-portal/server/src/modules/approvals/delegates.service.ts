import { ApprovalDelegateModel } from './delegate.model';
import { UserModel } from '../admin/user.model';
import { directReportIds } from '../admin/reporting';
import { badRequest, notFound } from '../../utils/errors';

/** A delegation as the screens read it, with both names resolved. */
export interface ApprovalDelegation {
  id: string;
  fromEmployeeId: string;
  fromName: string;
  toEmployeeId: string;
  toName: string;
  fromDate: Date;
  toDate: Date;
  note: string;
  /** Whether it covers today, which is the only question the queue asks. */
  active: boolean;
}

/** Midnight to midnight: a delegation is about days, not about the minute it was saved. */
const startOfDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
const endOfDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));

async function namesFor(ids: string[]): Promise<Map<string, string>> {
  const rows = await UserModel.find({ _id: { $in: [...new Set(ids)] } })
    .select('name')
    .lean();
  return new Map(rows.map((row) => [String(row._id), row.name]));
}

const withNames = async (
  rows: { _id: unknown; [key: string]: unknown }[],
  now: Date,
): Promise<ApprovalDelegation[]> => {
  const names = await namesFor(
    rows.flatMap((row) => [String(row.fromEmployeeId), String(row.toEmployeeId)]),
  );
  return rows.map((row) => {
    const fromDate = row.fromDate as Date;
    const toDate = row.toDate as Date;
    return {
      id: String(row._id),
      fromEmployeeId: String(row.fromEmployeeId),
      fromName: names.get(String(row.fromEmployeeId)) ?? '',
      toEmployeeId: String(row.toEmployeeId),
      toName: names.get(String(row.toEmployeeId)) ?? '',
      fromDate,
      toDate,
      note: String(row.note ?? ''),
      active: fromDate <= now && toDate >= now,
    };
  });
};

/**
 * Who this person is covering today.
 *
 * Read on every approvals query, which is why it is one indexed lookup returning ids rather
 * than anything richer: the queue only needs to know whose work to include.
 */
export async function delegatedFromIds(toEmployeeId: string, now = new Date()): Promise<string[]> {
  const rows = await ApprovalDelegateModel.find({
    toEmployeeId,
    fromDate: { $lte: now },
    toDate: { $gte: now },
  })
    .select('fromEmployeeId')
    .lean();
  return [...new Set(rows.map((row) => String(row.fromEmployeeId)))];
}

/** What one person has arranged, and what they are covering. */
export async function myDelegations(employeeId: string, now = new Date()) {
  const [given, held] = await Promise.all([
    ApprovalDelegateModel.find({ fromEmployeeId: employeeId }).sort({ fromDate: -1 }).lean(),
    ApprovalDelegateModel.find({ toEmployeeId: employeeId }).sort({ fromDate: -1 }).lean(),
  ]);
  return {
    given: await withNames(given as never, now),
    held: await withNames(held as never, now),
  };
}

/**
 * Hands this person's approvals to a colleague for a window.
 *
 * The delegate has to be somebody real and cannot be the person themself. It does NOT have
 * to be another manager: covering for somebody is about being trusted while they are away,
 * and the decision is recorded against whoever actually made it either way.
 */
export async function delegateApprovals(input: {
  fromEmployeeId: string;
  toEmployeeId: string;
  fromDate: Date;
  toDate: Date;
  note?: string | null;
}) {
  if (input.toEmployeeId === input.fromEmployeeId) {
    badRequest('Pick somebody else to cover your approvals.');
  }
  const delegate = await UserModel.findById(input.toEmployeeId).select('isActive').lean();
  if (!delegate?.isActive) {
    badRequest('That person does not have an active account.');
  }
  if (input.toDate < input.fromDate) {
    badRequest('The last day cannot be before the first.');
  }
  const created = await ApprovalDelegateModel.create({
    fromEmployeeId: input.fromEmployeeId,
    toEmployeeId: input.toEmployeeId,
    fromDate: startOfDay(input.fromDate),
    toDate: endOfDay(input.toDate),
    note: input.note ?? '',
  });
  const [row] = await withNames([created.toObject() as never], new Date());
  return row;
}

/** Ends a delegation. Only the person who arranged it can call it off. */
export async function endDelegation(id: string, fromEmployeeId: string): Promise<boolean> {
  const result = await ApprovalDelegateModel.deleteOne({ _id: id, fromEmployeeId });
  if (result.deletedCount === 0) {
    notFound('Delegation');
  }
  return true;
}

/**
 * The reports a caller may decide for: their own, plus anybody's they are covering today.
 *
 * Whose reports, not whose queue: a delegate stands in the away person's place in the
 * reporting line, so they see exactly what that person would have seen and nothing more.
 */
export async function reportsInScope(userId: string, now = new Date()): Promise<string[]> {
  const covering = await delegatedFromIds(userId, now);
  const lists = await Promise.all([userId, ...covering].map((id) => directReportIds(id)));
  return [...new Set(lists.flat())];
}
