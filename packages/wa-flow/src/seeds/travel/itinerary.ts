/**
 * Itinerary sharing: find the booking (latest trip or a typed booking ID) → itinerary PDF with
 * flights, a day-wise plan and hotels → hotel pins, the tour manager's contact, a web check-in
 * reminder push, and a hand-off to change something.
 */
import { defineWorkflow } from '../../author';
import { AGENCY, TOUR_MANAGER, TRIP_DESK } from './data';

const MORE = 'more';

const HOTELS = [
  {
    id: 'h-munnar',
    name: 'Misty Ridge Resort, Munnar',
    address: 'Pothamedu, Munnar, Idukki, Kerala 685612',
    lat: 10.0727,
    lng: 77.0711,
    caption: 'Nights 1–2. Check-in 2 pm. Ask for the valley-view block.',
    next: 'h-thekkady',
  },
  {
    id: 'h-thekkady',
    name: 'Spice Grove Retreat, Thekkady',
    address: 'Kumily–Thekkady Road, Kumily, Kerala 685509',
    lat: 9.6031,
    lng: 77.1615,
    caption: 'Night 3. Ten minutes from the Periyar boating jetty.',
    next: 'h-alleppey',
  },
  {
    id: 'h-alleppey',
    name: 'Lakeside Houseboat Jetty, Alleppey',
    address: 'Finishing Point, Punnamada, Alappuzha, Kerala 688013',
    lat: 9.5103,
    lng: 76.3445,
    caption: 'Night 4 on a private houseboat. Boarding at 12 noon from this jetty.',
    next: MORE,
  },
] as const;

