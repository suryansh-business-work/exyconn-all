import { defineDetailPage } from "../schema";
import { serviceScene } from "../scenes";

/** Mobile application development — content for /[market]/services/mobile-application-development. Moved verbatim from the page's previous markup. */
export default defineDetailPage({
  section: "services",
  slug: "mobile-application-development",
  name: "Mobile application development",
  meta: {
    title: "Mobile Application Development Services | Exyconn",
    description:
      "Build high-performance, user-friendly mobile apps for iOS and Android with Exyconn. We deliver custom mobile solutions for startups, enterprises, and digital transformation.",
    keywords:
      "mobile app development, iOS app, Android app, cross-platform, mobile solutions, Exyconn",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  hero: {
    title: "Transform ideas into powerful mobile experiences",
    tagline: "Innovative. Scalable. User-Centric.",
    lede: "Transform your ideas into powerful mobile experiences. Exyconn designs and develops custom mobile applications for iOS, Android, and cross-platform—delivering seamless performance, security, and user engagement.",
    action: {
      label: "Start your mobile project",
      href: "/contact",
    },
  },
  intro: {
    title: "What is mobile application development?",
    icon: "mobile-screen-button",
    term: "Mobile application development",
    definition:
      "is the process of creating software apps for smartphones and tablets. We build native and cross-platform apps tailored to your business goals, user needs, and technical requirements.",
  },
  benefits: {
    title: "Why choose Exyconn for mobile apps?",
    items: [
      {
        icon: "mobile-screen",
        text: "Expertise in iOS, Android, and cross-platform frameworks.",
      },
      {
        icon: "user-check",
        text: "User-centric design for maximum engagement.",
      },
      {
        icon: "shield-halved",
        text: "Secure, scalable, and high-performance solutions.",
      },
      {
        icon: "gears",
        text: "Seamless integration with APIs and backend systems.",
      },
      {
        icon: "rocket",
        text: "Rapid prototyping and agile delivery.",
      },
    ],
  },
  offerings: {
    title: "Our mobile app services",
    items: [
      {
        icon: "mobile-alt",
        title: "Native app development",
        text: "Custom apps for iOS and Android, optimized for performance and UX.",
      },
      {
        icon: "layer-group",
        title: "Cross-platform apps",
        text: "Build once, deploy everywhere—React Native, Flutter, and more.",
      },
      {
        icon: "cloud-arrow-up",
        title: "Backend & API integration",
        text: "Connect your app to cloud, databases, and business systems.",
      },
    ],
  },
  faqs: [
    {
      question: "What platforms do you develop for?",
      answer:
        "We build apps for iOS, Android, and cross-platform using React Native, Flutter, and other modern frameworks.",
    },
    {
      question: "Can you integrate my app with existing systems?",
      answer: "Yes, we specialize in API and backend integration for seamless business workflows.",
    },
    {
      question: "How do you ensure app security?",
      answer:
        "We follow best practices for secure coding, data protection, and compliance with app store guidelines.",
    },
    {
      question: "Do you provide post-launch support?",
      answer:
        "Absolutely. We offer maintenance, updates, and feature enhancements for all mobile apps we build.",
    },
    {
      question: "How do I get started with mobile app development?",
      answer:
        "Contact Exyconn for a free consultation. We’ll discuss your goals and recommend the best mobile strategy for your needs.",
    },
  ],
  scene: serviceScene("phone", 3),
});
