import { SupportTicketModel } from '../../../../src/modules/employee/support.model';
import { newReference } from '../../../../src/modules/status/reference';
import { uniqueReference } from '../../../../src/modules/support/ticket-reference';

jest.mock('../../../../src/modules/status/reference', () => ({
  newReference: jest.fn(),
}));

const draw = jest.mocked(newReference);

const fileWith = (reference: string) =>
  SupportTicketModel.create({
    employeeId: 'emp-1',
    reference,
    subject: 'Laptop will not boot',
    category: 'IT',
    description: 'It stops at the logo.',
  });

describe('uniqueReference', () => {
  it('keeps the first draw when nobody holds it', async () => {
    draw.mockReturnValueOnce('EXY-FREE22');

    await expect(uniqueReference()).resolves.toBe('EXY-FREE22');
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it('draws again when the reference is already on a ticket', async () => {
    await fileWith('EXY-TAKEN2');
    draw.mockReturnValueOnce('EXY-TAKEN2').mockReturnValueOnce('EXY-FRESH3');

    await expect(uniqueReference()).resolves.toBe('EXY-FRESH3');
    expect(draw).toHaveBeenCalledTimes(2);
  });

  it('accepts the last draw after five collisions rather than losing the ticket', async () => {
    await fileWith('EXY-TAKEN2');
    draw.mockReturnValue('EXY-TAKEN2');

    await expect(uniqueReference()).resolves.toBe('EXY-TAKEN2');
    expect(draw).toHaveBeenCalledTimes(5);
  });
});
