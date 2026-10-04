import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** WhatsApp chatbot — content for /[market]/services/whatsapp-chatbot. */
export default defineDetailPage({
  section: "services",
  slug: "whatsapp-chatbot",
  name: "WhatsApp chatbot",
  meta: {
    title: "WhatsApp Chatbot & Business Automation Services — Live Demo | Exyconn",
    description:
      "Exyconn builds WhatsApp Business chatbots that book appointments, take orders, qualify leads and answer support around the clock on the official WhatsApp Cloud API. Try the live demo with your email.",
    keywords:
      "WhatsApp chatbot, WhatsApp Business API, WhatsApp automation, WhatsApp bot development, conversational commerce, Exyconn",
    image:
      "https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "WhatsApp chatbots your customers already use",
    tagline: "Book, sell and support — inside WhatsApp.",
    lede: "We design, build and run WhatsApp Business bots on Meta’s official Cloud API: appointment booking, ordering, lead qualification and support that answer in seconds, day and night, and hand over to your team when a person is needed.",
    action: {
      label: "Try the live demo",
      href: "/services/whatsapp-chatbot#try-demo",
    },
  },
  intro: {
    title: "What is a WhatsApp chatbot?",
    icon: "comments",
    term: "A WhatsApp chatbot",
    definition:
      "is an automated assistant on your WhatsApp Business number. It greets customers, shows menus and buttons, books slots, takes orders and payments, answers questions in their language, and passes the conversation to a person whenever it should — all inside the app your customers open every day.",
  },
  benefits: {
    title: "Why businesses choose Exyconn for WhatsApp automation",
    items: [
      { icon: "bolt", text: "Replies in seconds, around the clock, with no queue." },
      {
        icon: "shield-halved",
        text: "Built on Meta’s official WhatsApp Cloud API — verified, compliant, no grey-market tools.",
      },
      {
        icon: "language",
        text: "Understands free-typed messages, not just button taps, in your customers’ languages.",
      },
      {
        icon: "user-group",
        text: "Hands over to your team with the full conversation when a person is needed.",
      },
      {
        icon: "chart-line",
        text: "Every chat measured: sessions, completed flows and drop-off by step.",
      },
    ],
  },
  liveDemo: {
    title: "See it live, then try it yourself",
    lede: "Watch a booking happen in WhatsApp, then sign in with your email and a one-time code to chat with every demo bot — retail, clinics, restaurants, real estate and more.",
  },
  offerings: {
    title: "What we build on WhatsApp",
    items: [
      {
        icon: "calendar-check",
        title: "Bookings & appointments",
        text: "Clinics, salons, restaurants and service teams fill their calendars from a chat — with reminders that cut no-shows.",
      },
      {
        icon: "cart-shopping",
        title: "Ordering & catalogue",
        text: "Browse products, build a cart, pay and track delivery without leaving WhatsApp.",
      },
      {
        icon: "filter",
        title: "Lead qualification",
        text: "Ask the right questions, score the answers and put hot leads straight into your CRM.",
      },
      {
        icon: "headset",
        title: "Customer support",
        text: "Order status, FAQs, returns and tickets answered instantly, escalated when it matters.",
      },
      {
        icon: "bell",
        title: "Notifications & reminders",
        text: "Approved templates for confirmations, payment reminders, renewals and updates.",
      },
      {
        icon: "plug",
        title: "Integrations",
        text: "Connected to your CRM, ERP, booking system, payment gateway and helpdesk.",
      },
    ],
  },
  faqs: [
    {
      question: "How do I try the live demo?",
      answer:
        "Enter your name and work email in the demo section on this page. We email you a six-digit code; enter it and the demo opens right here, or full screen in a new tab. There is no password, and your demo access stays until you sign out.",
    },
    {
      question: "Do you use the official WhatsApp Business API?",
      answer:
        "Yes. Every bot we build runs on Meta’s WhatsApp Cloud API with your verified business number, approved message templates and Meta’s webhook signing — never unofficial automation tools that risk a ban.",
    },
    {
      question: "Can the bot understand typed messages, not only buttons?",
      answer:
        "Yes. Menus and buttons keep common journeys fast, and AI understands free-typed replies — dates, quantities, names and questions — so customers can chat the way they normally do.",
    },
    {
      question: "How long does it take to launch?",
      answer:
        "A focused bot — bookings, ordering or support — typically goes live in two to four weeks, including Meta business verification, template approval and testing on your own number.",
    },
    {
      question: "Can it connect to our existing systems?",
      answer:
        "Yes. We integrate with CRMs, ERPs, booking and payment systems and helpdesks over their APIs, so orders, appointments and leads land where your team already works.",
    },
  ],
  scene: serviceScene("devices", "chatBubbles"),
});
