import { InvoiceModel } from './finance.model';
import { linesTotal, type InvoiceLineInput } from './invoice.lines';
import { nextInvoiceNumber } from './invoice.number';
import { getBranding } from '../branding/branding.service';
import { ClientModel } from '../clients/clients.model';
import { ProjectModel } from '../projects/projects.model';
import { trackerBillingService } from '../tracker/tracker.billing.service';
import { ROLES } from '../../constants/roles';
import { assertRole } from '../../middleware/roleGuard';
import { badRequest, notFound } from '../../utils/errors';
import { withId } from '../../utils/serialize';
import type { GraphQLContext } from '../../middleware/auth';

/** How long the client has to pay, from the day the invoice is raised. */
const DUE_IN_DAYS = 30;

const DAY_MS = 86_400_000;

/** Finance raises the invoice; Projects runs the budget and may raise it from the board. */
const INVOICING_ROLES = [ROLES.FINANCE, ROLES.PROJECTS];

/** `2026-09-01` — the day only, in UTC, for the line description. */
const day = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * A DRAFT invoice for one project's billable time over a period: one line per employee,
 * their hours at their HR billing rate, at the tax rate Branding defaults to.
 *
 * Refused rather than raised short when anything is missing — a project without a client,
 * a period with no hours, or an employee nobody has priced. An invoice that quietly left a
 * person's time off would be the same mistake this feature exists to end.
 */
export async function buildInvoiceFromTimeLog(projectId: string, from: Date, to: Date) {
  if (to <= from) {
    badRequest('The period must end after it starts.');
  }
  const project = await ProjectModel.findById(projectId).lean();
  if (!project) {
    notFound('Project');
  }
  if (!project.clientId) {
    badRequest('Set a client on the project before invoicing its time.');
  }
  const client = await ClientModel.findById(project.clientId).lean();
  if (!client) {
    notFound('Client');
  }

  const [billing] = await trackerBillingService.billingByProject(from, to, projectId);
  const employees = billing?.employees ?? [];
  if (employees.length === 0) {
    badRequest('There are no billable hours on this project in that period.');
  }
  const unrated = employees.filter((employee) => employee.rate <= 0);
  if (unrated.length > 0) {
    const names = unrated.map((employee) => employee.employeeName).join(', ');
    badRequest(`No billing rate is set for ${names}. Set one on their salary structure in HR.`);
  }

  const [branding, number] = await Promise.all([getBranding(), nextInvoiceNumber()]);
  const period = `${day(from)}–${day(to)}`;
  const lines: InvoiceLineInput[] = employees.map((employee) => ({
    description: `${employee.employeeName} — ${employee.hours} h on ${project.name} (${period})`,
    quantity: employee.hours,
    rate: employee.rate,
    taxPercent: branding.defaultTaxPercent,
  }));

  const issuedDate = new Date();
  const created = await InvoiceModel.create({
    number,
    clientId: String(client._id),
    clientName: client.name,
    lines,
    amount: linesTotal(lines),
    currency: billing.currency,
    status: 'DRAFT',
    issuedDate,
    dueDate: new Date(issuedDate.getTime() + DUE_IN_DAYS * DAY_MS),
    placeOfSupplyStateCode: client.stateCode ?? '',
    supplierStateCode: branding.stateCode,
    projectId,
    periodFrom: from,
    periodTo: to,
  });
  return created.toObject();
}

export const createInvoiceFromTimeLog = async (
  _p: unknown,
  { projectId, from, to }: { projectId: string; from: Date; to: Date },
  ctx: GraphQLContext,
) => {
  assertRole(ctx, INVOICING_ROLES);
  return withId(await buildInvoiceFromTimeLog(projectId, from, to));
};
