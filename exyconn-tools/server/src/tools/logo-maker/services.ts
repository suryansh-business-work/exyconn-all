import { removeBackground } from "@imgly/background-removal-node";

const DATA_URL_REGEX = /^data:image\/\w+;base64,(.+)$/;

/**
 * Remove the background from a base64 image data URL.
 * Returns the processed image as a PNG data URL, or null when the
 * input is not a valid image data URL.
 */
export async function removeBackgroundFromDataUrl(
  image: string,
): Promise<string | null> {
  const base64Match = DATA_URL_REGEX.exec(image);
  if (!base64Match) {
    return null;
  }

  const buffer = Buffer.from(base64Match[1], "base64");
  const blob = new Blob([buffer], { type: "image/png" });

  const resultBlob = await removeBackground(blob, {
    progress: (key, current, total) => {
      console.log(`Progress [${key}]: ${Math.round((current / total) * 100)}%`);
    },
  });

  const arrayBuffer = await resultBlob.arrayBuffer();
  const resultBuffer = Buffer.from(arrayBuffer);
  return `data:image/png;base64,${resultBuffer.toString("base64")}`;
}
