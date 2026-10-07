import {
  AuditLogModel,
  auditResolvers,
  listAuditLogsPaged,
  listAuditLogsStats,
} from '../../src/modules/audit';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

describe('reading the log', () => {
  beforeEach(async () => {
    await AuditLogModel.create([
      { action: 'CREATE', module: 'Invoice', summary: 'Created invoice' },
      { action: 'UPDATE', module: 'Invoice', summary: 'Updated invoice' },
      { action: 'DELETE', module: 'Lead', summary: 'Deleted lead' },
    ]);
  });

  it('confines a page and its counts to the scope it is given', async () => {
    const page = await listAuditLogsPaged({ page: 0, pageSize: 10 }, { module: 'Invoice' });
    const stats = await listAuditLogsStats({ module: 'Invoice' });

    expect(page.totalCount).toBe(2);
    expect(stats.total).toBe(2);
  });

  it('reads the whole log when no scope is given', async () => {
    expect((await listAuditLogsPaged({ page: 0, pageSize: 10 })).totalCount).toBe(3);
    expect((await listAuditLogsStats()).total).toBe(3);
  });

  it('is closed to anybody but an administrator', async () => {
    const hr: GraphQLContext = { user: { id: 'u1', roles: [ROLES.HR], email: 'hr@exyconn.com' } };
    const input = { page: 0, pageSize: 10 };

    await expect(auditResolvers.Query.listAuditLogsPaged(null, { input }, hr)).rejects.toThrow(
      'You do not have access to this resource',
    );
    await expect(auditResolvers.Query.listAuditLogsStats(null, {}, hr)).rejects.toThrow(
      'You do not have access to this resource',
    );
  });

  it('gives each row an id for the grid', async () => {
    const admin: GraphQLContext = {
      user: { id: 'u1', roles: [ROLES.ADMIN], email: 'a@exyconn.com' },
    };

    const page = await auditResolvers.Query.listAuditLogsPaged(
      null,
      { input: { page: 0, pageSize: 10 } },
      admin,
    );

    expect(page.totalCount).toBe(3);
    expect(page.rows.every((row) => typeof row.id === 'string')).toBe(true);
  });
});
