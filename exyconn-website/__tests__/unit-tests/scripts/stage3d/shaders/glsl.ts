/**
 * Reads the declarations out of a GLSL source string, so a test can check that a shader
 * declares exactly what the materials bind and that paired stages agree on their varyings.
 */
type Qualifier = "uniform" | "attribute" | "varying";

const declarations = (source: string, qualifier: Qualifier): string[] => {
  const pattern = new RegExp(String.raw`^\s*${qualifier}\s+\w+\s+(\w+)\s*;`, "gm");
  return [...source.matchAll(pattern)].map((match) => match[1]);
};

export const uniformsOf = (source: string): string[] => declarations(source, "uniform");
export const attributesOf = (source: string): string[] => declarations(source, "attribute");
export const varyingsOf = (source: string): string[] => declarations(source, "varying");

/** True when the source has a `void main()` entry point. */
export const hasMain = (source: string): boolean => /void\s+main\s*\(\s*\)/.test(source);
