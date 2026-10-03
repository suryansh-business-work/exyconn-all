/**
 * Vaccination: a child (name + date of birth → schedule PDF → due vaccines) or an adult
 * (vaccine carousel) → day → slot → review → QR ticket → aftercare and a reminder push.
 */
import { defineWorkflow } from '../../author';
import type { Product } from '../../schema';
import { ADULT_VACCINES, CHILD_DUE, CHILD_UPCOMING, rupees, type Vaccine } from './data';

const DAY = 'day';

const chosen = (vaccine: Vaccine) => ({
  vaccine: vaccine.name,
  vaccinePrice: String(vaccine.price),
  doses: vaccine.doses,
});

function childRow(vaccine: Vaccine) {
  return {
    id: vaccine.id,
    title: vaccine.name,
    description: `${vaccine.detail} · ${rupees(vaccine.price)}`,
    set: chosen(vaccine),
  };
}

function adultCard(vaccine: Vaccine): Product {
  return {
    id: vaccine.id,
    title: vaccine.name,
    subtitle: `${vaccine.detail} · ${vaccine.doses}`,
    price: vaccine.price,
    mrp: vaccine.mrp,
    badge: vaccine.badge,
    image: { icon: 'vaccine', accent: 'indigo', title: vaccine.name },
    buttonTitle: 'Book this',
    set: { ...chosen(vaccine), patientName: '{{user.fullName}}' },
  };
}

const CHILD_ALL = [...CHILD_DUE, ...CHILD_UPCOMING];

