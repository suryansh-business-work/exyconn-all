/**
 * Job fixtures — content migrated verbatim from the Astro website
 * (`exyconn-website/src/data/career/*.career.data.ts`). The `jobDescription` and
 * `jobResponsibilities` fields are rich HTML rendered as-is by the public site.
 */

import type { JobInput } from '../../website.inputs';

export const jobFixtures: JobInput[] = [
  {
    jobCode: 'EXY-BD-001',
    companySlug: 'exyconn',
    title: 'International Business Development Executive',
    category: 'Sales',
    skillSet: [
      'LinkedIn Sales Navigator',
      'Upwork / Freelancer',
      'Cold Email Outreach',
      'B2B Sales',
      'CRM Tools',
      'Tech Services Sales',
      'SaaS / AI Understanding',
      'Client Relationship Management',
    ],
    shortJobDescription:
      "Drive international growth by acquiring high-value clients across US & UK markets. You'll lead B2B sales strategy for our AI/SaaS/Cloud solutions, working with startups and enterprises building next-gen products.",
    jobDescription: `
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0">🚀 About This Role</h4>
        <p class="text-base text-gray-700 leading-7 mb-4">We are hiring an <strong class="text-gray-900 font-semibold">International Business Development Executive</strong> who can independently generate, qualify, and close international clients, mainly from US & UK markets, using multiple outbound and inbound channels.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This role is <strong class="text-gray-900 font-semibold">not sales-call heavy only</strong> — it's about research, positioning, outreach, relationship-building, and deal conversion.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">We are looking for someone who doesn't just wait for leads — but <strong class="text-gray-900 font-semibold">creates opportunities globally</strong>.</p>
        
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🌐 International Client Acquisition</h4>
        <p class="text-base text-gray-700 leading-7 mb-3">Generate high-quality US/UK clients using:</p>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">LinkedIn outreach & Sales Navigator</strong></span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Freelance platforms</strong> (Upwork, Freelancer, Toptal-style ecosystems)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Community research</strong> (founder groups, startup communities, Slack/Discord, Indie Hackers, Reddit, Product Hunt, etc.)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Cold & warm email strategies</strong></span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Strategic partnerships & referrals</strong></span></li>
        </ul>
        <p class="text-base text-gray-700 leading-7 mb-4">Identify companies/startups that need MVPs, SaaS, AI, or engineering teams. Build <strong class="text-gray-900 font-semibold">long-term client relationships</strong> (not one-time deals).</p>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">📊 Strategy & Market Intelligence</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Research international market trends, competitor positioning, and pricing</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Identify new platforms or untapped channels for client acquisition</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Propose client acquisition strategies aligned with Exyconn's services</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Define ICPs (Ideal Client Profiles) for US & UK markets</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🤝 Sales & Closure</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Handle initial discovery calls with international clients</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Understand business pain points and convert them into proposals</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Coordinate with tech & product teams for solution mapping</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Close deals and ensure smooth handover till project kickoff</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">💰 Compensation & Incentives</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Fixed Salary:</strong> As per current market standards (No variable dependency)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Incentive:</strong> 1% commission on total client payments till project completion (Yes — you earn as long as the project runs)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>No income uncertainty, no unrealistic targets</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">⏰ Work Timings</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>US / UK aligned shifts</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Final shift plan will be decided strategically, not blindly</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>Focus is on <strong class="text-gray-900 font-semibold">results, not micromanagement</strong></span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Generate high-quality leads from US/UK markets using LinkedIn, Upwork, communities, and cold outreach</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Research and identify companies/startups that need MVPs, SaaS, AI, or engineering teams</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Build and maintain long-term client relationships</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Research international market trends, competitor positioning, and pricing</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Identify new platforms or untapped channels for client acquisition</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Define ICPs (Ideal Client Profiles) for US & UK markets</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Handle initial discovery calls with international clients</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Convert business pain points into winning proposals</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Coordinate with tech & product teams for solution mapping</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Close deals and ensure smooth handover till project kickoff</span></li>
        </ul>
      `,
    requirements: [
      '2–5 years of international business development / sales experience',
      'Proven experience bringing US/UK clients',
      'Strong communication skills (spoken & written English)',
      'Hands-on experience with LinkedIn outreach',
      'Experience with Upwork / Freelancer / similar platforms',
      'Understanding of tech services, SaaS, MVPs, AI, or software development',
      'Self-driven, research-oriented, and execution-focused mindset',
    ],
    niceToHave: [
      'Existing US/UK client network',
      'Experience selling AI / SaaS / startup services',
      'Experience in agency or product-based companies',
      'Knowledge of CRM tools & outreach automation',
    ],
    benefits: [
      'Fixed Salary (No Variable Dependency)',
      '1% Commission on Project Payments',
      'Flexible US/UK Shift Timings',
      'Results-Focused Culture',
    ],
    location: 'Remote',
    jobType: 'Full Time',
    experienceLevel: 'Mid Level',
    workMode: 'Remote',
    salaryRange: 'Market Standards + 1% Commission',
    jobPostDate: new Date('2026-01-08'),
    isActive: true,
    isFeatured: true,
  },
  {
    jobCode: 'SPT-FIN-001',
    companySlug: 'spentiva',
    title: 'Finance SaaS Experience Specialist',
    category: 'Product',
    skillSet: [
      'Financial Software',
      'SaaS Implementation',
      'User Onboarding',
      'Customer Success',
      'Expense Management',
      'Data Analysis',
    ],
    shortJobDescription:
      "Be the bridge between our 50K+ users and our AI-powered expense platform. You'll drive user success, onboard businesses, and help customers achieve their financial management goals with smart automation.",
    jobDescription: `
        <p class="text-base text-gray-700 leading-7 mb-4">We're looking for a Finance SaaS Experience Specialist to help our 50K+ users get the most out of Spentiva's AI-powered expense tracking platform. You'll be the bridge between our product and our users, ensuring they achieve their financial management goals.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This role combines deep knowledge of personal and business finance with SaaS expertise. You'll work closely with product, engineering, and marketing to improve user experience and drive adoption.</p>
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">What You'll Do:</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Guide users through onboarding and advanced features</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Create educational content about expense management best practices</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Analyze user behavior to identify improvement opportunities</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Provide feedback to product team based on user insights</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span>Build relationships with power users and gather testimonials</span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Develop and execute user onboarding programs</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Create help documentation, tutorials, and video guides</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Monitor user engagement metrics and reduce churn</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Conduct user interviews and gather product feedback</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Collaborate with marketing on user success stories</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Train and support customer success team</span></li>
        </ul>
      `,
    requirements: [
      '3+ years experience in SaaS customer success or product roles',
      'Strong understanding of personal finance and expense management',
      'Experience with financial software or fintech products',
      'Excellent communication and presentation skills',
      'Data-driven mindset with analytics experience',
      'Ability to create engaging educational content',
    ],
    niceToHave: [
      'Background in accounting or finance',
      'Experience with AI-powered products',
      'Knowledge of expense management workflows',
      'Multi-currency and international finance experience',
    ],
    benefits: ['Equity Options', 'Health Insurance', 'Learning Stipend'],
    location: 'Remote / India',
    jobType: 'Full Time',
    experienceLevel: 'Mid Level',
    workMode: 'Remote',
    salaryRange: 'As per market standard',
    jobPostDate: new Date('2026-01-06'),
    isActive: true,
    isFeatured: true,
  },
  {
    jobCode: 'SIB-PM-001',
    companySlug: 'sibera',
    title: 'Business/ERP SaaS Product Manager',
    category: 'Product',
    skillSet: [
      'Product Management',
      'ERP Systems',
      'B2B SaaS',
      'User Research',
      'Agile',
      'Business Process',
      'Analytics',
    ],
    shortJobDescription:
      "Own the product roadmap for our all-in-one ERP suite covering Support, Tasks, Invoicing, Time Tracking & IoT. You'll work with enterprise customers, lead user research, and drive features that save businesses 20%+ in operational costs.",
    jobDescription: `
        <p class="text-base text-gray-700 leading-7 mb-4">We're looking for a Business/ERP SaaS Product Manager to lead product development for Sibera's integrated business management suite. You'll own the roadmap for our Support, Tasks, Files, Invoicing, Time Tracking, and IoT modules.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This is a strategic role requiring deep understanding of business operations, ERP workflows, and SaaS product development. You'll work with customers, engineering, and design to build software that businesses love.</p>
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">Product Areas You'll Own:</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Unified Dashboard & Analytics</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Support Ticketing System</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Task & Project Management</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Invoice & Billing Module</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Time Tracking & Productivity</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>IoT Device Integration</span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Define and communicate product vision and roadmap</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Conduct customer research and competitive analysis</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Write detailed PRDs and user stories</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Prioritize features based on business impact and user needs</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Collaborate with engineering on sprint planning</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Analyze product metrics and drive improvements</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Present product updates to leadership and customers</span></li>
        </ul>
      `,
    requirements: [
      '4+ years of product management experience',
      'Experience with B2B SaaS or ERP software',
      'Strong understanding of business operations and workflows',
      'Excellent analytical and problem-solving skills',
      'Data-driven decision making mindset',
      'Experience with Agile development processes',
      'Outstanding communication and presentation skills',
    ],
    niceToHave: [
      'Experience with business management or ERP tools',
      'Technical background or CS degree',
      'Experience with SMB or enterprise customers',
      'Knowledge of IoT or hardware integration',
    ],
    benefits: ['Career Growth', 'Health Insurance', 'Learning Budget'],
    location: 'Remote / India',
    jobType: 'Full Time',
    experienceLevel: 'Senior',
    workMode: 'Remote',
    salaryRange: 'As per market standard',
    jobPostDate: new Date('2026-01-07'),
    isActive: true,
    isFeatured: true,
  },
  {
    jobCode: 'GRP-SM-001',
    companySlug: 'group',
    title: 'Global Social Media Manager – Multi Brands',
    category: 'Marketing',
    skillSet: [
      'Social Media Strategy',
      'Instagram / LinkedIn / Twitter',
      'Content Calendar',
      'Analytics & Reporting',
      'Community Management',
      'Paid Social Ads',
      'Canva / Figma',
      'Video Content',
    ],
    shortJobDescription:
      'Manage social media presence for Exyconn, Spentiva, Sibera, and Duncit. One role, multiple brands, massive impact.',
    jobDescription: `
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0">🌐 The Opportunity</h4>
        <p class="text-base text-gray-700 leading-7 mb-4">We're looking for a <strong class="text-gray-900 font-semibold">Global Social Media Manager</strong> who will own the social media strategy and execution for active brands under the Exyconn Group umbrella.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This isn't your typical social media role — you'll work across <strong class="text-gray-900 font-semibold">AI, FinTech, Cybersecurity, and Community Tech</strong>. Diverse industries, unique audiences, one powerful role.</p>
        
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🎯 Brands You'll Manage</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Exyconn</strong> – B2B Tech & AI (LinkedIn-heavy, thought leadership)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Spentiva</strong> – FinTech SaaS (Professional, finance-focused)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Sibera</strong> – Cybersecurity (Trust-building, technical audience)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-pink-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Duncit</strong> – Friend discovery and community app (Warm, social, safety-first)</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">📱 Platforms</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span>LinkedIn (primary for B2B brands)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-pink-600 font-bold mt-1">•</span><span>Instagram (community storytelling and launches)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-sky-600 font-bold mt-1">•</span><span>Twitter/X (Tech community, announcements)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-red-600 font-bold mt-1">•</span><span>YouTube (tutorials, thought leadership)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-orange-600 font-bold mt-1">•</span><span>Product Hunt, Reddit, Indie Hackers (community presence)</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">💡 Why This Role is Special</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>You won't get bored – multiple brands mean constant variety</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Build a portfolio spanning multiple industries</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Strategic role with direct leadership visibility</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Shape brand voices from the ground up</span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Develop and execute social media strategy for active brands</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Create and manage content calendars for each brand</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Write engaging captions, stories, and posts tailored to each audience</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Design or coordinate visual content (graphics, reels, carousels)</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Manage community engagement – respond to comments, DMs, mentions</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Run and optimize paid social campaigns when needed</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Track analytics and report on performance weekly/monthly</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Stay updated on social trends and adapt strategies</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Coordinate with content writers and designers for campaigns</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Build brand voice guidelines for each company</span></li>
        </ul>
      `,
    requirements: [
      '3+ years of social media management experience',
      'Proven track record managing multiple brands or accounts',
      'Strong understanding of LinkedIn, Instagram, Twitter algorithms',
      'Content creation skills (writing + basic design)',
      'Experience with social media tools (Buffer, Hootsuite, etc.)',
      'Analytics mindset – comfortable with data and reporting',
      'Excellent English communication (written & verbal)',
      'Self-organized and able to manage multiple priorities',
    ],
    niceToHave: [
      'Experience in B2B and B2C social media',
      'Video editing skills (Reels, YouTube Shorts)',
      'Understanding of tech/SaaS industry',
      'Community building experience',
      'Paid social advertising experience',
    ],
    benefits: ['Work Across Brands', 'Health Insurance', 'Learning Budget', 'Flexible Hours'],
    location: 'Remote / India',
    jobType: 'Full Time',
    experienceLevel: 'Mid Level',
    workMode: 'Remote',
    salaryRange: 'As per market standard',
    jobPostDate: new Date('2026-01-08'),
    isActive: true,
    isFeatured: true,
  },
  {
    jobCode: 'GRP-HR-001',
    companySlug: 'group',
    title: 'Group HR Manager',
    category: 'HR',
    skillSet: [
      'HR Management',
      'Talent Acquisition',
      'Employee Engagement',
      'Performance Management',
      'HR Policies',
      'Payroll & Compliance',
      'HRMS Tools',
      'Culture Building',
    ],
    shortJobDescription:
      'Lead HR operations across Exyconn Group companies – hiring, culture, policies, and people strategy for 100+ team members.',
    jobDescription: `
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0">🎯 The Role</h4>
        <p class="text-base text-gray-700 leading-7 mb-4">We're hiring a <strong class="text-gray-900 font-semibold">Group HR Manager</strong> to lead all HR functions across the Exyconn Group. You'll be responsible for <strong class="text-gray-900 font-semibold">hiring, culture, policies, engagement, and people operations</strong> for active group companies.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This is a <strong class="text-gray-900 font-semibold">strategic + hands-on</strong> role. You'll build HR processes from scratch for growing companies while ensuring great employee experience.</p>
        
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🏢 Companies Under Your Scope</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Exyconn</strong> – Technology & AI</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Spentiva</strong> – FinTech SaaS</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Sibera</strong> – Cybersecurity</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-pink-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Duncit</strong> – Community App</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">📋 Key Focus Areas</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Talent Acquisition:</strong> End-to-end hiring for tech and non-tech roles</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Onboarding:</strong> Create seamless onboarding experiences</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Culture:</strong> Build and maintain positive work culture across remote teams</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Policies:</strong> Develop HR policies, leave management, and compliance</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Performance:</strong> Implement performance review processes</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Engagement:</strong> Drive employee engagement and retention</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">💡 Why This Role is Exciting</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Build HR from the ground up for multiple companies</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Direct impact on 100+ team members</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Shape culture across diverse industries</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Strategic visibility with leadership</span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Lead end-to-end recruitment for all group companies</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Design and implement HR policies and processes</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Manage employee onboarding and offboarding</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Develop and oversee performance management systems</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Handle payroll coordination and compliance</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Drive employee engagement initiatives</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Resolve employee queries and grievances</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Build and maintain positive workplace culture</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Manage HRMS and maintain employee records</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Report to leadership on HR metrics and initiatives</span></li>
        </ul>
      `,
    requirements: [
      '5+ years of HR experience with at least 2 years in managerial role',
      'Experience handling HR for tech/startup companies',
      'Strong knowledge of Indian labor laws and compliance',
      'Experience with end-to-end recruitment',
      'Excellent interpersonal and communication skills',
      'Experience with HRMS tools (Zoho, GreytHR, etc.)',
      'Ability to work independently in remote setting',
      'Strong organizational and multitasking abilities',
    ],
    niceToHave: [
      'Experience managing HR for multiple entities',
      'Background in tech or startup environment',
      'HR certification (SHRM, HRCI)',
      'Experience with remote team management',
      'Employer branding experience',
    ],
    benefits: [
      'Lead HR Across Brands',
      'Health Insurance',
      'Strategic Leadership Role',
      'Growth Opportunity',
    ],
    location: 'Remote / Noida',
    jobType: 'Full Time',
    experienceLevel: 'Senior',
    workMode: 'Hybrid',
    salaryRange: 'As per market standard',
    jobPostDate: new Date('2026-01-08'),
    isActive: true,
    isFeatured: true,
  },
  {
    jobCode: 'GRP-CW-001',
    companySlug: 'group',
    title: 'Multi-Brand Content Writer',
    category: 'Content',
    skillSet: [
      'Content Writing',
      'SEO Writing',
      'Blog Writing',
      'Copywriting',
      'Technical Writing',
      'Social Media Copy',
      'Brand Voice',
      'Research Skills',
    ],
    shortJobDescription:
      'Create compelling content for Exyconn Group brands – blogs, website copy, emails, social posts, and marketing collateral across AI, FinTech, Security, and Community products.',
    jobDescription: `
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6 first:mt-0">✍️ The Opportunity</h4>
        <p class="text-base text-gray-700 leading-7 mb-4">We're looking for a <strong class="text-gray-900 font-semibold">Multi-Brand Content Writer</strong> who can craft compelling content across our active brands. From technical AI blogs to community launch copy – you'll write it all.</p>
        <p class="text-base text-gray-700 leading-7 mb-4">This role is perfect for someone who loves <strong class="text-gray-900 font-semibold">variety</strong> and can adapt their writing style to different industries and audiences.</p>
        
        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">📝 Content You'll Create</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Blogs & Articles:</strong> Thought leadership, how-to guides, industry insights</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Website Copy:</strong> Landing pages, product pages, feature descriptions</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Email Campaigns:</strong> Newsletters, drip campaigns, announcements</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Social Media:</strong> LinkedIn posts, Twitter threads, Instagram captions</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Marketing Collateral:</strong> Case studies, whitepapers, presentations</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">🎨 Brands & Their Tones</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Exyconn:</strong> Professional, technical, thought-leadership</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Spentiva:</strong> Clear, trustworthy, finance-friendly</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Sibera:</strong> Authoritative, security-focused, trust-building</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-pink-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Duncit:</strong> Warm, social, safety-first, community-focused</span></li>
        </ul>

        <h4 class="text-lg font-bold text-gray-900 mb-3 mt-6">💡 Why You'll Love This Role</h4>
        <ul class="space-y-2 mb-4">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Write about AI, FinTech, Security, and community products – never boring!</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Build a diverse portfolio spanning multiple industries</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Creative freedom with strategic impact</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-amber-600 font-bold mt-1">•</span><span>Work with design and marketing teams</span></li>
        </ul>
      `,
    jobResponsibilities: `
        <ul class="space-y-3">
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Write blogs, articles, and thought leadership content for all brands</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Create website copy and landing page content</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Develop email marketing content and campaigns</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Write social media posts and captions</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Create case studies and customer success stories</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Develop brand voice guidelines for each company</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Optimize content for SEO</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Research industry trends and competitor content</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Collaborate with designers and marketers</span></li>
          <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span>Edit and proofread content for quality</span></li>
        </ul>
      `,
    requirements: [
      '3+ years of content writing experience',
      'Strong portfolio showing diverse writing styles',
      'Excellent English writing and grammar',
      'Experience with SEO content writing',
      'Ability to research and write about technical topics',
      'Self-motivated and able to meet deadlines',
      'Experience with content management systems',
      'Adaptable writing style for different audiences',
    ],
    niceToHave: [
      'Experience writing for tech/SaaS companies',
      'Basic understanding of AI, FinTech, or cybersecurity',
      'Social media content creation experience',
      'Copywriting or conversion-focused writing',
      'Experience with content strategy',
    ],
    benefits: [
      'Diverse Content Portfolio',
      'Health Insurance',
      'Learning Budget',
      'Creative Freedom',
    ],
    location: 'Remote / India',
    jobType: 'Full Time',
    experienceLevel: 'Mid Level',
    workMode: 'Remote',
    salaryRange: 'As per market standard',
    jobPostDate: new Date('2026-01-08'),
    isActive: true,
    isFeatured: false,
  },
];
