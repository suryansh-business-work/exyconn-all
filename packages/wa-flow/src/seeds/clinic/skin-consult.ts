/**
 * Dermatology consultation: skin concern → dermatologist → in clinic or video → day → slot →
 * patient → review → pay → QR ticket, then a video link or calendar + map pin, and a reminder
 * that carries the concern's "how to prepare" note.
 */
import { defineWorkflow } from '../../author';
import { CLINIC, DERMATOLOGISTS, rupees, SKIN_CONCERNS, type Specialist } from './data';
import { patientNodes, slotPicker } from './shared';

const PROFILE = 'profile';
const REVIEW = 'review';

function doctorRow(doctor: Specialist) {
  return {
    id: doctor.id,
    title: doctor.name,
    description: `${doctor.focus} · ${rupees(doctor.fee)}`,
    set: {
      doctor: doctor.name,
      doctorQual: doctor.qualification,
      doctorFocus: doctor.focus,
      years: String(doctor.years),
      fee: String(doctor.fee),
      videoFee: String(doctor.videoFee),
      room: doctor.room,
    },
  };
}

export const skinConsult = defineWorkflow({
  key: 'skin-consult',
  name: 'Skin consultation',
  description: 'See a dermatologist in clinic or on video',
  keywords: ['dermatologist', 'skin', 'acne', 'pimples', 'pigmentation', 'hair fall', 'derma'],
  nodes: [
    {
      id: 'concern',
      type: 'list',
      data: {
        header: 'Skin consultation',
        text: 'Hi {{user.firstName}}, what would you like our dermatologist to look at?',
        footer: 'Consultations Mon–Sat, 10 am – 8 pm',
        button: 'Skin concerns',
        sections: [
          {
            id: 'concerns',
            title: 'Skin, hair and nails',
            rows: SKIN_CONCERNS.map((c) => ({
              id: c.id,
              title: c.title,
              description: c.description,
              set: { concern: c.title, prep: c.prep },
            })),
          },
        ],
      },
      next: Object.fromEntries(SKIN_CONCERNS.map((c) => [c.id, 'doctor'])),
    },
    {
      id: 'doctor',
      type: 'list',
      data: {
        header: '{{concern}}',
        text: 'Choose a dermatologist. The fee includes a digital skin analysis and one free review within 15 days.',
        footer: 'In-clinic fee shown; video consults cost less',
        button: 'Choose doctor',
        sections: [{ id: 'derma', title: 'Dermatologists', rows: DERMATOLOGISTS.map(doctorRow) }],
      },
      next: Object.fromEntries(DERMATOLOGISTS.map((d) => [d.id, PROFILE])),
    },
    {
      id: PROFILE,
      type: 'image',
      data: {
        image: { icon: 'doctor', accent: 'pink', title: '{{doctor}}', subtitle: '{{doctorQual}}' },
        caption:
          '{{doctor}} · {{years}} years · {{doctorFocus}}.\nIn clinic: {{fee|money}} · Video: {{videoFee|money}}. Speaks English, Hindi and Marathi.',
      },
      next: 'mode',
    },
    {
      id: 'mode',
      type: 'buttons',
      data: {
        text: 'How would you like to consult {{doctor}}? A video call works well for follow-ups, rashes and hair fall; moles and scars are best seen in person.',
        buttons: [
          {
            id: 'clinic',
            title: 'In clinic',
            set: { mode: 'clinic', modeLabel: 'In clinic, {{room}}', payFee: '{{fee}}' },
          },
          {
            id: 'video',
            title: 'Video call',
            set: { mode: 'video', modeLabel: 'Video consultation', payFee: '{{videoFee}}' },
          },
          { id: 'back', title: 'Other doctors' },
        ],
      },
      next: { clinic: 'day', video: 'day', back: 'doctor' },
    },
    ...slotPicker({
      day: 'day',
      slot: 'slot',
      next: 'who',
      dayText:
        'Which day suits you for your {{modeLabel}} with {{doctor}}? We are closed on Sundays.',
      slotText:
        'Free slots with {{doctor}} on {{dayLabel}} (IST). A consultation takes about 15 minutes.',
      stepMin: 15,
    }),
    ...patientNodes(REVIEW, 'consultation'),
    {
      id: REVIEW,
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Patient:* {{patientName}}\n*Mobile:* {{patientPhone}}\n*Concern:* {{concern}}\n*Doctor:* {{doctor}}\n*Mode:* {{modeLabel}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Fee:* {{payFee|money}}',
        footer: 'Free rescheduling up to 2 hours before',
        buttons: [
          { id: 'confirm', title: 'Confirm & pay' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'secure', change: 'day', cancel: 'not-booked' },
    },
    {
      id: 'secure',
      type: 'notice',
      data: {
        text: 'Payments go through Aura’s payment partner. We never ask for your card PIN or OTP in this chat.',
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:AUP', welcome: '$price:150:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'Dermatology consultation',
          items: [
            { id: 'consult', name: '{{modeLabel}} — {{doctor}}', qty: 1, price: '{{payFee}}' },
          ],
          adjustments: [
            { id: 'welcome', label: 'First-visit welcome offer', amount: '-{{welcome}}' },
          ],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'paid' },
    },
    {
      id: 'paid',
      type: 'order',
      data: {
        set: { bookingId: '$id:AUR' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [
            { id: 'consult', name: '{{modeLabel}} — {{doctor}}', qty: 1, price: '{{payFee}}' },
          ],
          adjustments: [
            { id: 'welcome', label: 'First-visit welcome offer', amount: '-{{welcome}}' },
          ],
          status: 'paid',
        },
      },
      next: 'ticket',
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Consultation confirmed',
          subtitle: 'Dermatology · Aura Skin & Smile Clinic',
          fields: [
            { label: 'Patient', value: '{{patientName}}' },
            { label: 'Doctor', value: '{{doctor}}' },
            { label: 'Concern', value: '{{concern}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Mode', value: '{{modeLabel}}' },
          ],
          qrData: 'aura://derma/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR at the front desk, or keep it handy for the video call.',
      },
      next: 'how-to-join',
    },
    {
      id: 'how-to-join',
      type: 'condition',
      data: { cases: [{ id: 'video', var: 'mode', op: 'eq', value: 'video' }] },
      next: { video: 'video-cta', else: 'clinic-cta' },
    },
    {
      id: 'video-cta',
      type: 'cta',
      data: {
        text: 'Your video link opens 10 minutes before the slot. Sit by a window with good daylight so {{doctor}} can see your skin clearly.',
        actions: [
          { kind: 'url', title: 'Join video consult', url: CLINIC.video },
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Video consultation — {{doctor}}',
              start: '{{slot}}',
              durationMin: 15,
              location: CLINIC.video,
            },
          },
        ],
      },
      next: 'remind',
    },
    {
      id: 'clinic-cta',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar, or call the front desk if you need help.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: 'Skin consultation — {{doctor}}',
              start: '{{slot}}',
              durationMin: 20,
              location: CLINIC.address,
            },
          },
          { kind: 'call', title: 'Call the clinic', phone: CLINIC.phone },
        ],
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: { name: CLINIC.name, address: CLINIC.address, lat: CLINIC.lat, lng: CLINIC.lng },
        caption:
          'Valet parking at the arcade entrance. Take the lift to the 2nd floor — reception is on your left.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Consultation reminder',
        note: 'Real use: the evening before.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are all set, {{user.firstName}}. We will remind you the evening before.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Consultation tomorrow',
        text: 'Reminder: {{modeLabel}} with {{doctor}} tomorrow at {{slot|time}} (booking {{bookingId}}).\n\nTo prepare: {{prep}}',
        buttons: [
          { id: 'confirm', title: 'I’ll be there' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you, {{user.firstName}}. See you tomorrow.', showMenu: true },
    },
    ...slotPicker({
      day: 're-day',
      slot: 're-slot',
      next: 're-done',
      dayText: 'No problem. Pick a new day for {{doctor}} — your payment carries over.',
      slotText: 'Free slots on {{dayLabel}}:',
      stepMin: 15,
    }),
    {
      id: 're-done',
      type: 'end',
      data: {
        text: 'Done — moved to {{dayLabel}} at {{slot|time}}. Booking {{bookingId}} and its QR stay the same.',
        showMenu: true,
      },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}}? The full amount goes back to your original payment method in 5–7 working days.',
        buttons: [
          { id: 'yes', title: 'Yes, cancel', set: { refundId: '$id:RF' } },
          { id: 'keep', title: 'Keep it' },
        ],
      },
      next: { yes: 'r-cancelled', keep: 'r-ok' },
    },
    {
      id: 'r-cancelled',
      type: 'end',
      data: {
        text: 'Your consultation is cancelled. Refund reference: {{refundId}}.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: { text: 'No booking was made. Start again from the menu any time.', showMenu: true },
    },
  ],
});
