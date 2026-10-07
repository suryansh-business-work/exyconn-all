import { print } from 'graphql';
import {
  APPLICANT_SOURCES,
  APPLICANT_STAGES,
  ApplicantModel,
  NOTIFIED_STAGES,
  recruitingResolvers,
  recruitingTypeDefs,
} from '../../../../src/modules/recruiting';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

jest.mock('../../../../src/modules/email', () => ({ emailer: { send: jest.fn() } }));

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', roles, email: 'hr@exyconn.com' },
});

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<Record<string, unknown>>;
const mutation = recruitingResolvers.Mutation as unknown as Record<string, Resolver>;

const input = {
  jobCode: 'ENG-7',
  jobTitle: 'Platform Engineer',
  name: 'Ravi Kumar',
  email: 'Ravi@Example.com',
  phone: '',
  resumeUrl: '',
  coverLetter: '',
  source: 'REFERRAL',
  rating: 4,
};

describe('applicant resolvers', () => {
  it('lets HR add a referral, which starts at the beginning of the pipeline', async () => {
    const created = await mutation.createApplicant(null, { input }, as([ROLES.HR]));

    expect(created).toMatchObject({ name: 'Ravi Kumar', email: 'ravi@example.com', stage: 'NEW' });
    expect(created.rating).toBe(4);
  });

  it('moves an applicant with no note given', async () => {
    const applicant = await ApplicantModel.create({ name: 'Ravi', email: 'ravi@example.com' });

    const moved = await recruitingResolvers.Mutation.setApplicantStage(
      null,
      { id: String(applicant._id), stage: 'SCREENING' },
      as([ROLES.HR]),
    );

    expect(moved).toMatchObject({ id: String(applicant._id), stage: 'SCREENING' });
    expect(moved.notes).toMatch(/Screening by hr@exyconn\.com$/);
  });

  it('keeps applicants away from anybody outside HR', async () => {
    expect(await codeOf(mutation.createApplicant(null, { input }, as([ROLES.PROJECTS])))).toBe(
      'FORBIDDEN',
    );
    expect(await ApplicantModel.countDocuments()).toBe(0);
  });
});

describe('the recruiting module surface', () => {
  it('lists the pipeline in order and emails only on the decisions that matter', () => {
    expect(APPLICANT_STAGES[0]).toBe('NEW');
    expect(APPLICANT_SOURCES).toContain('WEBSITE');
    expect([...NOTIFIED_STAGES].sort((a, b) => a.localeCompare(b))).toEqual([
      'INTERVIEW',
      'OFFER',
      'REJECTED',
    ]);
  });

  it('exposes the pipeline move in the schema', () => {
    expect(print(recruitingTypeDefs)).toContain('setApplicantStage(');
  });
});
