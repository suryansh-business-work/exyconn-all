import { Kind, type DocumentNode } from 'graphql';
import { Types } from 'mongoose';
import { orgMasterResolvers, orgMasterTypeDefs } from '../../../../src/modules/orgmaster';
import { LocationModel } from '../../../../src/modules/orgmaster/orgmaster.models';
import { ROLES, type Role } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import type { GraphQLContext } from '../../../../src/middleware/auth';

useTestOrganization();

type Resolve = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
type Row = Record<string, unknown> & { id: string };
const Q = orgMasterResolvers.Query as Record<string, Resolve>;
const M = orgMasterResolvers.Mutation as Record<string, Resolve>;

const ctxAs = (...roles: Role[]): GraphQLContext => ({
  user: { id: new Types.ObjectId().toHexString(), email: 'people@test.example', roles },
  ip: '192.0.2.10',
});
const hr = ctxAs(ROLES.HR);

/** The fields an `extend type <name>` block of the module's SDL declares. */
function declaredFields(doc: DocumentNode, typeName: string): string[] {
  return doc.definitions.flatMap((definition) => {
    if (definition.kind !== Kind.OBJECT_TYPE_EXTENSION || definition.name.value !== typeName) {
      return [];
    }
    return (definition.fields ?? []).map((field) => field.name.value);
  });
}

const sorted = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b));

const location = (code: string, city: string) => ({
  name: `${city} office`,
  code,
  city,
});

describe('orgmaster resolvers', () => {
  it('answer every query and mutation the schema declares, and nothing more', () => {
    expect(sorted(Object.keys(Q))).toEqual(sorted(declaredFields(orgMasterTypeDefs, 'Query')));
    expect(sorted(Object.keys(M))).toEqual(sorted(declaredFields(orgMasterTypeDefs, 'Mutation')));
  });

  it('keep master data to HR: an employee and an anonymous caller are refused', async () => {
    await expect(Q.listShifts(null, {}, ctxAs(ROLES.EMPLOYEE))).rejects.toThrow(
      /do not have access/,
    );
    await expect(Q.listShifts(null, {}, { user: null })).rejects.toThrow(/Authentication required/);
  });
});

describe('locations', () => {
  it('store the code upper-cased with the house defaults, and list with ids', async () => {
    const created = (await M.createLocation(
      null,
      { input: location('blr', 'Bengaluru') },
      hr,
    )) as Row;

    expect(created).toMatchObject({
      code: 'BLR',
      timezone: 'Asia/Kolkata',
      active: true,
      state: '',
      id: expect.any(String),
    });
    const rows = (await Q.listLocations(null, {}, hr)) as Row[];
    expect(rows.map((row) => row.id)).toEqual([created.id]);
  });

  it('refuse a second location with the same code', async () => {
    await LocationModel.init();
    await M.createLocation(null, { input: location('BLR', 'Bengaluru') }, hr);

    await expect(
      M.createLocation(null, { input: location('blr', 'Bangalore') }, hr),
    ).rejects.toThrow();
  });

  it('search a page by city and count how many are active', async () => {
    await M.createLocation(null, { input: location('BLR', 'Bengaluru') }, hr);
    await M.createLocation(null, { input: { ...location('PUN', 'Pune'), active: false } }, hr);

    const page = (await Q.listLocationsPaged(
      null,
      { input: { page: 0, pageSize: 10, search: 'pune' } },
      hr,
    )) as { rows: Row[]; totalCount: number };
    const stats = (await Q.listLocationsStats(null, {}, hr)) as {
      total: number;
      counts: Array<{ field: string; buckets: Array<{ value: string; count: number }> }>;
    };

    expect(page.totalCount).toBe(1);
    expect(page.rows[0]).toMatchObject({ code: 'PUN', id: expect.any(String) });
    expect(stats.total).toBe(2);
    expect(stats.counts[0].field).toBe('active');
    expect(sorted(stats.counts[0].buckets.map((b) => `${b.value}:${b.count}`))).toEqual([
      'false:1',
      'true:1',
    ]);
  });
});

describe('grades, teams, employment types and shifts', () => {
  it('update a grade, read it back, and delete it', async () => {
    const grade = (await M.createGrade(null, { input: { name: 'Senior', code: 'g3' } }, hr)) as Row;
    expect(grade).toMatchObject({ code: 'G3', level: 1, minSalary: 0, maxSalary: 0 });

    const updated = (await M.updateGrade(null, { id: grade.id, input: { level: 3 } }, hr)) as Row;
    expect(updated).toMatchObject({ id: grade.id, level: 3 });
    await expect(Q.getGrade(null, { id: grade.id }, hr)).resolves.toMatchObject({ level: 3 });

    await expect(M.deleteGrade(null, { id: grade.id }, hr)).resolves.toBe(true);
    await expect(Q.getGrade(null, { id: grade.id }, hr)).rejects.toThrow('Grade not found');
  });

  it('refuse a grade with a negative salary', async () => {
    await expect(
      M.createGrade(null, { input: { name: 'Broken', code: 'G0', minSalary: -1 } }, hr),
    ).rejects.toThrow(/minSalary/);
  });

  it('give a team, an employment type and a shift their defaults', async () => {
    const team = (await M.createTeam(null, { input: { name: 'Platform' } }, hr)) as Row;
    const type = (await M.createEmploymentType(
      null,
      { input: { name: 'Full time', code: 'ft' } },
      hr,
    )) as Row;
    const shift = (await M.createShift(null, { input: { name: 'Day', code: 'day' } }, hr)) as Row;

    expect(team).toMatchObject({ leadEmployeeId: null, department: '', active: true });
    expect(type).toMatchObject({ code: 'FT', payrollEligible: true, description: '' });
    expect(shift).toMatchObject({
      code: 'DAY',
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      graceMinutes: 15,
    });
    await expect(Q.getTeam(null, { id: team.id }, hr)).resolves.toMatchObject({ name: 'Platform' });
    await expect(Q.listEmploymentTypes(null, {}, hr)).resolves.toHaveLength(1);
    await expect(Q.listShifts(null, {}, hr)).resolves.toHaveLength(1);
  });
});
