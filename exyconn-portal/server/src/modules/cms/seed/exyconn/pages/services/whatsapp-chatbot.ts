import type { CmsSeedPage } from '../../../types';
import { place } from '../../place';

/** exyconn.com/services/whatsapp-chatbot (formerly exyconn-website/src/pages/[market]/services/whatsapp-chatbot.astro). */
export const SERVICES_WHATSAPP_CHATBOT_PAGE: CmsSeedPage = {
  key: 'services-whatsapp-chatbot',
  path: '/services/whatsapp-chatbot',
  kind: 'PAGE',
  title: 'WhatsApp Chatbot & Business Automation Services — Live Demo | Exyconn',
  layout: 'default',
  seo: {
    title: 'WhatsApp Chatbot & Business Automation Services — Live Demo | Exyconn',
    description:
      'Exyconn builds WhatsApp Business chatbots that book appointments, take orders, qualify leads and answer support around the clock on the official WhatsApp Cloud API. Try the live demo with your email.',
    keywords:
      'WhatsApp chatbot, WhatsApp Business API, WhatsApp automation, WhatsApp bot development, conversational commerce, Exyconn',
    ogImageUrl:
      'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80',
    canonical: '',
    noindex: false,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://exyconn.com/{market}',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Services',
            item: 'https://exyconn.com/{market}/services',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'WhatsApp chatbot',
            item: 'https://exyconn.com/{market}/services/whatsapp-chatbot',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'WhatsApp chatbot',
        description:
          'Exyconn builds WhatsApp Business chatbots that book appointments, take orders, qualify leads and answer support around the clock on the official WhatsApp Cloud API. Try the live demo with your email.',
        url: 'https://exyconn.com/{market}/services/whatsapp-chatbot',
        serviceType: 'Services',
        provider: {
          '@type': 'Organization',
          name: 'Exyconn',
          url: 'https://exyconn.com',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'What we build on WhatsApp',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Bookings & appointments',
              description:
                'Clinics, salons, restaurants and service teams fill their calendars from a chat — with reminders that cut no-shows.',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Ordering & catalogue',
              description:
                'Browse products, build a cart, pay and track delivery without leaving WhatsApp.',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Lead qualification',
              description:
                'Ask the right questions, score the answers and put hot leads straight into your CRM.',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Customer support',
              description:
                'Order status, FAQs, returns and tickets answered instantly, escalated when it matters.',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: 'Notifications & reminders',
              description:
                'Approved templates for confirmations, payment reminders, renewals and updates.',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: 'Integrations',
              description:
                'Connected to your CRM, ERP, booking system, payment gateway and helpdesk.',
            },
          ],
        },
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
          label: 'WhatsApp chatbot',
          href: '',
        },
      ],
      title: 'WhatsApp chatbots your customers already use',
      lede: 'We design, build and run WhatsApp Business bots on Meta’s official Cloud API: appointment booking, ordering, lead qualification and support that answer in seconds, day and night, and hand over to your team when a person is needed.',
      primary: {
        label: 'Try the live demo',
        href: '/services/whatsapp-chatbot#try-demo',
      },
      secondary: {
        label: 'All services',
        href: '/services',
      },
      scene: {
        shapes: ['devices', 'glyph'],
      },
      glyph: 'chatBubbles',
      tagline: 'Book, sell and support — inside WhatsApp.',
    }),
    place('detail.intro', {
      index: 1,
      label: 'What it is',
      intro: {
        title: 'What is a WhatsApp chatbot?',
        icon: 'comments',
        term: 'A WhatsApp chatbot',
        definition:
          'is an automated assistant on your WhatsApp Business number. It greets customers, shows menus and buttons, books slots, takes orders and payments, answers questions in their language, and passes the conversation to a person whenever it should — all inside the app your customers open every day.',
      },
      benefits: {
        title: 'Why businesses choose Exyconn for WhatsApp automation',
        items: [
          {
            icon: 'bolt',
            text: 'Replies in seconds, around the clock, with no queue.',
          },
          {
            icon: 'shield-halved',
            text: 'Built on Meta’s official WhatsApp Cloud API — verified, compliant, no grey-market tools.',
          },
          {
            icon: 'language',
            text: 'Understands free-typed messages, not just button taps, in your customers’ languages.',
          },
          {
            icon: 'user-group',
            text: 'Hands over to your team with the full conversation when a person is needed.',
          },
          {
            icon: 'chart-line',
            text: 'Every chat measured: sessions, completed flows and drop-off by step.',
          },
        ],
      },
    }),
    place(
      'detail.live',
      {
        index: 2,
        label: 'Live demo',
        title: 'See it live, then try it yourself',
        lede: 'Watch a booking happen in WhatsApp, then sign in with your email and a one-time code to chat with every demo bot — retail, clinics, restaurants, real estate and more.',
      },
      [
        place('service.whatsapp-demo', {
          business: 'Smile Dental Clinic',
          status: 'online',
          caption: 'A real booking flow, start to finish, in under a minute.',
          ariaLabel: 'WhatsApp conversation with {business}',
          messages: [
            {
              id: 'greet',
              from: 'bot',
              text: 'Hi Priya! Welcome to Smile Dental. How can we help today?',
              buttons: ['Book appointment', 'Clinic timings', 'Talk to us'],
            },
            {
              id: 'pick',
              from: 'customer',
              text: 'Book appointment',
              buttons: [],
            },
            {
              id: 'day',
              from: 'bot',
              text: 'Sure. Which day suits you?',
              buttons: ['Tomorrow', 'Thursday', 'Friday'],
            },
            {
              id: 'when',
              from: 'customer',
              text: 'Tomorrow evening',
              buttons: [],
            },
            {
              id: 'slot',
              from: 'bot',
              text: '6:30 PM with Dr. Mehta is free. Shall I book it?',
              buttons: ['Confirm', 'Other time'],
            },
            {
              id: 'yes',
              from: 'customer',
              text: 'Confirm',
              buttons: [],
            },
            {
              id: 'done',
              from: 'bot',
              text: 'Booked! You will get a reminder two hours before. See you tomorrow.',
              buttons: [],
            },
          ],
        }),
      ].join(''),
    ),
    place('detail.offerings', {
      index: 3,
      label: 'What we deliver',
      offerings: {
        title: 'What we build on WhatsApp',
        items: [
          {
            icon: 'calendar-check',
            title: 'Bookings & appointments',
            text: 'Clinics, salons, restaurants and service teams fill their calendars from a chat — with reminders that cut no-shows.',
          },
          {
            icon: 'cart-shopping',
            title: 'Ordering & catalogue',
            text: 'Browse products, build a cart, pay and track delivery without leaving WhatsApp.',
          },
          {
            icon: 'filter',
            title: 'Lead qualification',
            text: 'Ask the right questions, score the answers and put hot leads straight into your CRM.',
          },
          {
            icon: 'headset',
            title: 'Customer support',
            text: 'Order status, FAQs, returns and tickets answered instantly, escalated when it matters.',
          },
          {
            icon: 'bell',
            title: 'Notifications & reminders',
            text: 'Approved templates for confirmations, payment reminders, renewals and updates.',
          },
          {
            icon: 'plug',
            title: 'Integrations',
            text: 'Connected to your CRM, ERP, booking system, payment gateway and helpdesk.',
          },
        ],
      },
    }),
    place('detail.process', {
      index: 4,
      label: 'How we work',
      title: 'From Idea to MVP in Weeks',
      lede: 'Our battle-tested methodology delivers production-ready solutions faster than traditional approaches.',
      steps: [
        {
          title: 'Discovery',
          text: 'Deep-dive into your business goals, challenges, and data landscape to define the optimal AI strategy.',
          when: 'Week 1-2',
        },
        {
          title: 'Design',
          text: 'Architect your AI solution with scalable infrastructure, selecting the right models and workflows.',
          when: 'Week 2-3',
        },
        {
          title: 'Build & Deploy',
          text: 'Rapid development using pre-built AI components, followed by staged deployment to production.',
          when: 'Week 3-6',
        },
        {
          title: 'Optimize & Scale',
          text: 'Continuous monitoring, optimization, and scaling support to maximize ROI and performance.',
          when: 'Ongoing',
        },
      ],
    }),
    place('detail.faq', {
      index: 5,
      label: 'FAQ',
      title: 'Questions about WhatsApp chatbot',
      items: [
        {
          question: 'How do I try the live demo?',
          answer:
            'Enter your name and work email in the demo section on this page. We email you a six-digit code; enter it and the demo opens right here, or full screen in a new tab. There is no password, and your demo access stays until you sign out.',
        },
        {
          question: 'Do you use the official WhatsApp Business API?',
          answer:
            'Yes. Every bot we build runs on Meta’s WhatsApp Cloud API with your verified business number, approved message templates and Meta’s webhook signing — never unofficial automation tools that risk a ban.',
        },
        {
          question: 'Can the bot understand typed messages, not only buttons?',
          answer:
            'Yes. Menus and buttons keep common journeys fast, and AI understands free-typed replies — dates, quantities, names and questions — so customers can chat the way they normally do.',
        },
        {
          question: 'How long does it take to launch?',
          answer:
            'A focused bot — bookings, ordering or support — typically goes live in two to four weeks, including Meta business verification, template approval and testing on your own number.',
        },
        {
          question: 'Can it connect to our existing systems?',
          answer:
            'Yes. We integrate with CRMs, ERPs, booking and payment systems and helpdesks over their APIs, so orders, appointments and leads land where your team already works.',
        },
      ],
    }),
    place('detail.related', {
      index: 6,
      label: 'Related services',
      title: 'Explore related services',
      more: 'Explore',
      cards: [
        {
          href: '/services/application-modernization',
          index: 'S/01',
          title: 'Application modernization',
          text: 'Upgrade your legacy systems for performance, security, and innovation.',
          tags: ['Legacy assessment', 'Migration & refactoring', 'Security & optimization'],
        },
        {
          href: '/services/automation-integration',
          index: 'S/02',
          title: 'Automation & integration',
          text: 'Automate workflows and integrate your business systems with Exyconn.',
          tags: ['Workflow automation', 'System integration', 'RPA & bots'],
        },
        {
          href: '/services/data-analytics',
          index: 'S/03',
          title: 'Data analytics',
          text: "Transform your data into actionable insights with Exyconn's data analytics services.",
          tags: ['Business intelligence', 'Advanced analytics', 'Data integration'],
        },
      ],
    }),
    place('detail.cta', {
      family: 'services',
      label: 'Next step',
      title: 'Start with WhatsApp chatbot',
      text: 'Book, sell and support — inside WhatsApp.',
      primary: {
        label: 'Try the live demo',
        href: '/services/whatsapp-chatbot#try-demo',
      },
      secondary: {
        label: 'Get a quote',
        href: '/get-a-quote',
      },
      echoShape: 1,
    }),
  ].join(''),
  css: '',
};
