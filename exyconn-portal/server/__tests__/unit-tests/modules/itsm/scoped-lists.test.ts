import { AnnouncementModel } from '../../../../src/modules/announcements/announcement.model';
import { PolicyModel } from '../../../../src/modules/legal/policy.model';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { ctxFor, firstPage, itQuery as q } from './itsm.fixtures';

type Page = { rows: Array<{ id: string; title: string }>; totalCount: number };

const titles = (page: Page) => page.rows.map((row) => row.title).sort((a, b) => a.localeCompare(b));

describe("IT's slices of announcements and policies", () => {
  useTestOrganization();
  const admin = ctxFor('admin-1', [ROLES.ADMIN]);

  it('shows only maintenance, outage and security announcements, with ids', async () => {
    await AnnouncementModel.create([
      { title: 'Patch night', body: 'b', category: 'MAINTENANCE' },
      { title: 'Email down', body: 'b', category: 'OUTAGE' },
      { title: 'Town hall', body: 'b', category: 'EVENT' },
    ]);

    const page = (await q.listItAnnouncementsPaged(null, firstPage, admin)) as Page;

    expect(page.totalCount).toBe(2);
    expect(titles(page)).toEqual(['Email down', 'Patch night']);
    expect(page.rows.every((row) => typeof row.id === 'string')).toBe(true);
  });

  it('shows only IT and security policies', async () => {
    const policy = (slug: string, category: string) => ({
      title: slug,
      slug,
      body: '<p>Rules</p>',
      category,
      effectiveDate: new Date(),
    });
    await PolicyModel.create([
      policy('byod', 'IT'),
      policy('passwords', 'SECURITY'),
      policy('leave', 'HR'),
    ]);

    const page = (await q.listItPoliciesPaged(null, firstPage, admin)) as Page;

    expect(page.totalCount).toBe(2);
    expect(titles(page)).toEqual(['byod', 'passwords']);
  });

  it('lets HR read the announcement slice and legal the policy slice, and nobody else', async () => {
    const hr = ctxFor('hr-1', [ROLES.HR]);
    const legal = ctxFor('legal-1', [ROLES.LEGAL]);
    const employee = ctxFor('emp-1', [ROLES.EMPLOYEE]);

    expect(await codeOf(q.listItAnnouncementsPaged(null, firstPage, hr))).toBe('OK');
    expect(await codeOf(q.listItPoliciesPaged(null, firstPage, legal))).toBe('OK');
    expect(await codeOf(q.listItAnnouncementsPaged(null, firstPage, employee))).toBe('FORBIDDEN');
    expect(await codeOf(q.listItPoliciesPaged(null, firstPage, employee))).toBe('FORBIDDEN');
  });
});
