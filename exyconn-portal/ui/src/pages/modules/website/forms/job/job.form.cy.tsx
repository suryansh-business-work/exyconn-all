import { MockedProvider, type MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from '@/components/ui/styles';
import { JobForm } from './job.form';
import { CreateJobDocument, ListJobCompaniesDocument } from '../../../../../graphql/generated';
import { NotificationProvider } from '../../../../../components/feedback/NotificationProvider';
import { theme } from '../../../../../config/theme';

const COMPANY = {
  id: 'company-1',
  companyCode: 'EXY',
  slug: 'exyconn',
  name: 'Exyconn',
  logo: '',
  tagline: '',
  description: '',
  culture: '',
  website: '',
  founded: '',
  employees: '',
  industry: 'Software',
  headquarters: '',
  brandColor: '',
  secondaryColor: '',
  isActive: true,
  order: 0,
  benefits: [],
  socialLinks: { linkedin: '', twitter: '', facebook: '', instagram: '' },
};

const NEW_JOB = {
  jobCode: 'ENG-001',
  title: 'Frontend Engineer',
  category: 'Engineering',
  jobType: 'Full Time',
  experienceLevel: 'Senior',
  workMode: 'Remote',
};

/** Feeds the dynamic company select inside JobDetailsFields. */
const companiesMock: MockedResponse = {
  request: { query: ListJobCompaniesDocument },
  result: { data: { listJobCompanies: [COMPANY] } },
};

/** Exactly what JobForm submits when only the required fields are filled in. */
const createMock: MockedResponse = {
  request: {
    query: CreateJobDocument,
    variables: {
      input: {
        jobCode: NEW_JOB.jobCode,
        companySlug: COMPANY.slug,
        title: NEW_JOB.title,
        category: NEW_JOB.category,
        skillSet: [],
        shortJobDescription: '',
        jobDescription: '',
        jobResponsibilities: '',
        requirements: [],
        niceToHave: [],
        benefits: [],
        location: '',
        jobType: NEW_JOB.jobType,
        experienceLevel: NEW_JOB.experienceLevel,
        workMode: NEW_JOB.workMode,
        salaryRange: '',
        jobPostDate: null,
        applicationDeadline: null,
        isActive: true,
        isFeatured: false,
      },
    },
  },
  result: { data: { createJob: { id: 'job-1' } } },
};

const mount = (mocks: MockedResponse[]) =>
  cy.mount(
    <MockedProvider mocks={mocks} addTypename={false}>
      <ThemeProvider theme={theme}>
        <NotificationProvider>
          <JobForm initial={null} onDone={cy.stub().as('done')} onCancel={cy.stub().as('cancel')} />
        </NotificationProvider>
      </ThemeProvider>
    </MockedProvider>,
  );

/** Opens the MUI select bound to `name` and picks `option` from its listbox. */
const chooseOption = (name: string, option: string) => {
  cy.get(`input[name="${name}"]`).parent().find('[role="combobox"]').click();
  cy.get('ul[role="listbox"]').contains('li', option).click();
};

describe('JobForm', () => {
  it('validates the required job code, company, title, category and placement', () => {
    mount([companiesMock]);
    cy.contains('button', 'Create').click();
    cy.contains('Job code is required').should('be.visible');
    cy.contains('Company is required').should('be.visible');
    cy.contains('Title is required').should('be.visible');
    cy.contains('Category is required').should('be.visible');
    cy.contains('Job type is required').should('be.visible');
    cy.contains('Experience level is required').should('be.visible');
    cy.contains('Work mode is required').should('be.visible');
    cy.get('@done').should('not.have.been.called');
  });

  it('lists the companies returned by listJobCompanies', () => {
    mount([companiesMock]);
    cy.get('input[name="companySlug"]').parent().find('[role="combobox"]').click();
    cy.get('ul[role="listbox"]').contains('li', COMPANY.name).should('be.visible');
  });

  it('submits a new job and calls onDone', () => {
    mount([companiesMock, createMock]);
    cy.get('input[name="jobCode"]').type(NEW_JOB.jobCode);
    chooseOption('companySlug', COMPANY.name);
    cy.get('input[name="title"]').type(NEW_JOB.title);
    chooseOption('category', NEW_JOB.category);
    chooseOption('jobType', NEW_JOB.jobType);
    chooseOption('experienceLevel', NEW_JOB.experienceLevel);
    chooseOption('workMode', NEW_JOB.workMode);
    cy.contains('button', 'Create').click();
    cy.contains('Job created').should('be.visible');
    cy.get('@done').should('have.been.called');
  });

  it('invokes onCancel when Cancel is clicked', () => {
    mount([companiesMock]);
    cy.contains('button', 'Cancel').click();
    cy.get('@cancel').should('have.been.called');
  });
});
