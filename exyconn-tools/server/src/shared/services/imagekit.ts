import ImageKit from "imagekit";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

if (!publicKey || !privateKey || !urlEndpoint) {
  console.warn("⚠️ ImageKit environment variables not set. Image upload features will be disabled.");
  console.warn("Required: IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT");
}

const imagekit = publicKey && privateKey && urlEndpoint
  ? new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })
  : null;

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
  if (!imagekit) {
    return {
      success: false,
      error: "ImageKit not configured. Missing environment variables.",
    };
  }

  try {
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
  if (!imagekit) {
    console.error("ImageKit not configured");
    return false;
  }

  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return false;
  }
}

export function getAuthenticationParameters() {
  if (!imagekit) {
    return { token: "", expire: 0, signature: "" };
  }
  return imagekit.getAuthenticationParameters();
}

export function isImageKitConfigured(): boolean {
  return imagekit !== null;
}

export default imagekit;
