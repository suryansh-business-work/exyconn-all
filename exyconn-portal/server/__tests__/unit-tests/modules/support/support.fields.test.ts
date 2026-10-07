import {
  supportReplyFields,
  supportTicketFields,
} from '../../../../src/modules/support/support.fields';

const HOUR = 60 * 60 * 1000;

describe('supportTicketFields', () => {
  it('defaults every field a pre-desk ticket was stored without', () => {
    const legacy = { createdAt: new Date() };

    expect(supportTicketFields.requesterType(legacy)).toBe('EMPLOYEE');
    expect(supportTicketFields.channel(legacy)).toBe('PORTAL');
    expect(supportTicketFields.reference(legacy)).toBe('');
    expect(supportTicketFields.clientId(legacy)).toBe('');
    expect(supportTicketFields.clientName(legacy)).toBe('');
    expect(supportTicketFields.requesterName(legacy)).toBe('');
    expect(supportTicketFields.requesterEmail(legacy)).toBe('');
    expect(supportTicketFields.attachments(legacy)).toEqual([]);
    expect(supportTicketFields.topic(legacy)).toBe('');
    expect(supportTicketFields.escalationLevel(legacy)).toBe(0);
  });

  it('passes stored values through untouched', () => {
    const attachments = [
      {
        url: 'https://cdn.test/a.png',
        name: 'a.png',
        contentType: 'image/png',
        uploadedBy: 'Dana',
      },
    ];
    const row = {
      createdAt: new Date(),
      requesterType: 'CLIENT',
      channel: 'EMAIL',
      reference: 'EXY-ABC234',
      clientId: 'client-9',
      clientName: 'Acme Ltd',
      requesterName: 'Dana Reyes',
      requesterEmail: 'dana@acme.test',
      attachments,
      topic: 'VPN',
      escalationLevel: 2,
    } as unknown as Parameters<typeof supportTicketFields.attachments>[0];

    expect(supportTicketFields.requesterType(row)).toBe('CLIENT');
    expect(supportTicketFields.channel(row)).toBe('EMAIL');
    expect(supportTicketFields.reference(row)).toBe('EXY-ABC234');
    expect(supportTicketFields.clientId(row)).toBe('client-9');
    expect(supportTicketFields.clientName(row)).toBe('Acme Ltd');
    expect(supportTicketFields.requesterName(row)).toBe('Dana Reyes');
    expect(supportTicketFields.requesterEmail(row)).toBe('dana@acme.test');
    expect(supportTicketFields.attachments(row)).toBe(attachments);
    expect(supportTicketFields.topic(row)).toBe('VPN');
    expect(supportTicketFields.escalationLevel(row)).toBe(2);
  });

  it('derives the SLA state from the clock rather than a stored value', () => {
    const createdAt = new Date(Date.now() - 2 * HOUR);

    expect(
      supportTicketFields.slaState({ createdAt, dueAt: new Date(Date.now() + 6 * HOUR) }),
    ).toBe('ON_TRACK');
    expect(supportTicketFields.slaState({ createdAt, dueAt: new Date(Date.now() - HOUR) })).toBe(
      'BREACHED',
    );
  });
});

describe('supportReplyFields', () => {
  it('reads a reply stored before files existed as having none', () => {
    expect(supportReplyFields.attachments({})).toEqual([]);
    expect(supportReplyFields.attachments({ attachments: null })).toEqual([]);
  });
});
