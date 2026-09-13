import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const require = createRequire(import.meta.url);

/** Single source of truth for every micro-frontend's subdomain, dev port and page metadata. */
export const PORTAL_APPS = require("./apps.json");

const packageUrl = (relative) =>
  fileURLToPath(new URL(relative, import.meta.url));

const uiSrc = packageUrl("../ui/src");
const shellSrc = packageUrl("../shell/src");
const shellPublic = packageUrl("../shell/public");
const loginSrc = packageUrl("../login/src");
const crudSrc = packageUrl("../crud/src");
const tabberSrc = packageUrl("../tabber/src");

const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

/** The brand indigo, as the installed app's own chrome wears it (tokens: indigo[600]). */
const THEME_COLOR = "#4f46e5";
/** What a cold start paints before the first frame — the light page background. */
const BACKGROUND_COLOR = "#f7f8fa";

/**
 * Injects the `<head>` every portal app shares — favicon, description, the Inter
 * webfont and the page title — from the app registry, so the per-app `index.html`
 * stays a bare mount point and there is one place to change the shared metadata.
 */
function portalHtml(app) {
  const { title, description } = PORTAL_APPS[app];
  return {
    name: "exyconn:portal-html",
    transformIndexHtml: {
      order: "pre",
      handler: () => ({
        tags: [
          {
            tag: "link",
            attrs: {
              rel: "icon",
              type: "image/svg+xml",
              href: "/exyconn-icon.svg",
            },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "description", content: description },
            injectTo: "head",
          },
          {
            tag: "link",
            attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" },
            injectTo: "head",
          },
          {
            tag: "link",
            attrs: {
              rel: "preconnect",
              href: "https://fonts.gstatic.com",
              crossorigin: "",
            },
            injectTo: "head",
          },
          {
            tag: "link",
            attrs: { rel: "stylesheet", href: FONT_HREF },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "theme-color", content: THEME_COLOR },
            injectTo: "head",
          },
          {
            tag: "link",
            attrs: { rel: "apple-touch-icon", href: "/pwa/icon-any-192.png" },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: { name: "apple-mobile-web-app-capable", content: "yes" },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: {
              name: "apple-mobile-web-app-status-bar-style",
              content: "default",
            },
            injectTo: "head",
          },
          {
            tag: "meta",
            attrs: {
              name: "apple-mobile-web-app-title",
              content: shortName(app),
            },
            injectTo: "head",
          },
          { tag: "title", children: title, injectTo: "head" },
        ],
      }),
    },
  };
}

/** "Compliance · Exyconn Track" -> "Compliance": what fits under a home-screen icon. */
function shortName(app) {
  const { title } = PORTAL_APPS[app];
  return title.split("·")[0].trim();
}

/**
 * Makes every portal installable, and openable when the network is not.
 *
 * One service worker per app because each is its own origin (its own subdomain), so an
 * install is per portal — somebody who lives in HR puts HR on their home screen, not a
 * launcher for sixteen things they cannot open.
 *
 * Only the built shell is precached. Every API call is left alone: a cached answer from
 * GraphQL is a stale salary, a stale invoice or a stale ticket, and the portal would rather
 * say it is offline than quietly show yesterday's numbers.
 */
function portalPwa(app) {
  const { title, description } = PORTAL_APPS[app];
  return VitePWA({
    registerType: "prompt",
    // The shell registers the worker itself (packages/shell/src/pwa), through the browser's
    // own API — so no app has to carry a runtime dependency to be installable.
    injectRegister: null,
    includeAssets: ["exyconn-icon.svg", "pwa/*.png"],
    manifest: {
      name: title,
      short_name: shortName(app),
      description,
      start_url: "/",
      scope: "/",
      display: "standalone",
      theme_color: THEME_COLOR,
      background_color: BACKGROUND_COLOR,
      icons: [
        { src: "/pwa/icon-any-192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa/icon-any-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/pwa/icon-maskable-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/pwa/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      // The router is client-side, so every in-app URL falls back to the shell.
      navigateFallback: "/index.html",
      // Never the API, and never the login round trip.
      navigateFallbackDenylist: [/^\/graphql/, /^\/api/],
      globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      // The bundles are large and hashed; an outdated one is dead weight in the cache.
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          // The webfont only: it never changes under a URL, and it is what makes an
          // offline page look like the portal rather than like Times New Roman.
          urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
          handler: "CacheFirst",
          options: {
            cacheName: "exyconn-fonts",
            expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  });
}

/**
 * Vite + Vitest config shared by every portal micro-frontend, keyed by its entry in
 * the app registry. The workspace packages are consumed as source, so the aliases
 * below are what make `@exyconn/ui/...`, `@exyconn/shell/...`, `@exyconn/crud/...`, `@exyconn/tabber/...` and
 * the shell's own internal `@/...` resolve, and `dedupe` keeps React, MUI and Apollo
 * single instances across the app and the packages.
 */
export function portalViteConfig(app) {
  const entry = PORTAL_APPS[app];
  if (!entry) {
    throw new Error(
      `Unknown portal app "${app}" — add it to @exyconn/config/apps.json first.`,
    );
  }
  return {
    plugins: [react(), portalHtml(app), portalPwa(app)],
    publicDir: shellPublic,
    resolve: {
      alias: [
        { find: /^@exyconn\/shell$/, replacement: `${shellSrc}/index.ts` },
        { find: /^@exyconn\/shell\/(.*)$/, replacement: `${shellSrc}/$1` },
        { find: /^@exyconn\/crud$/, replacement: `${crudSrc}/index.ts` },
        { find: /^@exyconn\/crud\/(.*)$/, replacement: `${crudSrc}/$1` },
        { find: /^@exyconn\/tabber$/, replacement: `${tabberSrc}/index.ts` },
        { find: /^@exyconn\/tabber\/(.*)$/, replacement: `${tabberSrc}/$1` },
        { find: /^@exyconn\/login$/, replacement: `${loginSrc}/index.ts` },
        { find: /^@exyconn\/ui$/, replacement: `${uiSrc}/index.ts` },
        { find: /^@exyconn\/ui\/(.*)$/, replacement: `${uiSrc}/$1` },
        { find: /^@\/(.*)$/, replacement: `${shellSrc}/$1` },
      ],
      dedupe: [
        "react",
        "react-dom",
        "react-router-dom",
        "@apollo/client",
        "@emotion/react",
        "@emotion/styled",
        "@mui/material",
        "@mui/system",
        "@mui/x-date-pickers",
        "date-fns",
      ],
    },
    server: { port: entry.port, strictPort: true },
    test: {
      globals: true,
      environment: "jsdom",
      // Registers the jest-dom matchers. A bare specifier, resolved from the app, so the
      // matchers extend the very `expect` instance the app's vitest runs with.
      setupFiles: ["@testing-library/jest-dom/vitest"],
      include: ["__tests__/unit-tests/**/*.{test,spec}.{ts,tsx}"],
    },
  };
}
