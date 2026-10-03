/**
 * Kaveri Talent Partners' dummy catalogue: the agency, its recruiters, open roles at
 * (fictional) client companies by function, and the documents a selected candidate submits.
 * Fictional names, numbers and `.example` links.
 */
export const AGENCY = {
  name: 'Kaveri Talent Partners, Hitech City',
  phone: '+91 40 4000 3300',
  address: '3rd Floor, Lakeview Plaza, Road No. 2, Hitech City, Hyderabad 500081',
  lat: 17.4435,
  lng: 78.3772,
  website: 'https://kaveritalent.example',
  jobs: 'https://kaveritalent.example/jobs',
  interview: 'https://meet.kaveritalent.example/interview',
  upload: 'https://kaveritalent.example/upload',
  privacy: 'https://kaveritalent.example/privacy',
} as const;

export const RECRUITER = {
  agentName: 'Shruti Nair (Recruiter)',
  name: 'Shruti Nair',
  role: 'Senior Recruiter, Technology & Sales',
  phone: '+91 40 4000 3311',
} as const;

export const HR_PARTNER = {
  agentName: 'Farhan Ali (HR Onboarding)',
  name: 'Farhan Ali',
  role: 'HR Onboarding Partner',
  phone: '+91 40 4000 3320',
} as const;

export interface Job {
  id: string;
  title: string;
  client: string;
  city: string;
  mode: string;
  /** Yearly CTC band, as shown. */
  ctc: string;
  /** Minimum years of experience — the screening gate. 0, 3 or 5. */
  minExp: number;
  skills: string;
}

export interface JobFunction {
  key: string;
  name: string;
  description: string;
  jobs: readonly Job[];
}

/** Three functions get a condition case each; Operations & Finance is the condition's `else`. */
export const FUNCTIONS: readonly JobFunction[] = [
  {
    key: 'tech',
    name: 'Technology',
    description: 'Engineering, data, QA and DevOps',
    jobs: [
      {
        id: 'backend',
        title: 'Senior Backend Engineer',
        client: 'Fintrail Payments',
        city: 'Hyderabad',
        mode: 'Hybrid',
        ctc: '₹28–38 LPA',
        minExp: 5,
        skills: 'Node.js or Go, PostgreSQL, Kafka, AWS',
      },
      {
        id: 'frontend',
        title: 'Frontend Developer',
        client: 'Medisphere Labs',
        city: 'Bengaluru',
        mode: 'Remote',
        ctc: '₹12–18 LPA',
        minExp: 3,
        skills: 'React, TypeScript, accessibility, testing',
      },
      {
        id: 'data-analyst',
        title: 'Data Analyst',
        client: 'Cartwheel Retail',
        city: 'Pune',
        mode: 'On-site',
        ctc: '₹7–11 LPA',
        minExp: 0,
        skills: 'SQL, Excel, Power BI, basic Python',
      },
    ],
  },
  {
    key: 'sales',
    name: 'Sales & Marketing',
    description: 'Inside sales, field sales and growth',
    jobs: [
      {
        id: 'ae',
        title: 'Account Executive (B2B)',
        client: 'Voltgrid Energy',
        city: 'Mumbai',
        mode: 'Hybrid',
        ctc: '₹14–20 LPA + incentives',
        minExp: 3,
        skills: 'Enterprise selling, CRM hygiene, negotiation',
      },
      {
        id: 'isr',
        title: 'Inside Sales Associate',
        client: 'Cartwheel Retail',
        city: 'Hyderabad',
        mode: 'On-site',
        ctc: '₹4.5–6 LPA + incentives',
        minExp: 0,
        skills: 'Clear Hindi and English, calling, follow-ups',
      },
      {
        id: 'growth',
        title: 'Growth Marketing Lead',
        client: 'Medisphere Labs',
        city: 'Bengaluru',
        mode: 'Hybrid',
        ctc: '₹24–32 LPA',
        minExp: 5,
        skills: 'Performance marketing, CRO, analytics',
      },
    ],
  },
  {
    key: 'design',
    name: 'Design & Product',
    description: 'Product managers and UX designers',
    jobs: [
      {
        id: 'pm',
        title: 'Product Manager',
        client: 'Fintrail Payments',
        city: 'Hyderabad',
        mode: 'Hybrid',
        ctc: '₹30–42 LPA',
        minExp: 5,
        skills: 'Payments, discovery, roadmaps, SQL',
      },
      {
        id: 'ux',
        title: 'UX Designer',
        client: 'Agrolink Foods',
        city: 'Chennai',
        mode: 'Remote',
        ctc: '₹10–15 LPA',
        minExp: 3,
        skills: 'Figma, research, design systems',
      },
    ],
  },
];

