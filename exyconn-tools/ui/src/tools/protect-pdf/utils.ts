export const MIN_PASSWORD_LENGTH = 4;
export const SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';

export const formatSize = (b: number): string =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export const validateUserPassword = (value: string): string => {
  if (!value) return 'User password is required.';
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return '';
};

export const protectedFileName = (name: string): string => {
  const base = name.toLowerCase().endsWith('.pdf') ? name.slice(0, -4) : name;
  return `${base}-protected.pdf`;
};

const readErrorMessage = async (res: Response): Promise<string> => {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Request failed with status ${res.status}.`;
  } catch {
    return `Request failed with status ${res.status}.`;
  }
};

export const requestProtectedPdf = async (
  url: string,
  file: File,
  userPassword: string,
  ownerPassword: string,
): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('userPassword', userPassword);
  if (ownerPassword) formData.append('ownerPassword', ownerPassword);
  const res = await fetch(url, { method: 'POST', body: formData });
  if (res.status === 503) throw new Error(SERVICE_UNAVAILABLE);
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return res.blob();
};

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};
