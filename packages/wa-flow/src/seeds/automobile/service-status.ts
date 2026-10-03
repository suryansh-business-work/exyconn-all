/**
 * Service status: latest or typed job card → live progress → inspection report PDF with extra
 * work flagged → approve and pay for it, skip it, or talk to the advisor → "car ready" push →
 * final bill → gate pass → collect or home drop → rating.
 */
import { defineWorkflow } from '../../author';
import { rupees } from '../healthcare/data';
import { DEALER, EXTRA_WORK, SERVICE_ADVISOR } from './data';

const STATUS = 'status';
const WAIT = 'ready-wait';
const RATE = 'rate';

const extraItems = EXTRA_WORK.map((w) => ({ ...w }));

export const serviceStatus = defineWorkflow({
  key: 'service-status',
  name: 'Service status',
  description: 'Live progress, estimates and approvals for your car',
  keywords: ['status', 'service status', 'job card', 'is my car ready', 'car ready'],
  nodes: [
    {
      id: 'which',
      type: 'buttons',
      data: {
        text: 'Hi {{user.firstName}}, which job card would you like to check?',
        buttons: [
          {
            id: 'latest',
            title: 'My latest car',
            set: { jobNo: '$id:JC', vehicleNo: '$pick:MH 12 AB 1234|MH 14 KL 9087|MH 12 TX 5521' },
          },
          { id: 'type', title: 'Type job number' },
        ],
      },
      next: { latest: STATUS, type: 'job-input' },
    },
    {
      id: 'job-input',
      type: 'input',
      data: {
        prompt: 'Please type the job card number from your service receipt, e.g. JC-4KQ7W2.',
        var: 'jobNo',
        kind: 'text',
        set: { vehicleNo: '$pick:MH 12 AB 1234|MH 14 KL 9087|MH 12 TX 5521' },
      },
      next: STATUS,
    },
    {
      id: STATUS,
      type: 'image',
      data: {
        set: { bay: '$int:1:9' },
        image: {
          icon: 'tools',
          accent: 'blue',
          title: 'In service',
          subtitle: 'Bay {{bay}} · about 60% done',
        },
        caption:
          'Job {{jobNo|upper}} · {{vehicleNo}}\n• Received at the workshop — done\n• Inspection — done\n• Periodic service — in progress\n• Wash and final road test — next\nExpected ready by 6:30 pm today.',
      },
      next: 'report',
    },
    {
      id: 'report',
      type: 'document',
      data: {
        document: {
          fileName: 'AutoNova_Inspection_Report.pdf',
          fileType: 'PDF',
          pages: 2,
          sizeKb: 238,
          preview: {
            title: 'Vehicle inspection report',
            subtitle: '40-point check · AutoNova Service Centre, Baner',
            sections: [
              {
                kind: 'fields',
                heading: 'Vehicle',
                fields: [
                  { label: 'Owner', value: '{{user.fullName}}' },
                  { label: 'Registration', value: '{{vehicleNo}}' },
                  { label: 'Job card', value: '{{jobNo|upper}}' },
                  { label: 'Advisor', value: SERVICE_ADVISOR.name },
                ],
              },
              {
                kind: 'table',
                heading: 'Inspection',
                columns: ['Item', 'Finding', 'Action'],
                rows: [
                  { id: 'oil', cells: ['Engine oil', 'Due', 'Replaced'] },
                  { id: 'tyres', cells: ['Tyre tread', '4.5 mm', 'OK'] },
                  { id: 'battery', cells: ['Battery', '12.6 V', 'OK'] },
                  { id: 'wipers', cells: ['Wiper blades', 'Streaking', 'Replace'], flag: 'high' },
                  { id: 'rear', cells: ['Rear brake shoes', '2 mm left', 'Replace'], flag: 'high' },
                  { id: 'coolant', cells: ['Coolant', 'Topped up', 'OK'] },
                ],
              },
              {
                kind: 'table',
                heading: 'Extra work needing your approval',
                columns: ['Part', 'Qty', 'Price'],
                rows: EXTRA_WORK.map((w) => ({
                  id: w.id,
                  cells: [w.name, String(w.qty), rupees(w.price)],
                })),
              },
            ],
            footer: 'Prices include parts, labour and GST · valid for 7 days',
          },
        },
        caption:
          'We found two items that need attention. Nothing extra is done without your approval.',
      },
      next: 'approve',
    },
    {
      id: 'approve',
      type: 'buttons',
      data: {
        text: 'Shall we go ahead with the extra work? It adds about an hour.',
        buttons: [
          { id: 'approve', title: 'Approve extra work' },
          { id: 'skip', title: 'Service only' },
          { id: 'advisor', title: 'Talk to advisor' },
        ],
      },
      next: { approve: 'extra-order', skip: 'skip-ok', advisor: 'advisor' },
    },
    {
      id: 'extra-order',
      type: 'order',
      data: {
        set: { extraId: '$id:EX' },
        order: {
          orderId: '{{extraId}}',
          title: 'Extra work — {{vehicleNo}}',
          items: extraItems,
          status: 'pending',
          payTitle: 'Approve & pay',
        },
      },
      next: { pay: 'extra-paid' },
    },
    {
      id: 'extra-paid',
      type: 'order',
      data: {
        order: {
          orderId: '{{extraId}}',
          title: 'Extra work approved',
          items: extraItems,
          status: 'paid',
        },
      },
      next: WAIT,
    },
    {
      id: 'skip-ok',
      type: 'text',
      data: {
        text: 'Okay — only the booked service will be done. We have noted the wiper blades and rear brake shoes for your next visit.',
      },
      next: WAIT,
    },
    {
      id: WAIT,
      type: 'reminder',
      data: { afterMs: 15_000, label: 'Your car is ready', note: 'Real use: after the road test.' },
      next: { next: 'wait-end', later: 'ready' },
    },
    {
      id: 'wait-end',
      type: 'end',
      data: {
        text: 'We will message you here the moment {{vehicleNo}} is ready.',
        showMenu: true,
      },
    },
    {
      id: 'ready',
      type: 'order',
      data: {
        set: { invoiceId: '$id:INV', loyalty: '$price:300:20' },
        order: {
          orderId: '{{invoiceId}}',
          title: '{{vehicleNo}} is ready',
          items: [
            { id: 'service', name: 'Periodic service', qty: 1, price: 4499 },
            { id: 'wash', name: 'Foam wash and vacuum', qty: 1, price: 0 },
          ],
          adjustments: [{ id: 'loyalty', label: 'Loyalty points', amount: '-{{loyalty}}' }],
          status: 'pending',
          payTitle: 'Pay & collect',
        },
      },
      next: { pay: 'gate-pass' },
    },
    {
      id: 'gate-pass',
      type: 'ticket',
      data: {
        complete: true,
        ticket: {
          ticketId: '{{invoiceId}}',
          title: 'Gate pass',
          subtitle: 'AutoNova Service Centre, Baner',
          fields: [
            { label: 'Car', value: '{{vehicleNo}}' },
            { label: 'Job card', value: '{{jobNo|upper}}' },
            { label: 'Owner', value: '{{user.fullName}}' },
            { label: 'Status', value: 'Paid · ready for delivery' },
          ],
          qrData: 'autonova://gatepass/{{invoiceId}}?job={{jobNo}}',
        },
        caption: 'Show this at the delivery bay. The tax invoice is in your email.',
      },
      next: 'collect',
    },
    {
      id: 'collect',
      type: 'buttons',
      data: {
        text: 'How would you like to get the car back?',
        buttons: [
          { id: 'self', title: 'I will collect' },
          { id: 'drop', title: 'Drop it home' },
        ],
      },
      next: { self: 'pin', drop: 'drop-addr' },
    },
    {
      id: 'pin',
      type: 'location',
      data: {
        location: {
          name: DEALER.workshop,
          address: DEALER.address,
          lat: DEALER.lat,
          lng: DEALER.lng,
        },
        caption: 'Delivery bay is open until 8 pm. Please bring the RC or your photo ID.',
      },
      next: RATE,
    },
    {
      id: 'drop-addr',
      type: 'input',
      data: {
        prompt: 'Where should we drop it? Please type the address with a landmark.',
        var: 'address',
        kind: 'text',
        error: 'Please type a little more of the address so our driver can find you.',
      },
      next: 'drop-ok',
    },
    {
      id: 'drop-ok',
      type: 'text',
      data: {
        text: 'Done — our driver will drop {{vehicleNo}} at {{address}} within 2 hours. He will call before leaving.',
      },
      next: RATE,
    },
    {
      id: RATE,
      type: 'buttons',
      data: {
        text: 'How was your service experience with AutoNova, {{user.firstName}}?',
        buttons: [
          { id: 'excellent', title: 'Excellent' },
          { id: 'good', title: 'Good' },
          { id: 'poor', title: 'Poor' },
        ],
      },
      next: { excellent: 'review', good: 'review', poor: 'poor' },
    },
    {
      id: 'review',
      type: 'cta',
      data: {
        text: 'Thank you! A quick review helps other car owners in Pune find us.',
        actions: [{ kind: 'url', title: 'Write a review', url: DEALER.review }],
      },
      next: 'review-end',
    },
    {
      id: 'review-end',
      type: 'end',
      data: { text: 'Happy driving, {{user.firstName}}!', showMenu: true },
    },
    {
      id: 'poor',
      type: 'input',
      data: {
        prompt: 'We are sorry. What went wrong?',
        var: 'feedback',
        kind: 'text',
      },
      next: 'poor-ack',
    },
    {
      id: 'poor-ack',
      type: 'end',
      data: {
        set: { feedbackId: '$id:FB' },
        text: 'Thank you for telling us. Our works manager will call you within 24 hours (reference {{feedbackId}}).',
        showMenu: true,
      },
    },
    {
      id: 'advisor',
      type: 'handoff',
      data: {
        agentName: SERVICE_ADVISOR.agentName,
        text: "Hi {{user.firstName}}, Rohit here, your service advisor. I'm standing next to {{vehicleNo}} — happy to show you the worn parts on a video call before you decide.",
      },
      next: 'advisor-card',
    },
    {
      id: 'advisor-card',
      type: 'contact',
      data: {
        contact: {
          name: SERVICE_ADVISOR.name,
          phone: SERVICE_ADVISOR.phone,
          role: SERVICE_ADVISOR.role,
          organisation: 'AutoNova Motors',
        },
      },
      next: 'advisor-end',
    },
    {
      id: 'advisor-end',
      type: 'end',
      data: { showMenu: true },
    },
  ],
});
