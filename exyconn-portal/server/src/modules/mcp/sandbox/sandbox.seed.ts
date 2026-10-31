import { randomBytes } from 'node:crypto';
import { ROLES } from '../../../constants/roles';
import { hashPassword } from '../../../utils/password';
import { UserModel } from '../../admin/user.model';
import { CompanyModel } from '../../crm/company.model';
import { ContactModel } from '../../crm/contact.model';
import { LeadModel } from '../../crm/crm.model';
import { DealModel } from '../../crm/deal.model';
import { DepartmentModel } from '../../hr/department.model';
import { PositionModel } from '../../hr/position.model';
import { BoardColumnModel, TaskModel } from '../../projects/board.model';
import { ProjectModel } from '../../projects/projects.model';
import {
  SANDBOX_COLUMNS,
  SANDBOX_COMPANIES,
  SANDBOX_CONTACTS,
  SANDBOX_DEALS,
  SANDBOX_DEPARTMENTS,
  SANDBOX_LEADS,
  SANDBOX_POSITIONS,
  SANDBOX_PROJECTS,
  SANDBOX_TEAM,
} from './sandbox.data';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Every invented address sits under this reserved top-level domain. */
const EXAMPLE_TLD = '.example';

const daysFromNow = (days: number) => new Date(Date.now() + days * DAY_MS);

/** "Liam O’Connor" -> "liam.oconnor". */
const localPart = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replaceAll(/[^a-z\s]/g, '')
    .trim()
    .replaceAll(/\s+/g, '.');

/** "Cedar Dental Group" -> "cedar-dental-group.example". */
const domainOf = (company: string) => `${localPart(company).replaceAll('.', '-')}${EXAMPLE_TLD}`;

type TeamName = (typeof SANDBOX_TEAM)[number]['name'];
type CompanyName = (typeof SANDBOX_COMPANIES)[number]['name'];
type ContactName = (typeof SANDBOX_CONTACTS)[number]['name'];
type ColumnName = (typeof SANDBOX_COLUMNS)[number];

/** The team as accounts that never sign in: nobody knows their passwords. */
async function seedTeam(teamDomain: string): Promise<Record<TeamName, string>> {
  const ids = {} as Record<TeamName, string>;
  for (const member of SANDBOX_TEAM) {
    const created = await UserModel.create({
      name: member.name,
      email: `${localPart(member.name)}@${teamDomain}`,
      passwordHash: await hashPassword(randomBytes(32).toString('base64url')),
      roles: [ROLES.EMPLOYEE],
      department: member.department,
      designation: member.designation,
      joinDate: new Date(member.joined),
    });
    ids[member.name] = String(created._id);
  }
  return ids;
}

async function seedHr(): Promise<void> {
  await DepartmentModel.create(SANDBOX_DEPARTMENTS.map((department) => ({ ...department })));
  await PositionModel.create(SANDBOX_POSITIONS.map((position) => ({ ...position })));
}

async function seedCrm(): Promise<void> {
  const companies = {} as Record<CompanyName, { id: string; domain: string }>;
  for (const company of SANDBOX_COMPANIES) {
    const created = await CompanyModel.create({ ...company });
    companies[company.name] = { id: String(created._id), domain: company.domain };
  }
  const contacts = {} as Record<ContactName, string>;
  for (const contact of SANDBOX_CONTACTS) {
    const company = companies[contact.company];
    const created = await ContactModel.create({
      name: contact.name,
      title: contact.title,
      email: `${localPart(contact.name)}@${company.domain}`,
      companyId: company.id,
      companyName: contact.company,
    });
    contacts[contact.name] = String(created._id);
  }
  await DealModel.create(
    SANDBOX_DEALS.map(({ company, contact, closeInDays, ...deal }) => ({
      ...deal,
      companyId: companies[company].id,
      companyName: company,
      contactId: contacts[contact],
      contactName: contact,
      expectedCloseDate: daysFromNow(closeInDays),
    })),
  );
  await LeadModel.create(
    SANDBOX_LEADS.map(({ company, ...lead }) => ({
      ...lead,
      email: `${localPart(lead.name)}@${domainOf(company)}`,
      notes: `Works at ${company}.`,
    })),
  );
}

async function seedProjects(team: Record<TeamName, string>): Promise<void> {
  for (const { tasks, client, startedDaysAgo, endsInDays, ...project } of SANDBOX_PROJECTS) {
    const created = await ProjectModel.create({
      ...project,
      clientName: client,
      startDate: daysFromNow(-startedDaysAgo),
      endDate: daysFromNow(endsInDays),
      ticketCounter: tasks.length,
    });
    const columns = {} as Record<ColumnName, unknown>;
    for (const [order, name] of SANDBOX_COLUMNS.entries()) {
      const column = await BoardColumnModel.create({
        projectId: created._id,
        name,
        order,
        isDone: order === SANDBOX_COLUMNS.length - 1,
      });
      columns[name] = column._id;
    }
    await TaskModel.create(
      tasks.map((task, index) => ({
        projectId: created._id,
        columnId: columns[task.column],
        key: `${project.key}-${index + 1}`,
        title: task.title,
        type: task.type,
        priority: task.priority,
        storyPoints: task.points,
        assigneeId: team[task.assignee],
        assigneeName: task.assignee,
        reporterName: SANDBOX_TEAM[0].name,
        order: index,
      })),
    );
  }
}

/**
 * Fills the sandbox company with its sample team, HR masters, CRM pipeline and project boards.
 * Runs once per company (the boot ledger), inside the sandbox company's own scope.
 */
export async function seedSandboxRecords(teamDomain: string): Promise<void> {
  const team = await seedTeam(teamDomain);
  await seedHr();
  await seedCrm();
  await seedProjects(team);
}
