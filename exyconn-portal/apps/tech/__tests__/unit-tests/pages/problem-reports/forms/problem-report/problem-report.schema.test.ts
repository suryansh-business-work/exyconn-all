import { describe, expect, it } from 'vitest';
import {
  isFinished,
  problemReportSchema,
  toProblemReportInput,
  toProblemReportValues,
} from '../../../../../../src/pages/problem-reports/forms/problem-report';
import { reportRow } from '../../report.fixtures';

const valid = () => toProblemReportValues(reportRow());

function messages(values: object): string[] {
  const result = problemReportSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('problemReportSchema', () => {
  it('accepts a complete report', () => {
    expect(problemReportSchema.safeParse(valid()).success).toBe(true);
  });

  it('demands a title, a real description and a reporter', () => {
    const found = messages({
      ...valid(),
      subject: '  ab ',
      description: 'Too slow',
      reporterName: 'A',
      reporterEmail: '',
    });

    expect(found).toEqual(
      expect.arrayContaining([
        'Title is required',
        'Describe the problem — at least 20 characters',
        'Reporter name is required',
        'Email is required',
      ]),
    );
  });

  it('caps the lengths of what people write', () => {
    expect(
      messages({
        ...valid(),
        subject: 'x'.repeat(121),
        description: 'x'.repeat(4001),
        reporterName: 'x'.repeat(81),
        assignee: 'x'.repeat(81),
        resolutionNotes: 'x'.repeat(4001),
      }),
    ).toEqual([
      'Keep the title under 120 characters',
      'Keep the description under 4000 characters',
      'Name is too long',
      'Keep the assignee under 80 characters',
      'Keep the notes under 4000 characters',
    ]);
  });

  it('checks the reporter’s email and the page address', () => {
    expect(messages({ ...valid(), reporterEmail: 'not-an-email' })).toEqual([
      'Enter a valid email',
    ]);
    expect(messages({ ...valid(), pageUrl: 'portal/hr' })).toContain(
      'Enter a full URL starting with https://',
    );
    expect(messages({ ...valid(), pageUrl: '' })).toEqual([]);
  });

  it('refuses to resolve or close a report with nothing written down', () => {
    for (const status of ['RESOLVED', 'CLOSED']) {
      const result = problemReportSchema.safeParse({ ...valid(), status, resolutionNotes: '   ' });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]).toMatchObject({
        message: 'Say what was done before resolving or closing',
        path: ['resolutionNotes'],
      });
    }
    expect(messages({ ...valid(), status: 'CLOSED', resolutionNotes: 'Cache cleared' })).toEqual(
      [],
    );
  });

  it('rejects a value that is not one of the server’s enums', () => {
    expect(problemReportSchema.safeParse({ ...valid(), severity: 'URGENT' }).success).toBe(false);
  });
});

describe('isFinished', () => {
  it('is true only for resolved and closed reports', () => {
    expect(isFinished('RESOLVED')).toBe(true);
    expect(isFinished('CLOSED')).toBe(true);
    expect(isFinished('NEW')).toBe(false);
    expect(isFinished('IN_PROGRESS')).toBe(false);
  });
});

describe('toProblemReportInput', () => {
  it('names the service from its key', () => {
    const input = toProblemReportInput(valid(), (key) => `name of ${key}`);

    expect(input).toEqual({ ...valid(), serviceName: 'name of portal' });
  });

  it('sends no service name for a whole-platform report', () => {
    const input = toProblemReportInput({ ...valid(), serviceKey: '' }, () => 'unused');

    expect(input.serviceName).toBe('');
  });
});

describe('toProblemReportValues', () => {
  it('starts a new report as a new, medium-severity outage', () => {
    expect(toProblemReportValues(null)).toEqual({
      serviceKey: '',
      category: 'OUTAGE',
      severity: 'MEDIUM',
      status: 'NEW',
      subject: '',
      description: '',
      reporterName: '',
      reporterEmail: '',
      pageUrl: '',
      assignee: '',
      resolutionNotes: '',
    });
  });

  it('copies a stored report’s editable fields and nothing else', () => {
    const values = toProblemReportValues(reportRow({ resolutionNotes: 'Investigating' }));

    expect(values).toMatchObject({
      serviceKey: 'portal',
      category: 'SLOWNESS',
      severity: 'HIGH',
      status: 'TRIAGED',
      assignee: 'Ravi',
      resolutionNotes: 'Investigating',
    });
    expect(values).not.toHaveProperty('id');
    expect(values).not.toHaveProperty('reference');
  });
});
