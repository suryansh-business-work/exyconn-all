/// <reference types="astro/client" />

import type { Market } from "./lib/i18n/markets";

declare global {
  namespace App {
    interface Locals {
      /** The market this request is being served for — set by the middleware. */
      market: Market;
    }
  }
}

export {};
