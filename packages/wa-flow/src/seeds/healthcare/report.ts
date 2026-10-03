/**
 * Report notification: the customer is told the report will arrive here, and a reminder push
 * delivers the PDF (patient fields, CBC and lipid tables with flagged rows, remarks) with
 * buttons to book a follow-up, talk to a doctor or go back to the menu.
 */
import { defineWorkflow } from '../../author';
import { DUTY_DOCTOR, HOSPITAL } from './data';

export const report = defineWorkflow({
  key: 'report',
  name: 'My lab reports',
  description: 'Get your report here the moment it is ready',
  keywords: ['report', 'lab report', 'results', 'test result', 'my report'],
  nodes: [
    {
      id: 'intro',
      type: 'text',
      data: {
        set: { reportId: '$id:LR', collected: '$now', referredBy: 'Dr. Suresh Babu' },
        text: 'Hi {{user.firstName}}, your sample {{reportId}} for *Complete Blood Count + Lipid Profile* is being tested at CityCare Diagnostics.\nWe will message you here the moment your report is ready.',
      },
      next: 'privacy',
    },
    {
      id: 'privacy',
      type: 'notice',
      data: { text: 'Reports are sent only to the mobile number registered with CityCare.' },
      next: 'wait',
    },
    {
      id: 'wait',
      type: 'reminder',
      data: {
        afterMs: 12_000,
        label: 'Your lab report is ready',
        note: 'Real use: when the lab signs off.',
      },
      next: { next: 'waiting', later: 'ready' },
    },
    {
      id: 'waiting',
      type: 'end',
      data: {
        text: 'You can keep chatting meanwhile — the report will appear here on its own.',
        showMenu: true,
      },
    },
    {
      id: 'ready',
      type: 'document',
      data: {
        complete: true,
        document: {
          fileName: 'CityCare_CBC_Lipid_Report.pdf',
          fileType: 'PDF',
          pages: 3,
          sizeKb: 412,
          preview: {
            title: 'Laboratory report',
            subtitle: 'Complete Blood Count + Lipid Profile',
            sections: [
              {
                kind: 'fields',
                heading: 'Patient',
                fields: [
                  { label: 'Name', value: '{{user.fullName}}' },
                  { label: 'Report ID', value: '{{reportId}}' },
                  { label: 'Collected', value: '{{collected|date}}, {{collected|time}}' },
                  { label: 'Referred by', value: '{{referredBy}}' },
                  { label: 'Lab', value: 'CityCare Diagnostics, Indiranagar (NABL)' },
                ],
              },
              {
                kind: 'table',
                heading: 'Complete Blood Count',
                columns: ['Test', 'Result', 'Unit', 'Reference range'],
                rows: [
                  { id: 'hb', cells: ['Haemoglobin', '11.2', 'g/dL', '12.0 – 15.5'], flag: 'low' },
                  { id: 'rbc', cells: ['RBC count', '4.3', 'million/µL', '4.0 – 5.2'] },
                  { id: 'hct', cells: ['Haematocrit (PCV)', '35.1', '%', '36 – 46'], flag: 'low' },
                  { id: 'wbc', cells: ['Total WBC count', '7,850', 'cells/µL', '4,000 – 11,000'] },
                  { id: 'plt', cells: ['Platelet count', '2.6', 'lakh/µL', '1.5 – 4.1'] },
                  { id: 'esr', cells: ['ESR', '28', 'mm/hr', '0 – 20'], flag: 'high' },
                ],
              },
              {
                kind: 'table',
                heading: 'Lipid profile (fasting)',
                columns: ['Test', 'Result', 'Unit', 'Reference range'],
                rows: [
                  { id: 'tc', cells: ['Total cholesterol', '228', 'mg/dL', '< 200'], flag: 'high' },
                  { id: 'ldl', cells: ['LDL cholesterol', '152', 'mg/dL', '< 100'], flag: 'high' },
                  { id: 'hdl', cells: ['HDL cholesterol', '38', 'mg/dL', '> 40'], flag: 'low' },
                  { id: 'tg', cells: ['Triglycerides', '142', 'mg/dL', '< 150'] },
                  { id: 'vldl', cells: ['VLDL cholesterol', '28', 'mg/dL', '< 30'] },
                ],
              },
              {
                kind: 'text',
                heading: "Doctor's remarks",
                text: 'Mild anaemia with raised ESR, and raised LDL with low HDL cholesterol. Suggest a review with your physician, an iron-rich diet low in saturated fat, regular exercise, and a repeat lipid profile in 3 months. Please read these results together with your clinical history.',
              },
            ],
            footer:
              'Electronically verified by Dr. Farhan Siddiqui, MD (Pathology) · CityCare Diagnostics',
          },
        },
        caption:
          'Your report is ready, {{user.firstName}}. A few results are outside the normal range — they are highlighted.',
      },
      next: 'next-steps',
    },
    {
      id: 'next-steps',
      type: 'buttons',
      data: {
        text: 'What would you like to do next?',
        footer: 'Reports stay in this chat and in the CityCare app',
        buttons: [
          { id: 'book', title: 'Book follow-up' },
          { id: 'doctor', title: 'Talk to doctor' },
          { id: 'menu', title: 'Main menu' },
        ],
      },
      next: { book: 'to-appointment', doctor: 'doctor', menu: 'menu-end' },
    },
    {
      id: 'to-appointment',
      type: 'jump',
      data: { workflowKey: 'appointment' },
    },
    {
      id: 'doctor',
      type: 'handoff',
      data: {
        agentName: DUTY_DOCTOR.agentName,
        text: "Hi {{user.firstName}}, I'm Dr. Ananya Rao. I have report {{reportId}} open. Your haemoglobin is a little low and your LDL cholesterol is high — neither is urgent, but both are worth a review. What would you like to ask?",
      },
      next: 'doctor-cta',
    },
    {
      id: 'doctor-cta',
      type: 'cta',
      data: {
        text: 'You can also call me, or switch to video.',
        actions: [
          { kind: 'call', title: 'Call Dr. Rao', phone: DUTY_DOCTOR.phone },
          { kind: 'url', title: 'Video consult', url: HOSPITAL.teleconsult },
        ],
      },
      next: 'doctor-end',
    },
    {
      id: 'doctor-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'menu-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