export const vaccination = defineWorkflow({
  key: 'vaccination',
  name: 'Vaccinations',
  description: 'Child immunisation schedule and adult vaccines',
  keywords: ['vaccine', 'vaccination', 'vaccinate', 'immunisation', 'immunization', 'flu shot'],
  nodes: [
    {
      id: 'who',
      type: 'buttons',
      data: {
        header: 'Vaccinations',
        text: 'Our vaccination clinic follows the national immunisation schedule, with vaccines stored and given by trained nurses. Who is the vaccine for?',
        buttons: [
          { id: 'child', title: 'My child' },
          { id: 'adult', title: 'An adult' },
        ],
      },
      next: { child: 'c-name', adult: 'a-vaccines' },
    },
    {
      id: 'c-name',
      type: 'input',
      data: { prompt: "What is your child's full name?", var: 'childName', kind: 'name' },
      next: 'c-dob',
    },
    {
      id: 'c-dob',
      type: 'input',
      data: {
        prompt:
          "{{childName}}'s date of birth (DD/MM/YYYY)? We use it to work out which vaccines are due.",
        var: 'childDob',
        kind: 'date',
        past: true,
        error: 'Please type a date of birth in the past as DD/MM/YYYY, e.g. 02/03/2025.',
      },
      next: 'c-schedule',
    },
    {
      id: 'c-schedule',
      type: 'document',
      data: {
        set: { patientName: '{{childName}}' },
        document: {
          fileName: 'CityCare_Vaccination_Schedule.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 186,
          preview: {
            title: 'Immunisation schedule',
            subtitle: 'CityCare Hospital · Paediatrics',
            sections: [
              {
                kind: 'fields',
                fields: [
                  { label: 'Child', value: '{{childName}}' },
                  { label: 'Date of birth', value: '{{childDob}}' },
                  { label: 'Parent', value: '{{user.fullName}}' },
                  { label: 'Paediatrician', value: 'Dr. Kavya Iyer' },
                ],
              },
              {
                kind: 'table',
                heading: 'Vaccines',
                columns: ['Vaccine', 'Due age', 'Status'],
                rows: [
                  { id: 'bcg', cells: ['BCG', 'Birth', 'Given'] },
                  { id: 'hep-b-1', cells: ['Hepatitis B-1', 'Birth', 'Given'] },
                  { id: 'dtap-1', cells: ['DTaP-IPV-Hib-1', '6 weeks', 'Given'] },
                  { id: 'pcv-3', cells: ['PCV-3', '14 weeks', 'Given'] },
                  { id: 'flu', cells: ['Influenza', '6 months, yearly', 'Overdue'], flag: 'high' },
                  { id: 'mmr-1', cells: ['MMR-1', '9 months', 'Due'] },
                  { id: 'tcv', cells: ['Typhoid conjugate', '9–12 months', 'Due'] },
                  { id: 'hep-a-1', cells: ['Hepatitis A-1', '12 months', 'Upcoming'] },
                  { id: 'varicella-1', cells: ['Varicella-1', '15 months', 'Upcoming'] },
                ],
              },
              {
                kind: 'text',
                heading: 'Note',
                text: 'Due ages are worked out from the date of birth. Your paediatrician confirms the plan at each visit.',
              },
            ],
            footer: 'CityCare Hospital, Indiranagar · Kids Wing',
          },
        },
        caption: "Here is {{childName}}'s vaccination schedule. Overdue vaccines are highlighted.",
      },
      next: 'c-due',
    },
    {
      id: 'c-due',
      type: 'list',
      data: {
        text: 'Which vaccine would you like to book for {{childName}}?',
        footer: 'Paid at the clinic, after the paediatrician check',
        button: 'Choose vaccine',
        sections: [
          { id: 'due', title: 'Due now', rows: CHILD_DUE.map(childRow) },
          { id: 'upcoming', title: 'Coming up', rows: CHILD_UPCOMING.map(childRow) },
        ],
      },
      next: Object.fromEntries(CHILD_ALL.map((v) => [v.id, DAY])),
    },
    {
      id: 'a-vaccines',
      type: 'carousel',
      data: {
        text: 'Adult vaccines available this week, {{user.firstName}}. A doctor checks you briefly before every dose.',
        cards: ADULT_VACCINES.map(adultCard),
      },
      next: Object.fromEntries(ADULT_VACCINES.map((v) => [v.id, DAY])),
    },
    {
      id: DAY,
      type: 'list',
      data: {
        text: 'Which day suits you for the {{vaccine}} vaccine? The clinic is closed on Sundays.',
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
          from: 10,
          to: 16,
          stepMin: 15,
          take: 8,
          var: 'slot',
        },
      },
      next: { pick: 'review', 'other-day': DAY },
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your booking',
        text: '*For:* {{patientName}}\n*Vaccine:* {{vaccine}} ({{doses}})\n*When:* {{dayLabel}} at {{slot|time}}\n*Price:* {{vaccinePrice|money}}, paid at the clinic',
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'change', title: 'Change time' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { confirm: 'ticket', change: DAY, cancel: 'not-booked' },
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        set: { bookingId: '$id:VC' },
        complete: true,
        ticket: {
          ticketId: '{{bookingId}}',
          title: 'Vaccination booked',
          subtitle: 'Vaccination clinic · Ground floor, Block B',
          fields: [
            { label: 'For', value: '{{patientName}}' },
            { label: 'Vaccine', value: '{{vaccine}}' },
            { label: 'Dose', value: '{{doses}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Time', value: '{{slot|time}}' },
            { label: 'Pay at clinic', value: '{{vaccinePrice|money}}' },
          ],
          qrData: 'citycare://vaccine/{{bookingId}}?slot={{slot}}',
        },
        caption: 'Show this QR at the vaccination desk.',
      },
      next: 'aftercare',
    },
    {
      id: 'aftercare',
      type: 'text',
      data: {
        text: 'Before you come:\n• Bring the vaccination card, if you have one\n• Tell us about any fever or allergy on the day\n• Plan to wait 15 minutes after the dose so we can watch for reactions\nA mild fever or a sore arm for a day is common.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: { afterMs: 20_000, label: 'Vaccination reminder', note: 'Real use: the day before.' },
      next: { next: 'booked', later: 'r-msg' },
    },
    {
      id: 'booked',
      type: 'end',
      data: { text: 'Booked. We will remind you the day before.', showMenu: true },
    },
    {
      id: 'r-msg',
      type: 'buttons',
      data: {
        header: 'Vaccination reminder',
        text: "Reminder: {{patientName}}'s {{vaccine}} vaccine is tomorrow at {{slot|time}}. Booking {{bookingId}}.",
        buttons: [
          { id: 'confirm', title: 'Confirm' },
          { id: 'reschedule', title: 'Reschedule' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { confirm: 'r-ok', reschedule: DAY, menu: 'r-menu' },
    },
    {
      id: 'r-ok',
      type: 'end',
      data: { text: 'Thank you. See you tomorrow at {{slot|time}}.', showMenu: true },
    },
    {
      id: 'r-menu',
      type: 'end',
      data: { showMenu: true },
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
