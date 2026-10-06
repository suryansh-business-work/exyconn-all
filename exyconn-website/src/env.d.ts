/// <reference types="astro/client" />

import type { Market } from "./lib/i18n/markets";
import type { CmsPublicSite } from "./lib/cms/types";

declare global {
  namespace App {
    interface Locals {
      /** The market this request is being served for — set by the middleware. */
      market: Market;
      /** A CMS site served without markets, resolved from the host by the middleware. */
      cmsSite?: CmsPublicSite;
    }
  }
}

export {};
