/**
 * Doctor appointment: department → doctor → day → slot → patient (the signed-in user or
 * someone else) → review → pay → QR ticket, calendar, map pin and a reminder push.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import {
  GENERAL_MEDICINE,
  HOSPITAL,
  rupees,
  SPECIALITIES,
  type Department,
  type Doctor,
} from './data';

const PROFILE = 'profile';

function departmentRow(dept: Department) {
  return {
    id: dept.key,
    title: dept.name,
    description: dept.description,
    set: { dept: dept.name, deptKey: dept.key },
  };
}

function doctorRow(doctor: Doctor) {
  return {
    id: doctor.id,
    title: doctor.name,
    description: `${doctor.qualification} · ${doctor.years} yrs · ${rupees(doctor.fee)}`,
    set: {
      doctor: doctor.name,
      doctorQual: doctor.qualification,
      fee: String(doctor.fee),
      room: doctor.room,
    },
  };
}

/** One doctor list per department; every doctor leads to the doctor's profile card. */
function doctorList(dept: Department): AuthorNode {
  return {
    id: `dr-${dept.key}`,
    type: 'list',
    data: {
      header: dept.name,
      text: '*{{dept}}* — choose a consultant. The fee covers the consultation and one free review within 7 days.',
      footer: 'Fees in ₹, paid online when you book',
      button: 'Choose doctor',
      sections: [{ id: 'consultants', title: 'Consultants', rows: dept.doctors.map(doctorRow) }],
    },
    next: Object.fromEntries(dept.doctors.map((d) => [d.id, PROFILE])),
  };
}

const ALL_DEPARTMENTS = [...SPECIALITIES, GENERAL_MEDICINE];

