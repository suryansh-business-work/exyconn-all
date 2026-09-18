import { describe, expect, it } from 'vitest';
import { leaveTypeOptions } from '../../src/utils/leaveTypeOptions';

describe('leaveTypeOptions', () => {
  it("offers HR's leave types by name, keeping the code as the stored value", () => {
    expect(
      leaveTypeOptions([
        { code: 'CL', name: 'Casual Leave' },
        { code: 'BL', name: 'Bereavement' },
      ]),
    ).toEqual([
      { value: 'CL', label: 'Casual Leave (CL)' },
      { value: 'BL', label: 'Bereavement (BL)' },
    ]);
  });
});
