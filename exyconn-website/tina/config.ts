import { defineConfig } from "tinacms";
import { blogCollection } from "./collections/blog";
import { caseStudyCollection } from "./collections/case-study";

// Only used when the editor is hosted through TinaCloud, which commits edits to this
// branch. `pnpm dev` runs the editor locally and writes straight to the working tree.
const branch = process.env.GITHUB_BRANCH ?? process.env.HEAD ?? "main";

export default defineConfig({
  telemetry: "disabled",
  branch,
  clientId: process.env.PUBLIC_TINA_CLIENT_ID,
  token: process.env.TINA_TOKEN,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "uploads",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [blogCollection, caseStudyCollection],
  },
});
