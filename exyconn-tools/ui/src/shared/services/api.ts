const isLocalDev = import.meta.env.DEV;
const API_BASE_URL = isLocalDev
  ? 'http://localhost:4002/api/common'
  : (import.meta.env.VITE_API_BASE_URL || 'https://tools-api.exyconn.com') + '/api/common';

export interface UploadResponse {
  success: boolean;
  url?: string;
  fileId?: string;
  name?: string;
  error?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

// ============== ImageKit Services ==============

/**
 * Upload a file to ImageKit via server
 */
export async function uploadImage(file: File, folder: string = '/tools', fileName?: string): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (fileName) {
      formData.append('fileName', fileName);
    }

    const response = await fetch(`${API_BASE_URL}/imagekit/upload`, {
      method: 'POST',
      body: formData,
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload a base64 image to ImageKit
 */
export async function uploadBase64Image(
  base64: string,
  fileName: string = 'image.png',
  folder: string = '/tools'
): Promise<UploadResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/imagekit/upload-base64`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, fileName, folder }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Delete an image from ImageKit
 */
export async function deleteImage(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/imagekit/delete/${fileId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Delete image error:', error);
    return false;
  }
}

// ============== Email Services ==============

/**
 * Send a generic email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
}): Promise<EmailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send a test email with signature preview
 */
export async function sendSignatureTestEmail(
  to: string,
  signatureHtml: string,
  senderName?: string
): Promise<EmailResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send-signature-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, signatureHtml, senderName }),
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
    };
  }
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/email/verify`);
    const data = await response.json();
    return data.success && data.connected;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
}
