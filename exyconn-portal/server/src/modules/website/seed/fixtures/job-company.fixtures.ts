/**
 * Job company fixtures — content migrated verbatim from the Astro website
 * (`exyconn-website/src/data/career/*.career.data.ts`). The `description` and
 * `culture` fields are rich HTML rendered as-is by the public site.
 */

import type { JobCompanyInput } from '../../website.inputs';

export const jobCompanyFixtures: JobCompanyInput[] = [
  {
    companyCode: 'exyconn',
    slug: 'exyconn',
    name: 'Exyconn',
    logo: '/career/logos/exyconn-logo.svg',
    tagline: 'AI-Powered Business Solutions for the Future',
    description: `
      <p class="text-base text-gray-700 leading-7 mb-4">Exyconn is a technology & product engineering company helping startups and enterprises convert ideas into scalable MVPs and SaaS products.</p>
      <p class="text-base text-gray-700 leading-7 mb-4">We work across AI, SaaS, Web, Mobile, Automation, and Cloud, and now we're expanding our international client base (US & UK markets).</p>
      <p class="text-base text-gray-700 leading-7">At Exyconn, we believe in building technology that empowers businesses to focus on what matters most - their customers and growth.</p>
    `,
    culture: `
      <p class="text-base text-gray-700 leading-7 mb-5">At Exyconn, we foster a culture of innovation, collaboration, and continuous learning. We believe that the best ideas come from diverse perspectives and open communication.</p>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Innovation First:</strong> We encourage experimentation and creative problem-solving</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Remote-First:</strong> Work from anywhere with flexible hours</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Growth Mindset:</strong> Continuous learning and development opportunities</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-blue-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Impact Driven:</strong> Every team member's work directly contributes to our success</span></li>
      </ul>
    `,
    website: 'https://exyconn.com',
    founded: '2022',
    employees: '50-100',
    industry: 'Technology / AI / SaaS',
    headquarters: 'Remote / India',
    benefits: [
      {
        icon: 'fa-home',
        title: 'Remote First',
        description: 'Work from anywhere in India with flexible hours that fit your lifestyle.',
      },
      {
        icon: 'fa-graduation-cap',
        title: 'Learning Budget',
        description: '₹50,000/year for courses, conferences, and skill development.',
      },
      {
        icon: 'fa-heart-pulse',
        title: 'Health Coverage',
        description: 'Comprehensive health insurance for you and your family.',
      },
      {
        icon: 'fa-chart-line',
        title: 'Growth Path',
        description: 'Clear career progression with mentorship from industry experts.',
      },
      {
        icon: 'fa-laptop',
        title: 'Best Equipment',
        description: 'MacBook Pro, monitors, and all the tools you need to succeed.',
      },
      {
        icon: 'fa-users',
        title: 'Great Team',
        description: 'Work with passionate people building amazing products together.',
      },
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/company/exyconn',
      twitter: 'https://twitter.com/exyconn',
    },
    brandColor: '#0071e3',
    secondaryColor: '#00d4ff',
    isActive: true,
    order: 0,
  },
  {
    companyCode: 'spentiva',
    slug: 'spentiva',
    name: 'Spentiva',
    logo: '/career/logos/spentiva-logo.svg',
    tagline: 'Smart Expense Tracking Powered by AI',
    description: `
      <p class="text-base text-gray-700 leading-7 mb-4">Spentiva is revolutionizing personal and business finance with AI-powered expense tracking, smart categorization, and intelligent insights. Track, analyze, and optimize your spending effortlessly.</p>
      <p class="text-base text-gray-700 leading-7 mb-4">With 50K+ happy users across 150+ countries and a 4.9/5 rating, we're building the future of financial intelligence. Our platform combines machine learning with intuitive design to make money management simple and even fun.</p>
      <p class="text-base text-gray-700 leading-7">From automatic categorization to multi-tracker support for personal, business, and family expenses - Spentiva is where smart money management begins.</p>
    `,
    culture: `
      <p class="text-base text-gray-700 leading-7 mb-5">At Spentiva, we believe in building a product that we ourselves would love to use. Our culture is defined by:</p>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Customer Obsession:</strong> Every feature starts with understanding customer pain points</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Data-Driven:</strong> We make decisions based on data, not assumptions</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Ownership:</strong> Everyone owns their work from start to finish</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-emerald-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Transparency:</strong> Open communication and honest feedback</span></li>
      </ul>
    `,
    website: 'https://spentiva.com',
    founded: '2024',
    employees: '10-25',
    industry: 'FinTech / AI SaaS',
    headquarters: 'Remote / India',
    benefits: [
      {
        icon: 'fa-money-bill-wave',
        title: 'Competitive Pay',
        description: 'Above-market salaries with annual reviews and performance bonuses.',
      },
      {
        icon: 'fa-plane',
        title: 'Unlimited PTO',
        description: 'Take time off when you need it. We trust you to manage your time.',
      },
      {
        icon: 'fa-heart-pulse',
        title: 'Health Benefits',
        description: 'Comprehensive medical, dental, and vision coverage.',
      },
      {
        icon: 'fa-coins',
        title: 'Equity Options',
        description: 'Own a piece of Spentiva with our employee stock option plan.',
      },
      {
        icon: 'fa-book',
        title: 'Learning Stipend',
        description: '₹30,000/year for books, courses, and professional development.',
      },
      {
        icon: 'fa-coffee',
        title: 'Home Office Setup',
        description: '₹50,000 one-time allowance for your home office equipment.',
      },
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/company/spentiva',
      twitter: 'https://twitter.com/spentiva',
    },
    brandColor: '#10b981',
    secondaryColor: '#34d399',
    isActive: true,
    order: 1,
  },
  {
    companyCode: 'sibera',
    slug: 'sibera',
    name: 'Sibera',
    logo: '/career/logos/sibera-logo.svg',
    tagline: 'The Ultimate Business Management Solution',
    description: `
      <p class="text-base text-gray-700 leading-7 mb-4">Sibera is an all-in-one business management platform that seamlessly integrates Support, Tasks, Files, Invoicing, Time Tracking, and IoT - all in one place. We help businesses save up to 20% in operational costs with our unified dashboard.</p>
      <p class="text-base text-gray-700 leading-7 mb-4">With a 30% increase in team productivity, 50+ hours saved monthly, and 24/7 automated support - Sibera is built to scale with your business from startup to enterprise.</p>
      <p class="text-base text-gray-700 leading-7">Our platform features real-time analytics, seamless team collaboration, and enterprise-grade security. Whether you need to manage customer support tickets or track IoT devices, Sibera has you covered.</p>
    `,
    culture: `
      <p class="text-base text-gray-700 leading-7 mb-5">We build tools that empower businesses to work smarter:</p>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">User-Centric:</strong> Every feature is designed for real business users</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Integration First:</strong> We believe in connected, seamless workflows</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Simplicity:</strong> Complex problems deserve simple solutions</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-purple-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Reliability:</strong> Our customers depend on us - uptime is everything</span></li>
      </ul>
    `,
    website: 'https://sibera.work',
    founded: '2023',
    employees: '30-60',
    industry: 'Business SaaS / ERP Software',
    headquarters: 'Remote / India',
    benefits: [
      {
        icon: 'fa-chart-line',
        title: 'Career Growth',
        description: 'Rapid career advancement in a high-growth SaaS company.',
      },
      {
        icon: 'fa-rocket',
        title: 'Product Impact',
        description: 'Direct impact on products used by businesses worldwide.',
      },
      {
        icon: 'fa-heart-pulse',
        title: 'Health Coverage',
        description: 'Comprehensive health insurance including mental health support.',
      },
      {
        icon: 'fa-laptop-code',
        title: 'Tech Setup',
        description: 'Top-tier hardware and software tools for your work.',
      },
      {
        icon: 'fa-calendar-check',
        title: 'Flexible Hours',
        description: "Work when you're most productive with flexible scheduling.",
      },
      {
        icon: 'fa-trophy',
        title: 'Bug Bounties',
        description: 'Internal bug bounty program with cash rewards.',
      },
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/company/sibera',
      twitter: 'https://twitter.com/siberasec',
    },
    brandColor: '#7c3aed',
    secondaryColor: '#a78bfa',
    isActive: true,
    order: 2,
  },
  {
    companyCode: 'exyconn-group',
    slug: 'group',
    name: 'Exyconn Group',
    logo: '/career/logos/exyconn-group-logo.svg',
    tagline: 'Work Across Multiple Brands – One Incredible Team',
    description: `
      <p class="text-base text-gray-700 leading-7 mb-4">The <strong class="text-gray-900 font-semibold">Exyconn Group</strong> manages a portfolio of innovative companies spanning AI, FinTech, Cybersecurity, and Community Technology.</p>
      <p class="text-base text-gray-700 leading-7 mb-4">When you join a <strong class="text-gray-900 font-semibold">Group Role</strong>, you don't work for just one product — you work across our active brands:</p>
      <ul class="space-y-2 mb-4">
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Exyconn</strong> – AI & SaaS Product Engineering</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Spentiva</strong> – Smart Expense Management</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Sibera</strong> – Next-Gen Cybersecurity</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Duncit</strong> – Real Friend Connections</span></li>
      </ul>
      <p class="text-base text-gray-700 leading-7">This means <strong class="text-gray-900 font-semibold">diverse challenges</strong>, <strong class="text-gray-900 font-semibold">varied content</strong>, and <strong class="text-gray-900 font-semibold">massive exposure</strong> across industries.</p>
    `,
    culture: `
      <p class="text-base text-gray-700 leading-7 mb-5">Group roles are for people who love variety and thrive in dynamic environments:</p>
      <ul class="space-y-3">
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Multi-Brand Exposure:</strong> Work on AI, FinTech, Security, and Community products – all in one role</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Strategic Impact:</strong> Your work shapes multiple brands simultaneously</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Cross-Functional:</strong> Collaborate with diverse teams across companies</span></li>
        <li class="flex items-start gap-3 text-gray-700 leading-7"><span class="text-indigo-600 font-bold mt-1">•</span><span><strong class="text-gray-900 font-semibold">Growth Accelerated:</strong> Learn faster by working across industries</span></li>
      </ul>
    `,
    website: 'https://exyconn.com',
    founded: '2022',
    employees: '100+',
    industry: 'Multi-Brand Technology Group',
    headquarters: 'Remote / India',
    benefits: [
      {
        icon: 'fa-layer-group',
        title: 'Multi-Brand Work',
        description: 'Work across Exyconn, Spentiva, Sibera, and Duncit.',
      },
      {
        icon: 'fa-rocket',
        title: 'Accelerated Growth',
        description: 'Diverse exposure means faster skill development.',
      },
      {
        icon: 'fa-home',
        title: 'Remote Friendly',
        description: 'Flexible work arrangements with outcome-focused culture.',
      },
      {
        icon: 'fa-heart-pulse',
        title: 'Health Coverage',
        description: 'Comprehensive health insurance for you and family.',
      },
      {
        icon: 'fa-graduation-cap',
        title: 'Learning Budget',
        description: 'Annual budget for courses and professional development.',
      },
      {
        icon: 'fa-users',
        title: 'Amazing Teams',
        description: 'Collaborate with talented people across all companies.',
      },
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/company/exyconn',
      twitter: 'https://twitter.com/exyconn',
    },
    brandColor: '#6366f1',
    secondaryColor: '#818cf8',
    isActive: true,
    order: 3,
  },
];