export const appointment = defineWorkflow({
  key: 'appointment',
  name: 'Book a doctor',
  description: 'OPD appointments across 7 departments',
  keywords: ['appointment', 'book doctor', 'doctor', 'consultation', 'opd', 'specialist'],
  nodes: [
    {
      id: 'dept',
      type: 'list',
      data: {
        header: 'Book an appointment',
        text: 'Sure, {{user.firstName}}. Which department would you like to visit?',
        footer: 'OPD: Mon–Sat, 9 am – 5 pm',
        button: 'Departments',
        sections: [
          { id: 'specialities', title: 'Specialities', rows: SPECIALITIES.map(departmentRow) },
          { id: 'primary', title: 'Primary care', rows: [departmentRow(GENERAL_MEDICINE)] },
        ],
      },
      next: Object.fromEntries(ALL_DEPARTMENTS.map((d) => [d.key, 'route'])),
    },
    {
      id: 'route',
      type: 'condition',
      data: {
        note: 'One case per speciality; anything else is General Medicine.',
        cases: SPECIALITIES.map((d) => ({
          id: d.key,
          var: 'deptKey',
          op: 'eq' as const,
          value: d.key,
        })),
      },
      next: {
        ...Object.fromEntries(SPECIALITIES.map((d) => [d.key, `dr-${d.key}`])),
        else: `dr-${GENERAL_MEDICINE.key}`,
      },
    },
    ...ALL_DEPARTMENTS.map(doctorList),
    {
      id: PROFILE,
      type: 'image',
      data: {
        image: { icon: 'doctor', accent: 'teal', title: '{{doctor}}', subtitle: '{{doctorQual}}' },
        caption:
          '{{doctor}} consults in {{room}}, CityCare Indiranagar.\nConsultation fee: {{fee|money}}. Languages: English, Hindi, Kannada.',
      },
      next: 'day',
    },
    {
      id: 'day',
      type: 'list',
      data: {
        text: 'Which day would you like to see {{doctor}}? The OPD is closed on Sundays.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 'slot' },
    },
    {
      id: 'slot',
      type: 'list',
      data: {
        text: 'Free slots with {{doctor}} on {{dayLabel}} (IST). Each visit is about 15 minutes.',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 9,
          to: 17,
          stepMin: 20,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'who', 'other-day': 'day' },
    },
    {
      id: 'who',
      type: 'buttons',
      data: {
        text: 'Who is the appointment for? Book for yourself ({{user.fullName}}) or for someone else.',
        buttons: [
          {
            id: 'self',
            title: 'Myself',
            set: { patientName: '{{user.fullName}}', patientPhone: '{{user.phone}}' },
          },
          { id: 'other', title: 'Someone else' },
        ],
      },
      next: { self: 'own-phone', other: 'p-name' },
    },
    {
      id: 'own-phone',
      type: 'condition',
      data: {
        note: 'The signed-in profile may have no phone; ask for one then.',
        cases: [{ id: 'missing', var: 'patientPhone', op: 'empty' }],
      },
      next: { missing: 'ask-phone', else: 'review' },
    },
    {
      id: 'ask-phone',
      type: 'input',
      data: {
        prompt: 'Which mobile number should we send the booking updates to?',
        var: 'patientPhone',
        kind: 'phone',
      },
      next: 'review',
    },
    {
      id: 'p-name',
      type: 'input',
      data: { prompt: "Please type the patient's full name.", var: 'patientName', kind: 'name' },
      next: 'p-phone',
    },
    {
      id: 'p-phone',
      type: 'input',
      data: {
        prompt: "{{patientName}}'s mobile number? We send the visit updates there too.",
        var: 'patientPhone',
        kind: 'phone',
      },
      next: 'p-dob',
    },
    {
      id: 'p-dob',
      type: 'input',
      data: {
        prompt: "And {{patientName}}'s date of birth (DD/MM/YYYY)?",
        var: 'patientDob',
        kind: 'date',
        past: true,
        error: 'Please type a date of birth in the past as DD/MM/YYYY, e.g. 14/08/1990.',
      },
      next: 'p-ok',
    },
    {
      id: 'p-ok',
      type: 'text',
      data: { text: 'Thanks. Booking for {{patientName}}, born {{patientDob}}.' },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*Patient:* {{patientName}}\n*Mobile:* {{patientPhone}}\n*Doctor:* {{doctor}}, {{dept}}\n*When:* {{dayLabel}} at {{slot|time}}\n*Where:* {{room}}\n*Fee:* {{fee|money}}',
        footer: 'Free cancellation up to 2 hours before',
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
        text: "Payments are processed by CityCare's payment partner. We never ask for your card PIN or OTP in this chat.",
      },
      next: 'summary',
    },
    {
      id: 'summary',
      type: 'order',
      data: {
        set: { orderId: '$id:PAY', bookingFee: '$price:50:20' },
        order: {
          orderId: '{{orderId}}',
          title: 'OPD consultation',
          items: [{ id: 'consult', name: 'Consultation — {{doctor}}', qty: 1, price: '{{fee}}' }],
          adjustments: [{ id: 'booking', label: 'Online booking fee', amount: '{{bookingFee}}' }],
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
        set: { bookingId: '$id:CC', token: '$int:11:48' },
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [{ id: 'consult', name: 'Consultation — {{doctor}}', qty: 1, price: '{{fee}}' }],
          adjustments: [{ id: 'booking', label: 'Online booking fee', amount: '{{bookingFee}}' }],
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
          title: 'Appointment confirmed',
          subtitle: '{{dept}} · CityCare Hospital, Indiranagar',
          fields: [
            { label: 'Patient', value: '{{patientName}}' },
            { label: 'Doctor', value: '{{doctor}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Room', value: '{{room}}' },
            { label: 'Token', value: 'A-{{token}}' },
            { label: 'Paid', value: '{{fee|money}} + {{bookingFee|money}}' },
          ],
          qrData: 'citycare://opd/{{bookingId}}?slot={{slot}}&token=A-{{token}}',
        },
        caption: 'Show this QR at the OPD desk 15 minutes before your slot to skip the queue.',
      },
      next: 'calendar',
    },
    {
      id: 'calendar',
      type: 'cta',
      data: {
        text: 'Add the visit to your calendar so you do not miss it, or call us if you need help.',
        actions: [
          {
            kind: 'calendar',
            title: 'Add to calendar',
            event: {
              title: '{{dept}} consultation — {{doctor}}',
              start: '{{slot}}',
              durationMin: 20,
              location: HOSPITAL.address,
            },
          },
          { kind: 'call', title: 'Call hospital', phone: HOSPITAL.phone },
        ],
      },
      next: 'pin',
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: {
          name: HOSPITAL.name,
          address: HOSPITAL.address,
          lat: HOSPITAL.lat,
          lng: HOSPITAL.lng,
        },
        caption:
          'Parking in basement B1. The OPD reception is on the ground floor, next to the pharmacy.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 25_000,
        label: 'Appointment reminder',
        note: 'Real use: the day before. Short for the demo.',
      },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: {
        text: 'You are all set, {{user.firstName}}. We will remind you before the visit.',
        showMenu: true,
      },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Appointment reminder',
        text: 'Reminder: your appointment with {{doctor}} is tomorrow at {{slot|time}}.\nBooking {{bookingId}} · {{room}}.\nPlease bring a photo ID and any earlier prescriptions or reports.',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: 're-day', cancel: 'r-cancel' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: {
        text: 'Thank you, {{user.firstName}}. See you tomorrow at {{slot|time}}.',
        showMenu: true,
      },
    },
    {
      id: 're-day',
      type: 'list',
      data: {
        text: 'No problem. Pick a new day for {{doctor}} — your payment carries over.',
        button: 'Choose day',
        sections: [],
        dynamic: { kind: 'days', count: 7, skipSundays: true, var: 'day' },
      },
      next: { pick: 're-slot' },
    },
    {
      id: 're-slot',
      type: 'list',
      data: {
        text: 'Free slots on {{dayLabel}}:',
        button: 'Choose time',
        sections: [
          {
            id: 'more',
            title: 'More options',
            rows: [{ id: 'other-day', title: 'Pick another day' }],
          },
        ],
        dynamic: {
          kind: 'slots',
          dayVar: 'day',
          from: 9,
          to: 17,
          stepMin: 20,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 're-ticket', 'other-day': 're-day' },
    },
    {
      id: 're-ticket',
      type: 'ticket',
      data: {
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Appointment rescheduled',
          subtitle: '{{dept}} · CityCare Hospital, Indiranagar',
          fields: [
            { label: 'Patient', value: '{{patientName}}' },
            { label: 'Doctor', value: '{{doctor}}' },
            { label: 'New date', value: '{{dayLabel}}' },
            { label: 'New time', value: '{{slot|time}}' },
            { label: 'Room', value: '{{room}}' },
          ],
          qrData: 'citycare://opd/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Your old QR no longer works — use this one.',
      },
      next: 're-done',
    },
    {
      id: 're-done',
      type: 'end',
      data: { text: 'Done. Anything else?', showMenu: true },
    },
    {
      id: 'r-cancel',
      type: 'buttons',
      data: {
        text: 'Cancel booking {{bookingId}}? {{fee|money}} goes back to your original payment method in 5–7 working days.',
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
        text: 'Your appointment is cancelled. Refund reference: {{refundId}}. We hope to see you another time.',
        showMenu: true,
      },
    },
    {
      id: 'not-booked',
      type: 'end',
      data: {
        text: 'No booking was made. You can start again from the menu at any time.',
        showMenu: true,
      },
    },
  ],
});
