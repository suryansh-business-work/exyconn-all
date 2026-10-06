/**
 * The Hindi India offer as it was before the CMS (every Hindi string hand-written): the
 * packages and what each includes, read by the cards, the comparison and the form alike.
 */

export const OFFER_PAGE_PROPS = {
  hero: {
    crumbs: [
      {
        label: 'Exyconn',
        href: '/',
      },
      {
        label: 'India Special Offer',
        href: '',
      },
    ],
    title: 'मैं अपने बिज़नेस को ऑनलाइन कैसे बढ़ाऊँ?',
    lede: 'क्या आप भी यही सोच रहे हैं? हम करेंगे आपकी मदद!',
    primary: {
      label: 'अभी संपर्क करें',
      href: '#enquiry-form',
      external: false,
    },
    secondary: {
      label: 'प्लान देखें',
      href: '#plans',
      external: false,
    },
  },
  problems: {
    label: 'समस्याएँ',
    title: 'क्या आपको भी ये समस्याएँ हैं?',
    items: [
      {
        icon: 'fa-globe',
        title: 'वेबसाइट नहीं है?',
        text: 'आज के ज़माने में बिना वेबसाइट के बिज़नेस चलाना मुश्किल है। ग्राहक ऑनलाइन ढूँढते हैं।',
      },
      {
        icon: 'fa-wallet',
        title: 'बजट कम है?',
        text: 'एजेंसी वाले लाखों माँगते हैं? हम ₹4,999 से शुरू करते हैं — क्वालिटी के साथ।',
      },
      {
        icon: 'fa-route',
        title: 'कहाँ से शुरू करूँ?',
        text: 'Logo, Website, SEO, Hosting — सब कन्फ्यूज़िंग लगता है? हम पर छोड़ दो, हम सँभालेंगे।',
      },
      {
        icon: 'fa-mobile-screen',
        title: 'मोबाइल पर नहीं दिखता?',
        text: 'आपकी पुरानी वेबसाइट फ़ोन पर टूट जाती है? हमारी वेबसाइट 100% मोबाइल-फ्रेंडली होती है।',
      },
    ],
  },
  pricing: {
    label: 'विकास के लिए निवेश',
    title: 'अपने बिज़नेस के लिए सही प्लान चुनें',
    lede: 'पारदर्शी कीमतें — कोई छिपे हुए शुल्क नहीं!',
    popular: 'सबसे लोकप्रिय',
    planHref: '#enquiry-form',
  },
  plans: [
    {
      id: 'basic',
      tier: 'FOUNDATION',
      name: 'Basic Biz',
      price: 4999,
      period: 'एक बार',
      cta: 'प्लान चुनें',
      popular: false,
    },
    {
      id: 'smart',
      tier: 'ACCELERATOR',
      name: 'Smart Biz',
      price: 9999,
      period: 'एक बार',
      cta: 'अभी शुरू करें',
      popular: true,
    },
    {
      id: 'pro',
      tier: 'DOMINANCE',
      name: 'Pro Biz',
      price: 14999,
      period: 'एक बार',
      cta: 'सेल्स से बात करें',
      popular: false,
    },
  ],
  features: [
    {
      id: 'logo',
      label: 'लोगो डिज़ाइन',
      card: '',
      values: {
        basic: {
          included: true,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'hosting',
      label: 'वेबसाइट + होस्टिंग (1 साल)',
      card: '1 साल वेबसाइट* + होस्टिंग',
      values: {
        basic: {
          included: true,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'pages',
      label: 'पेज',
      card: '',
      values: {
        basic: {
          included: true,
          short: '3-5',
          long: '3-5 पेज वेबसाइट',
        },
        smart: {
          included: true,
          short: '5-10',
          long: '5-10 पेज वेबसाइट',
        },
        pro: {
          included: true,
          short: '5-10',
          long: '5-10 पेज वेबसाइट',
        },
      },
    },
    {
      id: 'blog',
      label: 'ब्लॉग',
      card: '',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'mobile',
      label: 'मोबाइल फ्रेंडली',
      card: 'मोबाइल फ्रेंडली डिज़ाइन',
      values: {
        basic: {
          included: true,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'cards',
      label: 'विज़िटिंग कार्ड',
      card: '',
      values: {
        basic: {
          included: true,
          short: '100',
          long: 'विज़िटिंग कार्ड डिज़ाइन (100)',
        },
        smart: {
          included: true,
          short: '500',
          long: 'विज़िटिंग कार्ड डिज़ाइन (500)',
        },
        pro: {
          included: true,
          short: '500',
          long: 'विज़िटिंग कार्ड डिज़ाइन (500)',
        },
      },
    },
    {
      id: 'forms',
      label: 'फ़ॉर्म',
      card: '',
      values: {
        basic: {
          included: true,
          short: '1',
          long: '1 फ़ॉर्म (संपर्क करें)',
        },
        smart: {
          included: true,
          short: '5 तक',
          long: '5 फ़ॉर्म तक',
        },
        pro: {
          included: true,
          short: '10 तक',
          long: '10 फ़ॉर्म तक',
        },
      },
    },
    {
      id: 'email',
      label: 'बिज़नेस ईमेल',
      card: '',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '1',
          long: '1 बिज़नेस ईमेल',
        },
        pro: {
          included: true,
          short: '2',
          long: '2 बिज़नेस ईमेल',
        },
      },
    },
    {
      id: 'seo',
      label: 'बेसिक SEO',
      card: '',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'analytics',
      label: 'गूगल एनालिटिक्स',
      card: '',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'chat',
      label: 'लाइव चैट',
      card: 'लाइव चैट इंटीग्रेशन',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: true,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'ecommerce',
      label: 'ई-कॉमर्स',
      card: 'ई-कॉमर्स साइट',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: false,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'payments',
      label: 'पेमेंट गेटवे',
      card: '',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: false,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'messaging',
      label: 'WhatsApp व SMS इंटीग्रेशन',
      card: 'ईमेल, WhatsApp व SMS इंटीग्रेशन',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: false,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
    {
      id: 'barcode',
      label: 'बारकोड रीडर ऐप',
      card: 'बारकोड रीडर व क्रिएटर मोबाइल ऐप',
      values: {
        basic: {
          included: false,
          short: '',
          long: '',
        },
        smart: {
          included: false,
          short: '',
          long: '',
        },
        pro: {
          included: true,
          short: '',
          long: '',
        },
      },
    },
  ],
  steps: {
    label: 'प्रक्रिया',
    title: 'कैसे काम करता है?',
    steps: [
      {
        title: 'हमसे बात करो',
        text: 'कॉल या WhatsApp करो, अपनी ज़रूरत बताओ। हम समझेंगे आपका विज़न।',
      },
      {
        title: 'प्लान चुनो',
        text: 'अपने बजट और ज़रूरत के हिसाब से Basic, Smart या Pro प्लान चुनो।',
      },
      {
        title: 'हम बना देंगे',
        text: 'Logo, Website, SEO — सब कुछ हम डिलीवर करेंगे। आप बस रिलैक्स करो।',
      },
      {
        title: 'बिज़नेस बढ़ाओ',
        text: 'आपकी ऑनलाइन उपस्थिति तैयार! अब ग्राहक आपको ऑनलाइन ढूँढ सकते हैं।',
      },
    ],
  },
  comparison: {
    label: 'तुलना',
    title: 'प्लान की तुलना करें',
    feature: 'फ़ीचर',
    yes: 'शामिल',
    no: 'शामिल नहीं',
  },
  services: {
    label: 'हमारी सेवाएँ',
    title: 'सभी सेवाएँ एक नज़र में',
    lede: 'डिजिटल, डेवलपमेंट, डाटा एनालिटिक्स और AI — सभी समाधान एक जगह।',
    more: 'और जानें',
    all: {
      label: 'सभी सेवाएँ देखें',
      href: '/services',
    },
    groups: [
      {
        title: 'डिजिटल सर्विसेज़',
        items: [
          {
            href: '/services/application-modernization',
            title: 'एप्लिकेशन मॉडर्नाइज़ेशन',
            text: 'पुराने सिस्टम को आधुनिक, तेज़ और सुरक्षित बनाएँ।',
          },
          {
            href: '/services/digital-consulting',
            title: 'डिजिटल कंसल्टिंग',
            text: 'डिजिटल ट्रांसफ़ॉर्मेशन की सही रणनीति बनाएँ।',
          },
          {
            href: '/services/enterprise-application',
            title: 'एंटरप्राइज़ एप्लिकेशन',
            text: 'बड़े पैमाने पर मज़बूत एप्लिकेशन बनाएँ और चलाएँ।',
          },
        ],
      },
      {
        title: 'डेवलपमेंट सर्विसेज़',
        items: [
          {
            href: '/services/mobile-application-development',
            title: 'मोबाइल ऐप डेवलपमेंट',
            text: 'iOS और Android के लिए शानदार मोबाइल ऐप बनवाएँ।',
          },
          {
            href: '/services/software-as-a-service',
            title: 'SaaS सॉल्यूशंस',
            text: 'क्लाउड-बेस्ड स्केलेबल सॉफ़्टवेयर सॉल्यूशन।',
          },
          {
            href: '/services/automation-integration',
            title: 'ऑटोमेशन और इंटीग्रेशन',
            text: 'वर्कफ़्लो ऑटोमेट करें और सिस्टम को जोड़ें।',
          },
        ],
      },
      {
        title: 'डाटा और एनालिटिक्स',
        items: [
          {
            href: '/services/data-analytics',
            title: 'डाटा एनालिटिक्स',
            text: 'डाटा से सही इनसाइट्स निकालें और बेहतर फ़ैसले लें।',
          },
          {
            href: '/services/maintenance',
            title: 'मेंटेनेंस और सपोर्ट',
            text: 'एप्लिकेशंस को सुचारू रूप से चलाने के लिए सहायता।',
          },
        ],
      },
      {
        title: 'AI सर्विसेज़',
        items: [
          {
            href: '/ai/agentic',
            title: 'Agentic AI',
            text: 'स्वचालित AI एजेंट्स जो आपके बिज़नेस को चलाएँ।',
          },
          {
            href: '/ai/bot-creation',
            title: 'बोट क्रिएशन',
            text: 'कस्टम चैटबोट और वॉइसबोट बनवाएँ।',
          },
          {
            href: '/ai/workflows',
            title: 'AI वर्कफ़्लो',
            text: 'AI से प्रोसेस ऑटोमेशन और स्मार्ट वर्कफ़्लो।',
          },
          {
            href: '/ai/llms',
            title: 'LLM सॉल्यूशंस',
            text: 'लार्ज लैंग्वेज मॉडल से बिज़नेस इनोवेशन।',
          },
          {
            href: '/ai/custom-model-training',
            title: 'कस्टम AI ट्रेनिंग',
            text: 'आपके डाटा पर कस्टम AI मॉडल ट्रेन करें।',
          },
        ],
      },
    ],
  },
  enquiry: {
    label: '06 — संपर्क',
    title: 'अपनी जानकारी भेजें',
    lede: 'फ़ॉर्म भरें, हमारी टीम 24 घंटे के अंदर आपसे संपर्क करेगी।',
    points: ['24 घंटे में जवाब', 'आपका डाटा सुरक्षित है', 'मुफ़्त सलाह — कोई चार्ज नहीं'],
    formLabel: 'अपनी जानकारी भेजें',
  },
  contact: {
    phoneLabel: 'फ़ोन करें',
    emailLabel: 'ईमेल करें',
    email: 'growth@exyconn.com',
  },
  cta: {
    title: 'अपनी सफलता की कहानी आज ही शुरू करो!',
    text: 'आपका डिजिटल ट्रांसफ़ॉर्मेशन सिर्फ़ एक बातचीत दूर है। हमारे ग्रोथ आर्किटेक्ट्स से जुड़ें — अभी!',
    primary: {
      label: 'अभी शुरू करो',
      href: '#enquiry-form',
      external: false,
    },
  },
  form: {
    fields: {
      name: {
        label: 'आपका नाम',
        placeholder: 'अपना पूरा नाम लिखें',
      },
      phone: {
        label: 'फ़ोन नंबर',
        placeholder: '9876543210',
      },
      email: {
        label: 'ईमेल',
        placeholder: 'aapka@email.com',
      },
      business: {
        label: 'बिज़नेस का नाम',
        placeholder: 'आपकी कंपनी / दुकान का नाम',
      },
      message: {
        label: 'कुछ और बताना है?',
        placeholder: 'अपनी ज़रूरत यहाँ लिखें...',
      },
    },
    plan: {
      label: 'कौनसा प्लान चाहिए?',
      placeholder: '— प्लान चुनें —',
    },
    customPlan: 'मुझे सलाह चाहिए',
    popularShort: 'लोकप्रिय',
    captcha: {
      label: 'सुरक्षा जाँच',
      placeholder: 'जवाब',
      refreshTitle: 'नया सवाल',
      refreshLabel: 'कैप्चा रीफ्रेश करें',
    },
    success: 'धन्यवाद! हम जल्द ही आपसे संपर्क करेंगे।',
    submit: 'अभी भेजें',
    sending: 'भेज रहे हैं...',
    status: {
      loading: 'Loading…',
      loadFailed: 'The security question could not be loaded. Please refresh it.',
      incorrect: 'गलत जवाब — दोबारा कोशिश करें',
      failed: 'कुछ गड़बड़ हो गई। कृपया दोबारा कोशिश करें।',
    },
    messages: {
      nameRequired: 'नाम ज़रूरी है',
      nameTooShort: 'नाम बहुत छोटा है',
      nameTooLong: 'नाम बहुत लंबा है',
      phoneRequired: 'फ़ोन नंबर ज़रूरी है',
      phoneInvalid: 'सही 10 अंकों का मोबाइल नंबर डालें',
      emailRequired: 'ईमेल ज़रूरी है',
      emailInvalid: 'सही ईमेल डालें',
      businessTooLong: 'बहुत लंबा है',
      planRequired: 'कोई प्लान चुनें',
      messageTooLong: 'संदेश बहुत लंबा है',
      captchaRequired: 'कैप्चा हल करें',
    },
  },
};
