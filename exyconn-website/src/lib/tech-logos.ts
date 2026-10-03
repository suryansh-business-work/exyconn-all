/** The AI and cloud platforms the "Powered By Leading Technology" strip shows by default. */
export interface LogoItem {
  name: string;
  src: string;
  /** Custom width class e.g., "w-20", "w-24", etc. */
  width?: string;
}

export const defaultTechLogos: LogoItem[] = [
  { name: "OpenAI", src: "/logos/openai.svg", width: "w-[150px]" },
  { name: "Anthropic", src: "/logos/anthropic.svg" },
  { name: "Google Cloud", src: "/logos/google-cloud.svg" },
  { name: "AWS", src: "/logos/aws.png", width: "w-[50px]" },
  { name: "Azure", src: "/logos/azure.svg", width: "w-[170px]" },
  { name: "Gemini", src: "/logos/gemini.png" },
];
