/** schema.org JSON-LD for the India offer: the service and its three priced packages. */
import { type OfferPlan } from "./plans";

interface Provider {
  name: string;
  url: string;
}

export const offerServiceJsonLd = (
  name: string,
  description: string,
  url: string,
  plans: readonly OfferPlan[],
  provider: Provider
) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name,
  description,
  url,
  areaServed: { "@type": "Country", name: "India" },
  provider: { "@type": "Organization", name: provider.name, url: provider.url },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name,
    itemListElement: plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: String(plan.price),
      priceCurrency: "INR",
      url: `${url}#plans`,
    })),
  },
});
