/**
 * Room enquiry: room-type carousel → the room's photo card and facts → check availability
 * (the booking journey, with the room already chosen), see the resort facilities, or ask
 * the front desk.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { FRONT_DESK, ROOMS, roomSet, type Room } from './data';

function roomCard(room: Room): Product {
  return {
    id: room.key,
    title: room.name,
    subtitle: `${room.summary} · sleeps ${room.sleeps}`,
    price: room.rate,
    mrp: room.mrp,
    badge: room.badge,
    image: { icon: room.icon, accent: 'cyan', title: room.name, subtitle: room.size },
    buttonTitle: 'View room',
    set: { ...roomSet(room), sleeps: room.sleeps, roomSize: room.size },
  };
}

export const rooms = defineWorkflow({
  key: 'rooms',
  name: 'Rooms and rates',
  description: 'Garden, sea-view, pool suites and family villas',
  keywords: ['room', 'rooms', 'rates', 'tariff', 'suite', 'villa', 'sea view', 'room types'],
  nodes: [
    {
      id: 'cards',
      type: 'carousel',
      data: {
        text: 'Hi {{user.firstName}}, here are our rooms. Rates are per night for two, with breakfast, before GST.',
        cards: ROOMS.map(roomCard),
      },
      next: Object.fromEntries(ROOMS.map((r) => [r.key, 'photo'])),
    },
    {
      id: 'photo',
      type: 'image',
      data: {
        image: {
          icon: 'bed',
          accent: 'cyan',
          title: '{{room}}',
          subtitle: '{{roomSize}} · sleeps {{sleeps}}',
        },
        caption:
          '*{{room}}* from {{rate|money}} a night.\nIncluded: breakfast at The Shack, Wi-Fi, minibar refilled daily, pool and beach towels, and 24-hour room service.',
      },
      next: 'next',
    },
    {
      id: 'next',
      type: 'buttons',
      data: {
        text: 'Would you like to check dates for the {{room}}?',
        footer: 'Best rate guaranteed on WhatsApp',
        buttons: [
          { id: 'dates', title: 'Check dates' },
          { id: 'facilities', title: 'Facilities' },
          { id: 'others', title: 'Other rooms' },
        ],
      },
      next: { dates: 'to-book', facilities: 'facilities', others: 'cards' },
    },
    { id: 'to-book', type: 'jump', data: { workflowKey: 'book' } },
    {
      id: 'facilities',
      type: 'document',
      data: {
        document: {
          fileName: 'CoralBay_Factsheet.pdf',
          fileType: 'PDF',
          pages: 4,
          sizeKb: 2140,
          preview: {
            title: 'Coral Bay Resort — fact sheet',
            subtitle: '64 rooms and villas on Candolim beach',
            sections: [
              {
                kind: 'table',
                heading: 'Facilities',
                columns: ['Facility', 'Timings', 'Charges'],
                rows: [
                  { id: 'pool', cells: ['Lagoon pool and kids’ pool', '7 am – 8 pm', 'Included'] },
                  {
                    id: 'shack',
                    cells: ['The Shack (beach restaurant)', '7 am – 11 pm', 'À la carte'],
                  },
                  { id: 'spa', cells: ['Ayurveda spa', '9 am – 9 pm', 'From ₹2,400'] },
                  { id: 'gym', cells: ['Gym', '24 hours', 'Included'] },
                  { id: 'kids', cells: ['Kids’ club (4–12 years)', '10 am – 6 pm', 'Included'] },
                  { id: 'cabs', cells: ['Airport transfers', 'On request', 'From ₹1,800'] },
                ],
              },
              {
                kind: 'fields',
                heading: 'Stay policies',
                fields: [
                  { label: 'Check-in', value: '2 pm' },
                  { label: 'Checkout', value: '11 am' },
                  { label: 'Children', value: 'Under 6 stay free' },
                  { label: 'Pets', value: 'Not allowed' },
                  { label: 'Cancellation', value: 'Free up to 72 hours before' },
                ],
              },
            ],
            footer: 'Coral Bay Resort, Fort Aguada Road, Candolim, Goa',
          },
        },
        caption: 'Our fact sheet, with timings and policies.',
      },
      next: 'after-facts',
    },
    {
      id: 'after-facts',
      type: 'buttons',
      data: {
        text: 'Anything else about the {{room}}?',
        buttons: [
          { id: 'dates', title: 'Check dates' },
          { id: 'desk', title: 'Ask the desk' },
        ],
      },
      next: { dates: 'to-book', desk: 'desk' },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: FRONT_DESK.agentName,
        text: "Hi {{user.firstName}}, Elton from the front desk. Happy to answer anything about the {{room}} — connecting rooms, cots, the view from a particular floor. What's on your mind?",
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
  ],
});
