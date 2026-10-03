/**
 * Admission enquiry: course → brochure PDF (fees, batches, scholarships) → apply (student
 * name, date of birth, parent phone, email, PIN code → registration fee → application QR)
 * or a scholarship test (day → slot → hall ticket → reminder push), or a counsellor.
 */
import { defineWorkflow } from '../../author';
import { ACADEMY, ALL_COURSES, courseSections, REGISTRATION_FEE } from './data';

const NEXT = 'next-step';

export const admission = defineWorkflow({
  key: 'admission',
  name: 'Admissions 2026–27',
  description: 'Brochure, fees, scholarship test and online application',
  keywords: [
    'admission',
    'apply',
    'brochure',
    'fees structure',
    'fee structure',
    'scholarship',
    'enrol',
  ],
  nodes: [
    {
      id: 'course',
      type: 'list',
      data: {
        header: 'Admissions 2026–27',
        text: 'Admissions are open, {{user.firstName}}. Which course are you interested in?',
        footer: 'New batches start in April and June',
        button: 'Courses',
        sections: courseSections(),
      },
      next: Object.fromEntries(ALL_COURSES.map((c) => [c.id, 'brochure'])),
    },
    {
      id: 'brochure',
      type: 'document',
      data: {
        document: {
          fileName: 'BrightPath_Brochure_2026-27.pdf',
          fileType: 'PDF',
          pages: 12,
          sizeKb: 3480,
          preview: {
            title: '{{course}} — 2026–27',
            subtitle: 'BrightPath Academy, Pune',
            sections: [
              {
                kind: 'fields',
                heading: 'Course at a glance',
                fields: [
                  { label: 'For', value: '{{courseGrades}}' },
                  { label: 'Duration', value: '{{duration}}' },
                  { label: 'Batches', value: '{{batches}}' },
                  { label: 'Fee', value: '{{courseFee|money}} a year, in 3 instalments' },
                  { label: 'Registration', value: '₹1,000, adjusted in the first instalment' },
                ],
              },
              {
                kind: 'table',
                heading: 'Scholarships (BrightPath Scholarship Test)',
                columns: ['Score', 'Fee waiver'],
                rows: [
                  { id: 's90', cells: ['90% and above', '50%'] },
                  { id: 's80', cells: ['80–89%', '30%'] },
                  { id: 's70', cells: ['70–79%', '15%'] },
                  { id: 's60', cells: ['60–69%', '10%'] },
                ],
              },
              {
                kind: 'text',
                heading: 'What you get',
                text: 'Printed study material, weekly tests with analysis, doubt clinics every day, a parent app with attendance and marks, and monthly parent–teacher meetings.',
              },
            ],
            footer: 'BrightPath Academy · Karve Road, Erandwane, Pune',
          },
        },
        caption: 'Here is the brochure for *{{course}}*.',
      },
      next: NEXT,
    },
    {
      id: NEXT,
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        buttons: [
          { id: 'apply', title: 'Apply now' },
          { id: 'test', title: 'Scholarship test' },
          { id: 'counsellor', title: 'Talk to counsellor' },
        ],
      },
      next: { apply: 's-name', test: 't-day', counsellor: 'to-counselling' },
    },
    { id: 'to-counselling', type: 'jump', data: { workflowKey: 'counselling' } },
    {
      id: 's-name',
      type: 'input',
      data: { prompt: "Student's full name, as on the school ID?", var: 'student', kind: 'name' },
      next: 's-dob',
    },
    {
      id: 's-dob',
      type: 'input',
      data: {
        prompt: "{{student}}'s date of birth (DD/MM/YYYY)?",
        var: 'studentDob',
        kind: 'date',
        past: true,
        error: 'Please type a date of birth in the past as DD/MM/YYYY, e.g. 21/06/2010.',
      },
      next: 's-phone',
    },
    {
      id: 's-phone',
      type: 'input',
      data: {
        prompt: "Parent's mobile number? Results and updates go there.",
        var: 'parentPhone',
        kind: 'phone',
      },
      next: 's-email',
    },
    {
      id: 's-email',
      type: 'input',
      data: {
        prompt: 'An email address for the admission letter?',
        var: 'parentEmail',
        kind: 'email',
      },
      next: 's-pin',
    },
    {
      id: 's-pin',
      type: 'input',
      data: {
        prompt: 'Home PIN code? We use it to suggest the nearest batch and bus route.',
        var: 'pincode',
        kind: 'pincode',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check the application',
        text: '*Student:* {{student}} (born {{studentDob}})\n*Course:* {{course}}\n*Parent mobile:* {{parentPhone}}\n*Email:* {{parentEmail}}\n*PIN code:* {{pincode}}\nRegistration fee: ₹1,000, adjusted in the first instalment.',
        buttons: [
          { id: 'pay', title: 'Pay and submit' },
          { id: 'edit', title: 'Edit details' },
          { id: 'later', title: 'Later' },
        ],
      },
      next: { pay: 'reg-fee', edit: 's-name', later: 'later' },
    },
    {
      id: 'later',
      type: 'end',
      data: {
        text: 'No problem — your details are not saved. Type *apply* any time to start again.',
        showMenu: true,
      },
    },
    {
      id: 'reg-fee',
      type: 'order',
      data: {
        set: { orderId: '$id:BPR' },
        order: {
          orderId: '{{orderId}}',
          title: 'Registration fee',
          items: [
            { id: 'reg', name: 'Registration — {{course}}', qty: 1, price: REGISTRATION_FEE },
          ],
          status: 'pending',
          payTitle: 'Pay now',
        },
      },
      next: { pay: 'reg-paid' },
    },
    {
      id: 'reg-paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{orderId}}',
          title: 'Payment received',
          items: [
            { id: 'reg', name: 'Registration — {{course}}', qty: 1, price: REGISTRATION_FEE },
          ],
          status: 'paid',
        },
      },
      next: 'application',
    },
    {
      id: 'application',
      type: 'ticket',
      data: {
        complete: true,
        set: { applicationId: '$id:BPA' },
        ticket: {
          ticketId: '{{applicationId}}',
          title: 'Application received',
          subtitle: '{{course}} · 2026–27',
          fields: [
            { label: 'Student', value: '{{student}}' },
            { label: 'Date of birth', value: '{{studentDob}}' },
            { label: 'Parent mobile', value: '{{parentPhone}}' },
            { label: 'Registration', value: 'Paid · {{orderId}}' },
            { label: 'Next step', value: 'Document check within 2 days' },
          ],
          qrData: 'brightpath://application/{{applicationId}}',
        },
        caption:
          'We have emailed a copy to {{parentEmail}}. Bring the original mark sheet and a photo ID for the document check.',
      },
      next: 'portal',
    },
    {
      id: 'portal',
      type: 'cta',
      data: {
        text: 'Track the application and upload documents on the parent portal.',
        actions: [
          { kind: 'url', title: 'Parent portal', url: ACADEMY.portal },
          { kind: 'call', title: 'Admissions desk', phone: ACADEMY.phone },
        ],
      },
      next: 'applied',
    },
    {
      id: 'applied',
      type: 'end',
      data: { text: 'Welcome to the BrightPath family, {{student}}!', showMenu: true },
    },
    {
      id: 't-day',
      type: 'list',
      data: {
        text: 'The BrightPath Scholarship Test is 90 minutes, at the centre, and free. Pick a date:',
        button: 'Test dates',
        sections: [],
        dynamic: { kind: 'days', count: 6, skipSundays: true, var: 'day' },
      },
      next: { pick: 't-slot' },
    },
    {
      id: 't-slot',
      type: 'list',
      data: {
        text: 'Test batches on {{dayLabel}}:',
        button: 'Choose batch',
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
          stepMin: 120,
          take: 4,
          var: 'slot',
        },
      },
      next: { pick: 't-name', 'other-day': 't-day' },
    },
    {
      id: 't-name',
      type: 'input',
      data: { prompt: "Student's full name for the hall ticket?", var: 'student', kind: 'name' },
      next: 'hall-ticket',
    },
    {
      id: 'hall-ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { rollNo: '$id:BST', hall: '$pick:Hall A|Hall B|Hall C' },
        ticket: {
          ticketId: '{{rollNo}}',
          title: 'Scholarship test hall ticket',
          subtitle: '{{course}} · BrightPath Academy',
          fields: [
            { label: 'Student', value: '{{student}}' },
            { label: 'Date', value: '{{dayLabel}}' },
            { label: 'Reporting', value: '{{slot|time}}' },
            { label: 'Hall', value: '{{hall}}' },
            { label: 'Bring', value: 'This QR, a photo ID, 2 pens' },
          ],
          qrData: 'brightpath://bst/{{rollNo}}',
        },
        caption:
          'Results come here on WhatsApp within 48 hours, with the scholarship you have earned.',
      },
      next: 'test-pin',
    },
    {
      id: 'test-pin',
      type: 'location',
      data: {
        location: {
          name: ACADEMY.name,
          address: ACADEMY.address,
          lat: ACADEMY.lat,
          lng: ACADEMY.lng,
        },
        caption:
          'Please report 20 minutes early. Calculators and phones are not allowed in the hall.',
      },
      next: 'test-remind',
    },
    {
      id: 'test-remind',
      type: 'reminder',
      data: {
        afterMs: 18_000,
        label: 'Scholarship test tomorrow',
        note: 'Real use: the evening before.',
      },
      next: { next: 'test-booked', later: 'test-push' },
    },
    {
      id: 'test-booked',
      type: 'end',
      data: {
        text: 'All the best, {{student}}! We will remind you the evening before.',
        showMenu: true,
      },
    },
    {
      id: 'test-push',
      type: 'image',
      data: {
        image: {
          icon: 'school',
          accent: 'indigo',
          title: 'Test tomorrow',
          subtitle: '{{hall}} · {{slot|time}}',
        },
        caption:
          'Hi {{student}}, your scholarship test is tomorrow at {{slot|time}} in {{hall}}. Sleep well, have a good breakfast, and bring your hall ticket and photo ID.',
      },
      next: 'test-push-end',
    },
    { id: 'test-push-end', type: 'end', data: { showMenu: true } },
  ],
});
