/**
 * Report a civic issue: described in the citizen's own words (an `ai` node picks the category
 * and the landmark) or picked from a list → where, and the area PIN → complaint ticket → a
 * "resolved" push that asks whether it is really fixed: rate the work, or reopen with the help desk.
 */
import { defineWorkflow, type AuthorNode } from '../../author';
import { HELP_DESK, ISSUES, type IssueCategory } from './data';

const WHERE = 'where';
const ASK_WHERE = 'ask-where';
const CATEGORY = 'category';

function categoryNotice(issue: IssueCategory): AuthorNode {
  return {
    id: `cat-${issue.id}`,
    type: 'notice',
    data: {
      set: { issue: issue.title, dept: issue.department, sla: issue.sla },
      text: 'Category: {{issue}} · {{dept}} team · usually fixed within {{sla}}',
    },
    next: WHERE,
  };
}

export const complaint = defineWorkflow({
  key: 'complaint',
  name: 'Report a civic issue',
  description: 'Streetlights, garbage, water, roads and drains',
  keywords: ['complaint', 'report', 'streetlight', 'garbage', 'pothole', 'no water', 'drain'],
  nodes: [
    {
      id: 'describe',
      type: 'ai',
      data: {
        set: { landmark: '', since: '', areaPin: '' },
        prompt:
          'Tell us what is wrong and where, in your own words — e.g. "streetlight not working near Ward 12 park since 3 days" or "kachra nahi utha 2 din se, Gandhi Chowk".',
        intents: ISSUES.map((i) => ({ id: i.id, description: `${i.title}: ${i.description}` })),
        entities: [
          {
            name: 'landmark',
            kind: 'location',
            description: 'Street, landmark or ward where the problem is',
          },
          { name: 'since', kind: 'text', description: 'Since when, e.g. "3 days"' },
        ],
        retry: 'Sorry, I could not tell what the problem is. Please pick a category.',
      },
      next: {
        ...Object.fromEntries(ISSUES.map((i) => [i.id, `cat-${i.id}`])),
        fallback: CATEGORY,
      },
    },
    {
      id: CATEGORY,
      type: 'list',
      data: {
        text: 'What kind of problem is it?',
        button: 'Choose category',
        sections: [
          {
            id: 'issues',
            title: 'Categories',
            rows: ISSUES.map((i) => ({ id: i.id, title: i.title, description: i.description })),
          },
        ],
      },
      next: Object.fromEntries(ISSUES.map((i) => [i.id, `cat-${i.id}`])),
    },
    ...ISSUES.map(categoryNotice),
    {
      id: WHERE,
      type: 'condition',
      data: {
        note: 'The AI may already have the landmark.',
        cases: [{ id: 'missing', var: 'landmark', op: 'empty' }],
      },
      next: { missing: ASK_WHERE, else: 'confirm-where' },
    },
    {
      id: 'confirm-where',
      type: 'buttons',
      data: {
        text: 'Is this the right place?\n*{{landmark}}*',
        buttons: [
          { id: 'yes', title: 'Yes' },
          { id: 'no', title: 'Change place' },
        ],
      },
      next: { yes: 'has-pin', no: ASK_WHERE },
    },
    {
      id: ASK_WHERE,
      type: 'input',
      data: {
        prompt: 'Where exactly is it? Type the street, a landmark or the ward number.',
        var: 'landmark',
        kind: 'text',
        error: 'Please type a street name or landmark so the team can find it.',
      },
      next: 'has-pin',
    },
    {
      id: 'has-pin',
      type: 'condition',
      data: {
        note: 'After "Change category" the PIN is already known.',
        cases: [{ id: 'known', var: 'areaPin', op: 'notEmpty' }],
      },
      next: { known: 'review', else: 'pin' },
    },
    {
      id: 'pin',
      type: 'input',
      data: {
        prompt: 'And the PIN code of the area?',
        var: 'areaPin',
        kind: 'pincode',
      },
      next: 'review',
    },
    {
      id: 'review',
      type: 'buttons',
      data: {
        header: 'Check your complaint',
        text: '*Problem:* {{issue}}\n*Where:* {{landmark}}, {{areaPin}}\n*Department:* {{dept}}\n*Reported by:* {{user.fullName}}',
        buttons: [
          { id: 'submit', title: 'Submit' },
          { id: 'edit', title: 'Change category' },
          { id: 'cancel', title: 'Cancel' },
        ],
      },
      next: { submit: 'ticket', edit: CATEGORY, cancel: 'not-filed' },
    },
    {
      id: 'ticket',
      type: 'ticket',
      data: {
        complete: true,
        set: { complaintId: '$id:CMP', filedAt: '$now' },
        ticket: {
          ticketId: '{{complaintId}}',
          title: 'Complaint registered',
          subtitle: '{{issue}} · {{dept}} team',
          fields: [
            { label: 'Where', value: '{{landmark}}' },
            { label: 'PIN code', value: '{{areaPin}}' },
            { label: 'Filed', value: '{{filedAt|date}}, {{filedAt|time}}' },
            { label: 'Target', value: 'Within {{sla}}' },
            { label: 'Reported by', value: '{{user.fullName}}' },
          ],
          qrData: 'https://sundarpur-civic.example/c/{{complaintId}}',
        },
        caption: 'Thank you, {{user.firstName}}. The {{dept}} team has been assigned.',
      },
      next: 'remind',
    },
    {
      id: 'remind',
      type: 'reminder',
      data: {
        afterMs: 20_000,
        label: 'Complaint update',
        note: 'Real use: when the crew closes it.',
      },
      next: { next: 'logged', later: 'resolved' },
    },
    {
      id: 'logged',
      type: 'end',
      data: {
        text: 'We will update you here. Type *complaint* to report something else.',
        showMenu: true,
      },
    },
    {
      id: 'resolved',
      type: 'image',
      data: {
        image: {
          icon: 'check',
          accent: 'green',
          title: 'Marked resolved',
          subtitle: '{{complaintId}}',
        },
        caption:
          'Update on {{complaintId}}: the {{dept}} crew reports the {{issue}} problem at {{landmark}} is fixed.',
      },
      next: 'fixed',
    },
    {
      id: 'fixed',
      type: 'buttons',
      data: {
        text: 'Is it really fixed?',
        buttons: [
          { id: 'yes', title: 'Yes, fixed' },
          { id: 'no', title: 'Not fixed' },
        ],
      },
      next: { yes: 'rate', no: 'reopen' },
    },
    {
      id: 'rate',
      type: 'buttons',
      data: {
        text: 'How would you rate the work?',
        buttons: [
          { id: 'good', title: 'Good', set: { rating: '5' } },
          { id: 'ok', title: 'Okay', set: { rating: '3' } },
          { id: 'poor', title: 'Poor', set: { rating: '1' } },
        ],
      },
      next: { good: 'thanks', ok: 'thanks', poor: 'thanks' },
    },
    {
      id: 'thanks',
      type: 'end',
      data: {
        text: 'Thank you for helping keep Sundarpur clean and safe, {{user.firstName}}.',
        showMenu: true,
      },
    },
    {
      id: 'reopen',
      type: 'handoff',
      data: {
        agentName: HELP_DESK.agentName,
        text: "Sorry about that, {{user.firstName}}. I'm Rekha from the help desk — I have reopened {{complaintId}} and escalated it to the {{dept}} supervisor. Could you share a photo of the spot?",
      },
      next: 'reopen-end',
    },
    {
      id: 'reopen-end',
      type: 'end',
      data: { showMenu: true },
    },
    {
      id: 'not-filed',
      type: 'end',
      data: { text: 'No complaint was filed.', showMenu: true },
    },
  ],
});
