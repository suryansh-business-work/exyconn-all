export const ACCEPTED_EXTENSIONS = ['.ppt', '.pptx'];

export const ACCEPT_ATTR =
  '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const SERVICE_UNAVAILABLE_MESSAGE =
  'The conversion service is temporarily unavailable. Please try again in a few minutes.';

export const NETWORK_ERROR_MESSAGE =
  'Could not reach the conversion server. Check your connection and try again.';

export const isAcceptedFile = (name: string): boolean => {
  const lower = name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

export const pdfFileName = (name: string): string => {
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  return `${base}.pdf`;
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const readErrorMessage = async (res: { status: number; json(): Promise<unknown> }): Promise<string> => {
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // Body was not JSON; fall through to the generic message.
  }
  return `Conversion failed (HTTP ${res.status}).`;
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
