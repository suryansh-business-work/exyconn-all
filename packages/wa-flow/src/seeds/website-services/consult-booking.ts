/**
 * What follows a confirmed consultation: the booking pass with a QR, the office pin for
 * in-person meetings, an add-to-calendar action and a "starts in 15 minutes" push.
 */
import type { AuthorNode } from '../../author';
import { AGENCY } from './data';

const CALENDAR = 'calendar';

export const bookingNodes: AuthorNode[] = [
  {
    id: 'pass',
    type: 'ticket',
    data: {
      complete: true,
      set: { consultId: '$id:NS', architect: '$pick:Ishaan Rao|Kavya Menon|Rohan Desai' },
      ticket: {
        ticketId: '{{consultId}}',
        title: 'Free consultation',
        subtitle: '{{topic}}',
        fields: [
          { label: 'Guest', value: '{{user.fullName}}' },
          { label: 'Date', value: '{{dayLabel}}' },
          { label: 'Time', value: '{{slot|time}} IST' },
          { label: 'Format', value: '{{meetLabel}}' },
          { label: 'Architect', value: '{{architect}}' },
        ],
        qrData: 'https://northstar.example/c/{{consultId}}',
      },
      caption:
        'You are booked, {{user.firstName}}! {{architect}} will review your website before the call so we can get straight to ideas.',
    },
    next: 'in-person',
  },
  {
    id: 'in-person',
    type: 'condition',
    data: { cases: [{ id: 'office', var: 'meetMode', op: 'eq', value: 'office' }] },
    next: { office: 'pin', else: CALENDAR },
  },
  {
    id: 'pin',
    type: 'location',
    data: {
      location: { name: AGENCY.name, address: AGENCY.address, lat: AGENCY.lat, lng: AGENCY.lng },
      caption: 'Visitor parking at level B1. Show your pass at reception on the 9th floor.',
    },
    next: CALENDAR,
  },
  {
    id: CALENDAR,
    type: 'cta',
    data: {
      text: 'Add it to your calendar so it does not slip.',
      actions: [
        {
          kind: 'calendar',
          title: 'Add to calendar',
          event: {
            title: 'Northstar consultation — {{topic}}',
            start: '{{slot}}',
            durationMin: 30,
            location: '{{meetLabel}}',
          },
        },
        { kind: 'url', title: 'Join link', url: AGENCY.meet },
      ],
    },
    next: 'remind',
  },
  {
    id: 'remind',
    type: 'reminder',
    data: {
      afterMs: 20_000,
      label: 'Consultation soon',
      note: 'Real use: 15 minutes before the slot.',
    },
    next: { next: 'booked-end', later: 'soon' },
  },
  {
    id: 'booked-end',
    type: 'end',
    data: {
      text: 'We will remind you 15 minutes before. Anything else meanwhile?',
      showMenu: true,
    },
  },
  {
    id: 'soon',
    type: 'cta',
    data: {
      header: 'Starting in 15 minutes',
      text: 'Your consultation with {{architect}} starts at {{slot|time}}. Keep a rough idea of goals, users and budget handy.',
      actions: [{ kind: 'url', title: 'Join the call', url: AGENCY.meet }],
    },
    next: 'soon-end',
  },
  { id: 'soon-end', type: 'end', data: { showMenu: false } },
];
