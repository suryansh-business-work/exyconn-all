import { LocalAuthProvider, defineConfig } from "tinacms";
import { TinaUserCollection, UsernamePasswordAuthJSProvider } from "tinacms-authjs/dist/tinacms";
import { blogCollection } from "./collections/blog";
import { caseStudyCollection } from "./collections/case-study";

// `pnpm dev` (TINA_PUBLIC_IS_LOCAL=true) edits the working tree without a login. The production
// editor at /admin signs in against the users collection kept in the self-hosted database.
const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

export default defineConfig({
  telemetry: "disabled",
  // Self-hosted backend, served by src/pages/api/tina/[...routes].ts on the same origin.
  contentApiUrlOverride: "/api/tina/gql",
  authProvider: isLocal ? new LocalAuthProvider() : new UsernamePasswordAuthJSProvider(),
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
      // Without TinaCloud there is no upload service: the media manager lists the files
      // committed under public/uploads, and image fields also accept a pasted URL.
      static: true,
    },
  },
  schema: {
    collections: [TinaUserCollection, blogCollection, caseStudyCollection],
  },
});
