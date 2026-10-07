import type { MockLink } from '@apollo/client/testing';
import {
  CreateUserDocument,
  EmployeeSalaryDocument,
  ListDepartmentsDocument,
  ListEmployeeOptionsDocument,
  ListPositionsDocument,
  SaveEmployeeSalaryDocument,
  UpdateUserDocument,
} from '@/graphql/generated';
import type { EmployeeSalary } from '@/components/pay';
import { makeSalary } from './userFixtures';

type Variables = Record<string, unknown>;

/** Records the variables of every call a mock answers, so a test can read what was sent. */
export function captured() {
  const calls: Variables[] = [];
  const match = (variables: Variables) => {
    calls.push(variables);
    return true;
  };
  return { calls, match };
}

function position(name: string, department: string) {
  return {
    __typename: 'Position',
    id: `${department}-${name}`,
    name,
    department,
    code: null,
    description: null,
    minSalary: 0,
    maxSalary: 0,
    grade: null,
    employmentType: null,
    headcount: 1,
    filled: 0,
    active: true,
  };
}

/** HR's departments, positions and the people a manager can be picked from. */
export function directoryMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: { query: ListDepartmentsDocument },
      result: {
        data: {
          listDepartments: ['People', 'Finance'].map((name) => ({
            __typename: 'Department',
            id: name,
            name,
            code: null,
            description: null,
            headId: null,
            headName: null,
            positions: [],
          })),
        },
      },
    },
    {
      request: { query: ListPositionsDocument },
      result: {
        data: {
          listPositions: [position('HR Partner', 'People'), position('Accountant', 'Finance')],
        },
      },
    },
    {
      request: { query: ListEmployeeOptionsDocument },
      result: {
        data: {
          listEmployeeOptions: [
            {
              __typename: 'EmployeeOption',
              id: 'emp-1',
              name: 'Meera Iyer',
              email: 'm@acme.test',
              designation: 'HR Partner',
              department: 'People',
            },
            {
              __typename: 'EmployeeOption',
              id: 'emp-2',
              name: 'Ravi Kumar',
              email: 'r@acme.test',
              designation: 'Head of People',
              department: 'People',
            },
            {
              __typename: 'EmployeeOption',
              id: 'emp-3',
              name: 'Sara Das',
              email: 's@acme.test',
              designation: null,
              department: null,
            },
          ],
        },
      },
    },
  ];
}

export function salaryQueryMock(salary: EmployeeSalary | null, delay = 0): MockLink.MockedResponse {
  return {
    request: { query: EmployeeSalaryDocument, variables: { employeeId: 'emp-1' } },
    result: { data: { employeeSalary: salary } },
    delay,
  };
}

export function saveSalaryMock(match: (variables: Variables) => boolean): MockLink.MockedResponse {
  return {
    request: { query: SaveEmployeeSalaryDocument, variables: match },
    result: { data: { saveEmployeeSalary: makeSalary() } },
  };
}

export function updateUserMock(
  match: (variables: Variables) => boolean,
  error?: Error,
): MockLink.MockedResponse {
  const request = { query: UpdateUserDocument, variables: match };
  if (error) return { request, error };
  return { request, result: { data: { updateUser: { __typename: 'User', id: 'emp-1' } } } };
}

/** A create that answers with the new account, or with nothing at all. */
export function createUserMock(
  match: (variables: Variables) => boolean,
  oneTimeSecret: string | null,
): MockLink.MockedResponse {
  const createUser = oneTimeSecret && {
    __typename: 'UserCredentials',
    password: oneTimeSecret,
    user: { __typename: 'User', id: 'emp-9', name: 'Kiran Rao', email: 'kiran@acme.test' },
  };
  return {
    request: { query: CreateUserDocument, variables: match },
    result: { data: { createUser: createUser || null } },
  };
}
