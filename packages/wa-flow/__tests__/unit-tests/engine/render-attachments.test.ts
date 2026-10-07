import { describe, expect, it } from 'vitest';
import { render } from './render-fixtures';

describe('renderNode — attachments', () => {
  it('renders images keeping icon names verbatim', () => {
    expect(
      render({
        id: 'i',
        type: 'image',
        data: { image: { icon: 'gift', accent: 'pink', title: 'For {{name}}' }, caption: 'Look' },
      }),
    ).toEqual([
      {
        type: 'image',
        image: { icon: 'gift', accent: 'pink', title: '~For Asha' },
        caption: '~Look',
      },
    ]);
  });

  it('deep-fills documents, keeping numbers, kinds and file data untranslated', () => {
    const [doc] = render({
      id: 'd',
      type: 'document',
      data: {
        document: {
          fileName: '{{name}}-report.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 120,
          preview: {
            title: 'Report',
            sections: [
              { kind: 'fields', fields: [{ label: 'Name', value: '{{name}}' }] },
              {
                kind: 'table',
                columns: ['Test'],
                rows: [{ id: 'r1', cells: ['Hb'], flag: 'low' }],
              },
            ],
          },
        },
      },
    });
    expect(doc).toEqual({
      type: 'document',
      caption: undefined,
      document: {
        fileName: 'Asha-report.pdf',
        fileType: 'PDF',
        pages: 2,
        sizeKb: 120,
        preview: {
          title: '~Report',
          sections: [
            { kind: 'fields', fields: [{ label: '~Name', value: '~Asha' }] },
            {
              kind: 'table',
              columns: ['~Test'],
              rows: [{ id: 'r1', cells: ['~Hb'], flag: 'low' }],
            },
          ],
        },
      },
    });
  });

  it('renders locations, contacts and tickets', () => {
    const [loc] = render({
      id: 'l',
      type: 'location',
      data: { location: { name: 'HQ', address: 'Road', lat: 12.9, lng: 77.6 }, caption: 'Here' },
    });
    expect(loc).toEqual({
      type: 'location',
      location: { name: '~HQ', address: '~Road', lat: 12.9, lng: 77.6 },
      caption: '~Here',
    });
    const [contact] = render({
      id: 'c',
      type: 'contact',
      data: { contact: { name: 'Desk', phone: '+91 90000 00000' } },
    });
    expect(contact).toEqual({
      type: 'contact',
      contact: { name: '~Desk', phone: '+91 90000 00000' },
    });
    const [ticket] = render(
      {
        id: 't',
        type: 'ticket',
        data: {
          ticket: { ticketId: '{{id}}', title: 'Pass', fields: [], qrData: 'QR-{{id}}' },
        },
      },
      { id: 'TK-1' },
    );
    expect(ticket).toEqual({
      type: 'ticket',
      ticket: { ticketId: 'TK-1', title: '~Pass', fields: [], qrData: 'QR-TK-1' },
      caption: undefined,
    });
  });
});
