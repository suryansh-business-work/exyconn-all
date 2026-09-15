import ImageKit from "imagekit";
import { getActiveImageConfig } from "./integration-config";

let cached: { key: string; client: ImageKit } | null = null;

/**
 * Builds an ImageKit client from the provider account the portal marks active
 * (managed at Admin > Environment Variables, stored in MongoDB — no ImageKit env
 * vars here). The client is rebuilt whenever those credentials change.
 */
async function getClient(): Promise<ImageKit> {
  const config = await getActiveImageConfig();
  const key = `${config.publicKey}:${config.privateKey}:${config.urlEndpoint}`;
  if (!cached || cached.key !== key) {
    cached = {
      key,
      client: new ImageKit({
        publicKey: config.publicKey,
        privateKey: config.privateKey,
        urlEndpoint: config.urlEndpoint,
      }),
    };
  }
  return cached.client;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  fileId?: string;
  name?: string;
  error?: string;
}

/** Every upload from the public tools site lands under this folder, and only files there can be deleted. */
export const TOOLS_FOLDER = "/tools";

export async function uploadImage(
  file: Buffer,
  fileName: string,
  folder: string,
): Promise<UploadResponse> {
  try {
    const imagekit = await getClient();
    const response = await imagekit.upload({
      file,
      fileName,
      folder,
      useUniqueFileName: true,
    });

    return {
      success: true,
      url: response.url,
      fileId: response.fileId,
      name: response.name,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return { success: false, error: "Upload failed" };
  }
}

export type DeleteResult = "deleted" | "forbidden" | "failed";

/** Deletes a file, but only one stored under the tools folder. */
export async function deleteToolsImage(fileId: string): Promise<DeleteResult> {
  try {
    const imagekit = await getClient();
    const details = await imagekit.getFileDetails(fileId);
    if (!details.filePath.startsWith(`${TOOLS_FOLDER}/`)) {
      return "forbidden";
    }
    await imagekit.deleteFile(fileId);
    return "deleted";
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return "failed";
  }
}
