import type { CmsSeedPage } from '../../types';
import { place } from './place';

/**
 * exyconn.com/india/offer (formerly src/pages/[market]/india/offer.astro): the Hindi India
 * offer. Its JSON-LD names {marketUrl}, {siteUrl} and {businessName}, filled per request.
 */
export const INDIA_OFFER_PAGE: CmsSeedPage = {
  key: 'india-offer',
  path: '/india/offer',
  kind: 'PAGE',
  title: 'Exyconn India Offer | बिज़नेस ऑनलाइन ₹4,999 से',
  layout: 'default',
  seo: {
    title: 'Exyconn India Offer | बिज़नेस ऑनलाइन ₹4,999 से',
    description:
      'अपने बिज़नेस को ऑनलाइन कैसे बढ़ाएँ? Exyconn के साथ अपना डिजिटल सफ़र शुरू करो। Website, Logo, SEO, Hosting — सब एक जगह। ₹4,999 से प्लान शुरू।',
    keywords:
      'business online kaise kare, website banwao, digital marketing India, logo design, SEO India, exyconn India offer, sasta website, business website India',
    ogImageUrl: '',
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
            name: 'Exyconn',
            item: '{marketUrl}',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'India Special Offer',
            item: '{marketUrl}/india/offer',
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Exyconn India Offer',
        description:
          'अपने बिज़नेस को ऑनलाइन कैसे बढ़ाएँ? Exyconn के साथ अपना डिजिटल सफ़र शुरू करो। Website, Logo, SEO, Hosting — सब एक जगह। ₹4,999 से प्लान शुरू।',
        url: '{marketUrl}/india/offer',
        areaServed: {
          '@type': 'Country',
          name: 'India',
        },
        provider: {
          '@type': 'Organization',
          name: '{businessName}',
          url: '{siteUrl}',
        },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Exyconn India Offer',
          itemListElement: [
            {
              '@type': 'Offer',
              name: 'Basic Biz',
              price: '4999',
              priceCurrency: 'INR',
              url: '{marketUrl}/india/offer#plans',
            },
            {
              '@type': 'Offer',
              name: 'Smart Biz',
              price: '9999',
              priceCurrency: 'INR',
              url: '{marketUrl}/india/offer#plans',
            },
            {
              '@type': 'Offer',
              name: 'Pro Biz',
              price: '14999',
              priceCurrency: 'INR',
              url: '{marketUrl}/india/offer#plans',
            },
          ],
        },
      },
    ],
  },
  html: [place('offer.page')].join(''),
  css: '',
};
