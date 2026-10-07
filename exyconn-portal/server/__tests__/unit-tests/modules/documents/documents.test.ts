import {
  EmployeeDocumentModel,
  documentsResolvers,
  documentsTypeDefs,
  ensurePayslipDocument,
} from '../../../../src/modules/documents';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = documentsResolvers.Query as unknown as Record<string, Resolve>;
const M = documentsResolvers.Mutation as unknown as Record<string, Resolve>;

const ME = '65b000000000000000000011';
const OTHER = '65b000000000000000000012';
const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@example.com`, roles },
});

const file = (employeeId: string, title: string, issuedOn: string, kind = 'POLICY') =>
  EmployeeDocumentModel.create({
    employeeId,
    kind,
    title,
    url: 'https://files.example.com/doc.pdf',
    issuedOn: new Date(issuedOn),
  });

describe('ensurePayslipDocument', () => {
  it('files a payslip under the employee’s documents, linked to the payslip', async () => {
    await ensurePayslipDocument(ME, 'slip-1', 'Payslip — August 2026', new Date('2026-08-31'));

    const rows = await EmployeeDocumentModel.find({ employeeId: ME }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: 'SALARY_SLIP',
      title: 'Payslip — August 2026',
      url: '/me/salary-slips',
      salarySlipId: 'slip-1',
    });
  });

  it('updates the same row when the month is recomputed instead of filing a copy', async () => {
    await ensurePayslipDocument(ME, 'slip-1', 'Payslip — August', new Date('2026-08-31'));
    await ensurePayslipDocument(ME, 'slip-1', 'Payslip — August (revised)', new Date('2026-09-01'));
    await ensurePayslipDocument(ME, 'slip-2', 'Payslip — September', new Date('2026-09-30'));

    const rows = await EmployeeDocumentModel.find({ employeeId: ME }).sort({ issuedOn: 1 }).lean();
    expect(rows.map((row) => [row.salarySlipId, row.title])).toEqual([
      ['slip-1', 'Payslip — August (revised)'],
      ['slip-2', 'Payslip — September'],
    ]);
  });
});

describe('myDocuments', () => {
  it('lists only the signed-in employee’s documents, newest first', async () => {
    await file(ME, 'Policy', '2026-01-01');
    await file(ME, 'Offer letter', '2026-03-01', 'OFFER_LETTER');
    await file(OTHER, 'Not mine', '2026-02-01');

    const rows = (await Q.myDocuments(null, {}, as(ME, [ROLES.EMPLOYEE]))) as Array<{
      id: string;
      title: string;
    }>;

    expect(rows.map((row) => row.title)).toEqual(['Offer letter', 'Policy']);
    expect(rows[0].id).toMatch(/^[a-f\d]{24}$/);
  });

  it('refuses a caller who is not signed in', async () => {
    await expect(Q.myDocuments(null, {}, { user: null })).rejects.toThrow(
      'Authentication required',
    );
  });
});

describe('HR document management', () => {
  it('lets HR create and search documents, and keeps an employee out', async () => {
    const admin = as(OTHER, [ROLES.ADMIN]);
    const created = (await M.createEmployeeDocument(
      null,
      {
        input: {
          employeeId: ME,
          kind: 'TAX',
          title: 'Form 16',
          url: 'https://files.example.com/f16.pdf',
          issuedOn: new Date('2026-06-15'),
        },
      },
      admin,
    )) as { id: string; kind: string };
    expect(created.kind).toBe('TAX');

    const page = (await Q.listEmployeeDocumentsPaged(
      null,
      { input: { page: 0, pageSize: 10, search: 'form' } },
      admin,
    )) as { rows: Array<{ id: string }>; totalCount: number };
    expect(page.totalCount).toBe(1);
    expect(page.rows[0].id).toBe(created.id);

    await expect(Q.listEmployeeDocuments(null, {}, as(ME, [ROLES.EMPLOYEE]))).rejects.toThrow(
      'You do not have access to this resource',
    );
  });

  it('declares the self-service query in the schema', () => {
    const source = documentsTypeDefs.loc?.source.body ?? '';
    expect(source).toContain('myDocuments: [EmployeeDocument!]!');
  });
});
