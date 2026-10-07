import { describe, expect, it } from 'vitest';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { CONVERT_ACTION, SUBMISSION_COLUMNS } from '../../../../src/pages/website/submissions-grid';
import { actionSpecs, cellText, columnIds } from '../cms/cms-grid-helpers';
import { submissionRow } from './content-fixtures';

describe('SUBMISSION_COLUMNS', () => {
  it('lays out the inbox with convert, edit and delete actions', () => {
    expect(columnIds(SUBMISSION_COLUMNS)).toEqual([
      'formType',
      'from',
      'summary',
      'source',
      'status',
      'filedAs',
      'createdAt',
      'actions',
    ]);
    expect(actionSpecs(SUBMISSION_COLUMNS)).toEqual([
      CONVERT_ACTION,
      expect.objectContaining({ key: 'edit' }),
      expect.objectContaining({ key: 'delete' }),
    ]);
    expect(CONVERT_ACTION).toEqual({
      key: 'convert',
      label: 'convert to lead',
      icon: PersonAddIcon,
      color: 'primary',
    });
  });

  it('reads who sent it and what about from the payload', () => {
    const row = submissionRow();

    expect(cellText(SUBMISSION_COLUMNS, 'from', row)).toBe('Asha <asha@example.com>');
    expect(cellText(SUBMISSION_COLUMNS, 'summary', row)).toBe('Pricing');
  });

  it('falls back to a dash for an empty payload', () => {
    const row = submissionRow({ submissionData: null });

    expect(cellText(SUBMISSION_COLUMNS, 'from', row)).toBe('—');
    expect(cellText(SUBMISSION_COLUMNS, 'summary', row)).toBe('—');
  });

  it('says whether the enquiry was filed as a lead, an applicant or not at all', () => {
    expect(cellText(SUBMISSION_COLUMNS, 'filedAs', submissionRow({ leadId: 'lead-1' }))).toBe(
      'Lead',
    );
    expect(
      cellText(SUBMISSION_COLUMNS, 'filedAs', submissionRow({ applicantId: 'applicant-1' })),
    ).toBe('Applicant');
    expect(cellText(SUBMISSION_COLUMNS, 'filedAs', submissionRow())).toBe('—');
  });

  it('writes nothing for a row that has not loaded', () => {
    expect(cellText(SUBMISSION_COLUMNS, 'filedAs', undefined)).toBe('');
  });
});
