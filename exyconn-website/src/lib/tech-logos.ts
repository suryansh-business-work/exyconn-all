/** The AI and cloud platforms the "Powered By Leading Technology" strip shows by default. */
export interface LogoItem {
  name: string;
  src: string;
}

export const defaultTechLogos: LogoItem[] = [
  { name: "OpenAI", src: "/logos/openai.svg" },
  { name: "Anthropic", src: "/logos/anthropic.svg" },
  { name: "Google Cloud", src: "/logos/google-cloud.svg" },
  { name: "AWS", src: "/logos/aws.png" },
  { name: "Azure", src: "/logos/azure.svg" },
  { name: "Gemini", src: "/logos/gemini.png" },
];