export const itinerary = defineWorkflow({
  key: 'itinerary',
  name: 'My itinerary',
  description: 'Day-wise plan, hotels, tour manager and check-in',
  keywords: ['itinerary', 'my trip', 'booking', 'tour manager', 'hotel details', 'voucher'],
  nodes: [
    {
      id: 'find',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, which trip would you like the itinerary for?',
        buttons: [
          { id: 'latest', title: 'My latest trip', set: { bookingRef: '$id:TN' } },
          { id: 'typed', title: 'Enter booking ID' },
        ],
      },
      next: { latest: 'found', typed: 'ask-ref' },
    },
    {
      id: 'ask-ref',
      type: 'input',
      data: {
        prompt: 'Please type your booking ID — it starts with TN, e.g. TN-4KQ7W2.',
        var: 'bookingRef',
        kind: 'text',
      },
      next: 'found',
    },
    {
      id: 'found',
      type: 'text',
      data: {
        set: {
          tripStart: '$days:9',
          tripEnd: '$days:14',
          flightNo: '$pick:6E 6312|AI 681|QP 1345',
        },
        text: 'Found it — booking {{bookingRef|upper}}, *Kerala Backwaters & Hills* for 2 adults, {{tripStart|day}} to {{tripEnd|day}}.',
      },
      next: 'doc',
    },
    {
      id: 'doc',
      type: 'document',
      data: {
        complete: true,
        document: {
          fileName: 'TrailNest_Itinerary_Kerala.pdf',
          fileType: 'PDF',
          pages: 6,
          sizeKb: 1240,
          preview: {
            title: 'Your itinerary',
            subtitle: 'Kerala Backwaters & Hills · 5 nights',
            sections: [
              {
                kind: 'fields',
                heading: 'Booking',
                fields: [
                  { label: 'Lead traveller', value: '{{user.fullName}}' },
                  { label: 'Booking ID', value: '{{bookingRef|upper}}' },
                  { label: 'Travellers', value: '2 adults' },
                  { label: 'Dates', value: '{{tripStart|day}} – {{tripEnd|day}}' },
                  { label: 'Tour manager', value: `${TOUR_MANAGER.name}, ${TOUR_MANAGER.phone}` },
                ],
              },
              {
                kind: 'table',
                heading: 'Flights',
                columns: ['Flight', 'From', 'To', 'Departs', 'Arrives'],
                rows: [
                  {
                    id: 'out',
                    cells: ['{{flightNo}}', 'Mumbai (BOM)', 'Kochi (COK)', '07:10', '09:05'],
                  },
                  {
                    id: 'back',
                    cells: ['6E 5127', 'Kochi (COK)', 'Mumbai (BOM)', '18:40', '20:35'],
                  },
                ],
              },
              {
                kind: 'table',
                heading: 'Day-wise plan',
                columns: ['Day', 'Plan', 'Stay'],
                rows: [
                  { id: 'd1', cells: ['1', 'Kochi arrival, drive to Munnar (4 hrs)', 'Munnar'] },
                  {
                    id: 'd2',
                    cells: ['2', 'Tea museum, Eravikulam park, Mattupetty dam', 'Munnar'],
                  },
                  {
                    id: 'd3',
                    cells: ['3', 'Drive to Thekkady, spice walk, Kathakali', 'Thekkady'],
                  },
                  { id: 'd4', cells: ['4', 'Periyar boating, drive to Alleppey', 'Houseboat'] },
                  { id: 'd5', cells: ['5', 'Backwater cruise, village walk', 'Kochi'] },
                  { id: 'd6', cells: ['6', 'Fort Kochi walk, airport drop', '—'] },
                ],
              },
              {
                kind: 'table',
                heading: 'Hotels',
                columns: ['Hotel', 'Nights', 'Room', 'Meals'],
                rows: HOTELS.map((h, i) => ({
                  id: h.id,
                  cells: [
                    h.name,
                    String(i === 0 ? 2 : 1),
                    i === 2 ? 'Houseboat cabin' : 'Deluxe',
                    'Breakfast',
                  ],
                })),
              },
              {
                kind: 'text',
                heading: 'Good to know',
                text: 'Carry a photo ID for every traveller. Munnar is cool in the evenings — pack a light jacket. Your driver will wait at Kochi arrivals with a TrailNest sign. For anything on the trip, call the 24×7 helpline.',
              },
            ],
            footer: `TrailNest Holidays · 24×7 trip helpline ${AGENCY.helpline}`,
          },
        },
        caption:
          'Here is your full itinerary, {{user.firstName}}. It works offline once downloaded.',
      },
      next: MORE,
    },
    {
      id: MORE,
      type: 'list',
      data: {
        text: 'Anything else for this trip?',
        button: 'Trip options',
        sections: [
          {
            id: 'trip',
            title: 'Your trip',
            rows: [
              { id: 'hotels', title: 'Hotel locations', description: 'Map pins for all 3 stays' },
              { id: 'manager', title: 'Tour manager', description: 'Save their number' },
              {
                id: 'checkin',
                title: 'Web check-in reminder',
                description: 'We ping you when it opens',
              },
              { id: 'change', title: 'Change something', description: 'Talk to the trip desk' },
            ],
          },
          { id: 'done', title: 'Done', rows: [{ id: 'menu', title: 'Main menu' }] },
        ],
      },
      next: {
        hotels: 'h-munnar',
        manager: 'manager',
        checkin: 'checkin',
        change: 'desk',
        menu: 'menu-end',
      },
    },
    ...HOTELS.map((h) => ({
      id: h.id,
      type: 'location' as const,
      data: {
        location: { name: h.name, address: h.address, lat: h.lat, lng: h.lng },
        caption: h.caption,
      },
      next: h.next,
    })),
    {
      id: 'manager',
      type: 'contact',
      data: { contact: TOUR_MANAGER },
      next: 'manager-note',
    },
    {
      id: 'manager-note',
      type: 'text',
      data: {
        text: '{{user.firstName}}, Joseph will message you here the evening before you land.',
      },
      next: MORE,
    },
    {
      id: 'checkin',
      type: 'reminder',
      data: {
        afterMs: 15_000,
        label: 'Web check-in is open',
        note: 'Real use: 48 hours before the flight.',
      },
      next: { next: 'checkin-ok', later: 'checkin-msg' },
    },
    {
      id: 'checkin-ok',
      type: 'text',
      data: { text: 'Done — we will message you the moment web check-in opens for {{flightNo}}.' },
      next: MORE,
    },
    {
      id: 'checkin-msg',
      type: 'cta',
      data: {
        header: 'Web check-in is open',
        text: 'Web check-in for {{flightNo}} on {{tripStart|day}} is now open. Check in early for better seats.',
        actions: [
          { kind: 'url', title: 'Web check-in', url: AGENCY.checkIn },
          { kind: 'call', title: 'Trip helpline', phone: AGENCY.helpline },
        ],
      },
      next: 'checkin-end',
    },
    {
      id: 'checkin-end',
      type: 'end',
      data: { text: 'Have a great trip, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'desk',
      type: 'handoff',
      data: {
        agentName: TRIP_DESK.agentName,
        text: 'Hi {{user.firstName}}, I’m Sana. I have booking {{bookingRef|upper}} open. What would you like to change — dates, hotels, travellers or an add-on?',
      },
      next: 'desk-end',
    },
    { id: 'desk-end', type: 'end', data: { showMenu: true } },
    { id: 'menu-end', type: 'end', data: { showMenu: true } },
  ],
});
