import type { APIRoute } from "astro";

const SITE_URL = "https://exyconn.com";

// AI / LLM crawlers explicitly welcomed for Generative Engine Optimization (GEO).
// Naming them removes ambiguity so ChatGPT, Claude, Perplexity, Gemini and
// AI Overviews can discover, read and cite Exyconn content.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "CCBot",
  "cohere-ai",
  "DuckAssistBot",
  "meta-externalagent",
];

const aiRules = AI_CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /\nDisallow: /api/`).join(
  "\n\n"
);

const robotsTxt = `# robots.txt for Exyconn — ${SITE_URL}
# Traditional search engines: full access
User-agent: *
Allow: /
Disallow: /api/

# AI & LLM crawlers: explicitly welcomed (GEO)
${aiRules}

Sitemap: ${SITE_URL}/sitemap.xml

# LLM-friendly site overview
# ${SITE_URL}/llms.txt
`;

export const GET: APIRoute = async () => {
  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
