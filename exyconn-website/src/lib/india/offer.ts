/**
 * Copy for the Hindi India offer page (/[market]/india/offer). Every Hindi string here is
 * hand-written — edit it here, never in the page. Prices and plan contents live in ./plans.ts.
 */
import type { SceneConfig } from "../../scripts/stage3d/inner/config";
import { OFFER_PLANS } from "./plans";

export const OFFER_META = {
  title: "Exyconn India Offer | बिज़नेस ऑनलाइन ₹4,999 से",
  description:
    "अपने बिज़नेस को ऑनलाइन कैसे बढ़ाएँ? Exyconn के साथ अपना डिजिटल सफ़र शुरू करो। Website, Logo, SEO, Hosting — सब एक जगह। ₹4,999 से प्लान शुरू।",
  keywords:
    "business online kaise kare, website banwao, digital marketing India, logo design, SEO India, exyconn India offer, sasta website, business website India",
  path: "/india/offer",
  serviceName: "Exyconn India Offer",
} as const;

/** Anchors the page's own links jump to. */
export const OFFER_ANCHORS = { form: "#enquiry-form", plans: "#plans" } as const;

/** One cube per package; the plan cards light their cube while hovered. */
export const OFFER_SCENE: SceneConfig = {
  shapes: ["cubes"],
  data: { cubes: { cubes: OFFER_PLANS.length } },
};

export const OFFER_HERO = {
  crumbs: [{ label: "Exyconn", href: "/" }, { label: "India Special Offer" }],
  title: "मैं अपने बिज़नेस को ऑनलाइन कैसे बढ़ाऊँ?",
  lede: "क्या आप भी यही सोच रहे हैं? हम करेंगे आपकी मदद!",
  primary: { label: "अभी संपर्क करें", href: OFFER_ANCHORS.form },
  secondary: { label: "प्लान देखें", href: OFFER_ANCHORS.plans },
} as const;

export const OFFER_PROBLEMS = {
  label: "समस्याएँ",
  title: "क्या आपको भी ये समस्याएँ हैं?",
  items: [
    {
      icon: "fa-globe",
      title: "वेबसाइट नहीं है?",
      text: "आज के ज़माने में बिना वेबसाइट के बिज़नेस चलाना मुश्किल है। ग्राहक ऑनलाइन ढूँढते हैं।",
    },
    {
      icon: "fa-wallet",
      title: "बजट कम है?",
      text: "एजेंसी वाले लाखों माँगते हैं? हम ₹4,999 से शुरू करते हैं — क्वालिटी के साथ।",
    },
    {
      icon: "fa-route",
      title: "कहाँ से शुरू करूँ?",
      text: "Logo, Website, SEO, Hosting — सब कन्फ्यूज़िंग लगता है? हम पर छोड़ दो, हम सँभालेंगे।",
    },
    {
      icon: "fa-mobile-screen",
      title: "मोबाइल पर नहीं दिखता?",
      text: "आपकी पुरानी वेबसाइट फ़ोन पर टूट जाती है? हमारी वेबसाइट 100% मोबाइल-फ्रेंडली होती है।",
    },
  ],
} as const;

export const OFFER_PRICING = {
  label: "विकास के लिए निवेश",
  title: "अपने बिज़नेस के लिए सही प्लान चुनें",
  lede: "पारदर्शी कीमतें — कोई छिपे हुए शुल्क नहीं!",
  popular: "सबसे लोकप्रिय",
  /** The short tag in the form's plan picker. */
  popularShort: "लोकप्रिय",
} as const;

export const OFFER_STEPS = {
  label: "प्रक्रिया",
  title: "कैसे काम करता है?",
  steps: [
    {
      title: "हमसे बात करो",
      text: "कॉल या WhatsApp करो, अपनी ज़रूरत बताओ। हम समझेंगे आपका विज़न।",
    },
    { title: "प्लान चुनो", text: "अपने बजट और ज़रूरत के हिसाब से Basic, Smart या Pro प्लान चुनो।" },
    {
      title: "हम बना देंगे",
      text: "Logo, Website, SEO — सब कुछ हम डिलीवर करेंगे। आप बस रिलैक्स करो।",
    },
    {
      title: "बिज़नेस बढ़ाओ",
      text: "आपकी ऑनलाइन उपस्थिति तैयार! अब ग्राहक आपको ऑनलाइन ढूँढ सकते हैं।",
    },
  ],
} as const;

export const OFFER_COMPARISON = {
  label: "तुलना",
  title: "प्लान की तुलना करें",
  feature: "फ़ीचर",
  yes: "शामिल",
  no: "शामिल नहीं",
} as const;

