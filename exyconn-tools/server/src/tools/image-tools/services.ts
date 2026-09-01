import sharp from "sharp";

export const MAX_OUTPUT_DIMENSION = 8000;

export class OutputTooLargeError extends Error {
  constructor() {
    super(
      `Upscaled image would exceed ${MAX_OUTPUT_DIMENSION}px on a side`,
    );
    this.name = "OutputTooLargeError";
  }
}

export interface UpscaleResult {
  buffer: Buffer;
  contentType: string;
}

export async function upscaleImage(
  input: Buffer,
  scale: number,
  mimeType: string,
): Promise<UpscaleResult> {
  const image = sharp(input);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions");
  }

  const width = metadata.width * scale;
  const height = metadata.height * scale;

  if (width > MAX_OUTPUT_DIMENSION || height > MAX_OUTPUT_DIMENSION) {
    throw new OutputTooLargeError();
  }

  const buffer = await image
    .resize(width, height, { kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.5 })
    .toBuffer();

  return { buffer, contentType: mimeType };
}
