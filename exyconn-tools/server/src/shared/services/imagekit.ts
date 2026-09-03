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

export async function uploadImage(
  file: Buffer | string,
  fileName: string,
  folder: string = "/tools",
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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function deleteImage(fileId: string): Promise<boolean> {
  try {
    const imagekit = await getClient();
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return false;
  }
}

export async function getAuthenticationParameters() {
  const imagekit = await getClient();
  return imagekit.getAuthenticationParameters();
}

export async function isImageKitConfigured(): Promise<boolean> {
  try {
    await getClient();
    return true;
  } catch {
    return false;
  }
}
