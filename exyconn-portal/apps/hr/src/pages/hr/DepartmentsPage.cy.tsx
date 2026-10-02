import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router-dom';
import type { DocumentNode } from 'graphql';
import { ThemeProvider } from '@exyconn/shell/components/ui/styles';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ConfirmProvider } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { theme } from '@exyconn/shell/config/theme';
import {
  CreatePositionDocument,
  ListDepartmentsDocument,
  ListEmployeeOptionsDocument,
  ListEmploymentTypesDocument,
  ListGradesDocument,
  UpdateDepartmentDocument,
  UpdatePositionDocument,
} from '@exyconn/shell/graphql/generated';
import { DepartmentsPage } from './DepartmentsPage';

const position = {
  __typename: 'Position' as const,
  id: 'p1',
  name: 'Engineer',
  department: 'Engineering',
  code: null,
  description: null,
  minSalary: 100,
  maxSalary: 200,
  grade: null,
  employmentType: null,
  headcount: 2,
  filled: 1,
  active: true,
};

/** Answers every call of `query`, whatever its variables. */
const answer = (query: DocumentNode, data: object) => ({
  request: { query, variables: () => true },
  result: { data },
  maxUsageCount: 10,
});

const mocks = [
  answer(ListDepartmentsDocument, {
    listDepartments: [
      {
        __typename: 'Department',
        id: 'd1',
        name: 'Engineering',
        code: null,
        description: null,
        headId: null,
        headName: null,
        positions: [position],
      },
    ],
  }),
  answer(ListEmployeeOptionsDocument, { listEmployeeOptions: [] }),
  answer(ListGradesDocument, { listGrades: [] }),
  answer(ListEmploymentTypesDocument, { listEmploymentTypes: [] }),
  answer(UpdateDepartmentDocument, { updateDepartment: { __typename: 'Department', id: 'd1' } }),
  answer(CreatePositionDocument, { createPosition: { __typename: 'Position', id: 'p2' } }),
  answer(UpdatePositionDocument, { updatePosition: { __typename: 'Position', id: 'p1' } }),
];

const mount = () => {
  cy.mount(
    <MemoryRouter>
      <MockedProvider mocks={mocks}>
        <ThemeProvider theme={theme}>
          <NotificationProvider>
            <ConfirmProvider>
              <DepartmentsPage />
            </ConfirmProvider>
          </NotificationProvider>
        </ThemeProvider>
      </MockedProvider>
    </MemoryRouter>,
  );
  cy.contains('Engineering').click();
};

describe('DepartmentsPage', () => {
  it('edits a department and keeps the form open until it is saved', () => {
    mount();
    cy.contains('button', 'Edit department').click();
    cy.contains('h1', 'Edit department').should('be.visible');
    cy.get('input[name="name"]').should('have.value', 'Engineering');
    cy.contains('button', 'Update').click();
    cy.contains('Department updated').should('be.visible');
  });

  it('adds a position to the department, not a new department', () => {
    mount();
    cy.contains('button', 'Add position').click();
    cy.contains('h1', 'New position').should('be.visible');
    cy.contains('h1', 'New department').should('not.exist');
    cy.get('input[name="name"]').type('Designer');
    cy.contains('button', 'Create').click();
    cy.contains('Position created').should('be.visible');
  });

  it('edits a position', () => {
    mount();
    cy.get('[aria-label="edit"]').first().click();
    cy.contains('h1', 'Edit position').should('be.visible');
    cy.get('input[name="name"]').should('have.value', 'Engineer');
    cy.contains('button', 'Update').click();
    cy.contains('Position updated').should('be.visible');
  });
});
