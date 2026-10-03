/**
 * The logos the capability and service pages show, keyed so page modules name them instead
 * of repeating URLs. Width and height are each file's intrinsic size (for the aspect ratio).
 * Only the marks these pages already showed; broken or mislabelled images were dropped.
 */
export const LOGO_KEYS = ["claude", "openai", "gemini", "adobeAnalytics"] as const;
export type LogoKey = (typeof LOGO_KEYS)[number];

export interface DetailLogo {
  name: string;
  src: string;
  width: number;
  height: number;
}

export const DETAIL_LOGOS: Readonly<Record<LogoKey, DetailLogo>> = {
  claude: {
    name: "Claude",
    src: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg",
    width: 690,
    height: 148,
  },
  openai: { name: "OpenAI", src: "/logos/openai.svg", width: 512, height: 142 },
  gemini: { name: "Gemini", src: "/logos/gemini.png", width: 3304, height: 1200 },
  adobeAnalytics: {
    name: "Adobe Analytics",
    src: "https://improvado.io/5a1eb87c9afe1000014a4c7d/64e351d1fc727d1651281ecd_646cbd27e444c08356e0a1c3_adobe-analytics-adobe-experience-cloud.png",
    width: 580,
    height: 242,
  },
};

export const logosFor = (keys: readonly LogoKey[]): DetailLogo[] =>
  keys.map((key) => DETAIL_LOGOS[key]);