export const OFFER_SERVICES = {
  label: "हमारी सेवाएँ",
  title: "सभी सेवाएँ एक नज़र में",
  lede: "डिजिटल, डेवलपमेंट, डाटा एनालिटिक्स और AI — सभी समाधान एक जगह।",
  more: "और जानें",
  all: { label: "सभी सेवाएँ देखें", href: "/services" },
  groups: [
    {
      title: "डिजिटल सर्विसेज़",
      items: [
        {
          href: "/services/application-modernization",
          title: "एप्लिकेशन मॉडर्नाइज़ेशन",
          text: "पुराने सिस्टम को आधुनिक, तेज़ और सुरक्षित बनाएँ।",
        },
        {
          href: "/services/digital-consulting",
          title: "डिजिटल कंसल्टिंग",
          text: "डिजिटल ट्रांसफ़ॉर्मेशन की सही रणनीति बनाएँ।",
        },
        {
          href: "/services/enterprise-application",
          title: "एंटरप्राइज़ एप्लिकेशन",
          text: "बड़े पैमाने पर मज़बूत एप्लिकेशन बनाएँ और चलाएँ।",
        },
      ],
    },
    {
      title: "डेवलपमेंट सर्विसेज़",
      items: [
        {
          href: "/services/mobile-application-development",
          title: "मोबाइल ऐप डेवलपमेंट",
          text: "iOS और Android के लिए शानदार मोबाइल ऐप बनवाएँ।",
        },
        {
          href: "/services/software-as-a-service",
          title: "SaaS सॉल्यूशंस",
          text: "क्लाउड-बेस्ड स्केलेबल सॉफ़्टवेयर सॉल्यूशन।",
        },
        {
          href: "/services/automation-integration",
          title: "ऑटोमेशन और इंटीग्रेशन",
          text: "वर्कफ़्लो ऑटोमेट करें और सिस्टम को जोड़ें।",
        },
      ],
    },
    {
      title: "डाटा और एनालिटिक्स",
      items: [
        {
          href: "/services/data-analytics",
          title: "डाटा एनालिटिक्स",
          text: "डाटा से सही इनसाइट्स निकालें और बेहतर फ़ैसले लें।",
        },
        {
          href: "/services/maintenance",
          title: "मेंटेनेंस और सपोर्ट",
          text: "एप्लिकेशंस को सुचारू रूप से चलाने के लिए सहायता।",
        },
      ],
    },
    {
      title: "AI सर्विसेज़",
      items: [
        {
          href: "/ai/agentic",
          title: "Agentic AI",
          text: "स्वचालित AI एजेंट्स जो आपके बिज़नेस को चलाएँ।",
        },
        { href: "/ai/bot-creation", title: "बोट क्रिएशन", text: "कस्टम चैटबोट और वॉइसबोट बनवाएँ।" },
        {
          href: "/ai/workflows",
          title: "AI वर्कफ़्लो",
          text: "AI से प्रोसेस ऑटोमेशन और स्मार्ट वर्कफ़्लो।",
        },
        {
          href: "/ai/llms",
          title: "LLM सॉल्यूशंस",
          text: "लार्ज लैंग्वेज मॉडल से बिज़नेस इनोवेशन।",
        },
        {
          href: "/ai/custom-model-training",
          title: "कस्टम AI ट्रेनिंग",
          text: "आपके डाटा पर कस्टम AI मॉडल ट्रेन करें।",
        },
      ],
    },
  ],
} as const;

export const OFFER_ENQUIRY = {
  label: "संपर्क",
  title: "अपनी जानकारी भेजें",
  lede: "फ़ॉर्म भरें, हमारी टीम 24 घंटे के अंदर आपसे संपर्क करेगी।",
  points: ["24 घंटे में जवाब", "आपका डाटा सुरक्षित है", "मुफ़्त सलाह — कोई चार्ज नहीं"],
  formLabel: "अपनी जानकारी भेजें",
} as const;

/** The direct channels. The phone number comes from portal branding, never from here. */
export const OFFER_CONTACT = {
  phoneLabel: "फ़ोन करें",
  emailLabel: "ईमेल करें",
  email: "growth@exyconn.com",
} as const;

export const OFFER_CTA = {
  title: "अपनी सफलता की कहानी आज ही शुरू करो!",
  text: "आपका डिजिटल ट्रांसफ़ॉर्मेशन सिर्फ़ एक बातचीत दूर है। हमारे ग्रोथ आर्किटेक्ट्स से जुड़ें — अभी!",
  primary: { label: "अभी शुरू करो", href: OFFER_ANCHORS.form },
} as const;
