/**
 * The client stories Northstar's website shows: the challenge, what was built and the
 * before/after numbers. Fictional clients and figures.
 */
import type { IconKey } from '../../visuals';

export interface CaseStudy {
  id: string;
  client: string;
  title: string;
  industry: string;
  result: string;
  value: number;
  weeks: string;
  icon: IconKey;
  challenge: string;
  solution: string;
  metrics: readonly (readonly [string, string, string])[];
  stack: string;
}

export const CASE_STUDIES: readonly CaseStudy[] = [
  {
    id: 'cs-fintech',
    client: 'Paywise Finance',
    title: 'Loan onboarding app for a lender',
    industry: 'Fintech',
    result: '3× faster approvals',
    value: 2400000,
    weeks: '14 weeks',
    icon: 'loan',
    challenge: 'Loan applications took four days, with paper KYC and six hand-offs between teams.',
    solution:
      'A mobile app with video KYC, bank-statement parsing and an underwriting rules engine.',
    metrics: [
      ['Approval time', '4 days', '31 hours'],
      ['Drop-off at KYC', '46%', '18%'],
      ['Cost per loan', '₹1,450', '₹520'],
    ],
    stack: 'Flutter, Node.js, PostgreSQL, AWS',
  },
  {
    id: 'cs-retail',
    client: 'Kora Living',
    title: 'Headless store for a furniture brand',
    industry: 'Retail',
    result: '+42% conversion',
    value: 1200000,
    weeks: '10 weeks',
    icon: 'store',
    challenge:
      'A slow theme-based store lost shoppers on mobile and could not show room-wise looks.',
    solution:
      'A headless Next.js storefront with shoppable rooms, AR previews and one-tap UPI checkout.',
    metrics: [
      ['Mobile conversion', '1.2%', '1.7%'],
      ['Page load (mobile)', '5.8 s', '1.4 s'],
      ['Average order value', '₹18,400', '₹23,900'],
    ],
    stack: 'Next.js, Shopify Plus, Algolia, Vercel',
  },
  {
    id: 'cs-health',
    client: 'CarePoint Clinics',
    title: 'AI receptionist for a clinic chain',
    industry: 'Healthcare',
    result: '68% calls automated',
    value: 900000,
    weeks: '6 weeks',
    icon: 'doctor',
    challenge: 'Front desks across 14 clinics missed one call in three during peak hours.',
    solution:
      'A voice and WhatsApp agent that books, reschedules and answers FAQs in three languages.',
    metrics: [
      ['Missed calls', '33%', '4%'],
      ['Bookings per day', '410', '590'],
      ['Front-desk overtime', '120 h/month', '20 h/month'],
    ],
    stack: 'LLM agents, Twilio, WhatsApp Cloud API, GCP',
  },
  {
    id: 'cs-logistics',
    client: 'Swiftlane Logistics',
    title: 'Cloud move for a 3PL network',
    industry: 'Logistics',
    result: '−37% cloud bill',
    value: 1600000,
    weeks: '12 weeks',
    icon: 'truck',
    challenge: 'An ageing data centre caused monthly outages in the warehouse system during sales.',
    solution: 'A phased move to Kubernetes on AWS with autoscaling, blue-green deploys and FinOps.',
    metrics: [
      ['Uptime', '98.1%', '99.97%'],
      ['Monthly infra cost', '₹9.6 lakh', '₹6.0 lakh'],
      ['Release frequency', 'Monthly', 'Daily'],
    ],
    stack: 'AWS EKS, Terraform, GitHub Actions, Grafana',
  },
];
