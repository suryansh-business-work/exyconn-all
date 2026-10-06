import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/digital-marketing (formerly exyconn-website/src/pages/[market]/services/digital-marketing.astro). */
export const SERVICES_DIGITAL_MARKETING_PAGE: CmsSeedPage = {
  key: 'services-digital-marketing',
  path: '/services/digital-marketing',
  kind: 'PAGE',
  title: 'Digital Marketing Services | Exyconn',
  layout: 'default',
  seo: {
    title: 'Digital Marketing Services | Exyconn',
    description:
      'Exyconn Digital Marketing — SEO, PPC, social, content, email, branding, influencer, CRO, and analytics services that grow brand, traffic, and revenue.',
    keywords:
      'digital marketing, SEO, PPC, performance marketing, social media, content marketing, email marketing, branding, CRO, marketing analytics, Exyconn',
    ogImageUrl: '',
    canonical: '',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Digital marketing',
        description:
          'Exyconn Digital Marketing — SEO, PPC, social, content, email, branding, influencer, CRO, and analytics services that grow brand, traffic, and revenue.',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Digital marketing services',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'SEO (search engine optimization)',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Performance marketing & PPC',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Social media marketing',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Content marketing & copywriting',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: 'Email & marketing automation',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: 'Branding & creative design',
            },
            {
              '@type': 'ListItem',
              position: 7,
              name: 'Influencer & affiliate marketing',
            },
            {
              '@type': 'ListItem',
              position: 8,
              name: 'Conversion rate optimization (CRO)',
            },
            {
              '@type': 'ListItem',
              position: 9,
              name: 'Marketing analytics & reporting',
            },
          ],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Services',
            item: 'https://exyconn.com/services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Digital marketing',
          },
        ],
      },
    ],
  },
  html: [
    place('detail.stage', {
      family: 'services',
      crumbs: [
        {
          label: 'Home',
          href: '/',
        },
        {
          label: 'Services',
          href: '/services',
        },
        {
          label: 'Digital marketing',
          href: '',
        },
      ],
      title: 'Grow brand, traffic and revenue',
      lede: 'Full-funnel digital marketing — SEO, paid media, social, content, email, branding, CRO and analytics — engineered for measurable business outcomes.',
      primary: {
        label: 'Talk to a strategist',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      scene: {
        shapes: ['pipeline'],
        data: {
          pipeline: {
            stations: 4,
          },
        },
      },
      glyph: '',
      tagline: '',
    }),
    place('detail.proof', {
      label: 'Marketing results',
      items: [
        {
          value: '9',
          label: 'Marketing capabilities',
        },
        {
          value: '4×',
          label: 'Average ROAS lift',
        },
        {
          value: '60%',
          label: 'Organic growth in 6 months',
        },
        {
          value: '24/7',
          label: 'Campaign monitoring',
        },
      ],
    }),
    place('service.info-grid', {
      index: 1,
      id: 'capabilities',
      anchor: '',
      label: 'Capabilities',
      title: 'Every marketing service under one roof',
      lede: 'One integrated team across strategy, creative, paid, organic and analytics — so your funnel works end to end.',
      indexPrefix: 'M',
      items: [
        {
          id: 'seo',
          title: 'SEO (search engine optimization)',
          text: 'Rank higher on Google and capture qualified organic demand with technical SEO, on-page optimization, content strategy and authoritative link building.',
          points: [
            'Technical SEO audits & Core Web Vitals',
            'On-page optimization & schema markup',
            'Keyword research & content gap analysis',
            'Link building & digital PR',
            'Local SEO & Google Business Profile',
            'International & multilingual SEO',
          ],
        },
        {
          id: 'ppc',
          title: 'Performance marketing & PPC',
          text: 'Full-funnel paid media across Google, Meta, LinkedIn, YouTube and programmatic — engineered for ROAS, not vanity metrics.',
          points: [
            'Google Ads (Search, Performance Max, Shopping)',
            'Meta Ads (Facebook & Instagram)',
            'LinkedIn Ads for B2B',
            'YouTube & video advertising',
            'Programmatic & display retargeting',
            'Bid management & budget pacing',
          ],
        },
        {
          id: 'social',
          title: 'Social media marketing',
          text: 'Build a brand people remember. Strategy, content production, community management and paid social on every platform that matters.',
          points: [
            'Channel strategy & content calendars',
            'Reels, shorts & short-form video',
            'Community management & engagement',
            'Paid social campaigns',
            'Social listening & reputation',
            'Platform analytics & growth reports',
          ],
        },
        {
          id: 'content',
          title: 'Content marketing & copywriting',
          text: 'SEO-led blogs, conversion-focused landing pages, whitepapers, case studies and video scripts that move people from awareness to revenue.',
          points: [
            'Long-form blog & article writing',
            'Landing page & sales copy',
            'Whitepapers, eBooks & case studies',
            'Video scripts & YouTube content',
            'Editorial calendars & topic clusters',
            'AI-assisted content workflows',
          ],
        },
        {
          id: 'email',
          title: 'Email & marketing automation',
          text: 'Lifecycle email, drip sequences, CRM workflows and lead nurturing using HubSpot, Mailchimp, Klaviyo, ActiveCampaign and custom stacks.',
          points: [
            'Welcome & onboarding flows',
            'Lead nurture & drip campaigns',
            'Cart abandonment & re-engagement',
            'Newsletter strategy & design',
            'CRM workflows (HubSpot, Salesforce)',
            'Deliverability & inbox placement',
          ],
        },
        {
          id: 'branding',
          title: 'Branding & creative design',
          text: 'Logo, brand identity, ad creatives and motion graphics that stop the scroll and stay in memory.',
          points: [
            'Logo & visual identity systems',
            'Brand guidelines & messaging',
            'Static & video ad creatives',
            'Motion graphics & animation',
            'Pitch decks & sales collateral',
            'Packaging & print design',
          ],
        },
        {
          id: 'influencer',
          title: 'Influencer & affiliate marketing',
          text: 'Scale word-of-mouth with vetted creator partnerships, UGC campaigns and performance-based affiliate programs.',
          points: [
            'Influencer discovery & vetting',
            'Campaign briefs & contract management',
            'UGC content production',
            'Affiliate program setup & tracking',
            'Creator relationship management',
            'Performance & ROI reporting',
          ],
        },
        {
          id: 'cro',
          title: 'Conversion rate optimization (CRO)',
          text: 'Funnel audits, A/B testing, heatmaps and UX improvements that turn existing traffic into more revenue.',
          points: [
            'Conversion funnel audits',
            'A/B & multivariate testing',
            'Heatmaps & session recordings',
            'Landing page optimization',
            'Checkout & form optimization',
            'Personalization & segmentation',
          ],
        },
        {
          id: 'analytics',
          title: 'Marketing analytics & reporting',
          text: 'GA4, GTM, server-side tracking, attribution modeling and executive dashboards that turn data into clear decisions.',
          points: [
            'GA4 & GTM implementation',
            'Server-side tracking & consent mode',
            'Attribution modeling',
            'Looker Studio & Power BI dashboards',
            'Marketing mix & incrementality',
            'Monthly performance reviews',
          ],
        },
      ],
    }),
    place('service.steps', {
      index: 2,
      id: 'process',
      label: 'How we work',
      title: 'A process that compounds month over month',
      highlight: true,
      steps: [
        {
          title: 'Audit & strategy',
          text: 'Deep audit of your funnel, competitors and market. A roadmap with clear KPIs.',
        },
        {
          title: 'Build & launch',
          text: 'Campaigns, creatives, content and tracking implemented in weeks, not months.',
        },
        {
          title: 'Optimize',
          text: 'Continuous testing, bid tuning and creative refresh for compounding gains.',
        },
        {
          title: 'Report & scale',
          text: 'Transparent dashboards, monthly reviews and a plan to scale what works.',
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: '',
      title: 'Ready to grow with Exyconn?',
      text: "Tell us your goals — we'll come back with a custom marketing plan and a clear roadmap to hit them.",
      primary: {
        label: 'Book a free consultation',
        href: '/contact',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      echoShape: 0,
    }),
  ].join(''),
  css: '',
};