export const OPERATIONS: JobFunction = {
  key: 'operations',
  name: 'Operations & Finance',
  description: 'Supply chain, accounts and customer support',
  jobs: [
    {
      id: 'scm',
      title: 'Supply Chain Executive',
      client: 'Agrolink Foods',
      city: 'Chennai',
      mode: 'On-site',
      ctc: '₹5–7 LPA',
      minExp: 0,
      skills: 'Inventory, vendor follow-up, SAP basics',
    },
    {
      id: 'accounts',
      title: 'Accounts Manager',
      client: 'Voltgrid Energy',
      city: 'Mumbai',
      mode: 'On-site',
      ctc: '₹12–16 LPA',
      minExp: 5,
      skills: 'CA Inter or MBA Finance, GST, Tally, audits',
    },
    {
      id: 'cx',
      title: 'Customer Support Lead',
      client: 'Medisphere Labs',
      city: 'Hyderabad',
      mode: 'On-site',
      ctc: '₹6–8 LPA',
      minExp: 3,
      skills: 'Team handling, CSAT, Freshdesk or Zendesk',
    },
  ],
};

export const ALL_FUNCTIONS: readonly JobFunction[] = [...FUNCTIONS, OPERATIONS];

/** Expected-CTC bands for the buttons-only path when the free-text reading fails. */
export const CTC_BANDS = [
  { id: 'ctc-1', title: 'Up to ₹6 LPA', description: 'Up to ₹50,000 a month' },
  { id: 'ctc-2', title: '₹6–12 LPA', description: '₹50,000 – ₹1 lakh a month' },
  { id: 'ctc-3', title: '₹12–25 LPA', description: '₹1 – 2 lakh a month' },
  { id: 'ctc-4', title: '₹25–40 LPA', description: '₹2 – 3.3 lakh a month' },
  { id: 'ctc-5', title: 'Above ₹40 LPA', description: 'Senior and leadership roles' },
] as const;

/** Documents a selected candidate submits before the offer. */
export const DOCUMENTS = [
  {
    id: 'resume',
    title: 'Updated resume',
    description: 'PDF or Word, max 5 MB',
    file: 'Resume.pdf',
  },
  {
    id: 'id-proof',
    title: 'Photo ID',
    description: 'Aadhaar (masked), passport or driving licence',
    file: 'Photo_ID.pdf',
  },
  {
    id: 'education',
    title: 'Education certificates',
    description: 'Highest degree and mark sheets',
    file: 'Degree_Certificate.pdf',
  },
  {
    id: 'experience',
    title: 'Experience letters',
    description: 'Relieving or experience letter from past employers',
    file: 'Experience_Letter.pdf',
  },
  {
    id: 'payslips',
    title: 'Last 3 payslips',
    description: 'Or a salary certificate from your employer',
    file: 'Payslips_Jul-Sep.pdf',
  },
  {
    id: 'photo',
    title: 'Passport photo',
    description: 'JPG on a plain background',
    file: 'Photo.jpg',
  },
] as const;

/** The interview loop, for the prep guide. */
export const ROUNDS = [
  { id: 'r1', cells: ['1', 'Recruiter screen', '20 min', 'Phone'] },
  { id: 'r2', cells: ['2', 'Skills interview', '60 min', 'Video'] },
  { id: 'r3', cells: ['3', 'Hiring manager', '45 min', 'Video or in person'] },
  { id: 'r4', cells: ['4', 'HR and offer discussion', '30 min', 'Video'] },
] as const;
