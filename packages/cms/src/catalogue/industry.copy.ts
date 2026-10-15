/**
 * The industry pages' sections (/industries/*): the words of the first page that uses each.
 */

export const INDUSTRY_STORY_PROPS = {
  index: 4,
  label: 'A day with it running',
  title: 'One day at a 60-room hotel',
  lede: 'Scroll through a normal Tuesday. Each moment lights the part of the hotel the agent is working on.',
  moments: [
    {
      when: '06:10',
      title: 'A guest lands early',
      text: 'A WhatsApp message from the airport asks about early check-in. The agent sees the room is due out at 10, flags it for priority cleaning and offers the lounge until then.',
      useCase: 1,
    },
    {
      when: '09:30',
      title: 'Housekeeping gets the list, sorted',
      text: "Departures, priority rooms and three guest requests from overnight reach the housekeeping supervisor's phone as one ordered list instead of a stack of notes.",
      useCase: 4,
    },
    {
      when: '13:15',
      title: 'An enquiry becomes a booking',
      text: 'A family asks about two connecting rooms for the long weekend. The agent checks the PMS, quotes the direct rate, takes the booking and sends a payment link.',
      useCase: 2,
    },
    {
      when: '16:40',
      title: 'Dinner, offered at the right time',
      text: "It's raining and the pool is closed. Guests in residence get a note about the rooftop restaurant; eleven tables are booked through the chat.",
      useCase: 5,
    },
    {
      when: '20:05',
      title: 'A review gets an answer',
      text: "A three-star review mentions slow room service. A reply is drafted for the manager, and the agent notes it's the third mention this month.",
      useCase: 3,
    },
    {
      when: '23:55',
      title: "Tomorrow's numbers, ready tonight",
      text: "Occupancy, ADR, RevPAR and pickup for the next fortnight land in the owner's inbox before midnight, with one line on what changed and why.",
      useCase: 6,
    },
  ],
};
