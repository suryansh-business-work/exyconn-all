export const SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';
export const INCORRECT_PASSWORD = 'INCORRECT_PASSWORD';

export const formatSize = (b: number): string =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 * 1024)).toFixed(2)} MB`;

export const unlockedFileName = (name: string): string => {
  const base = name.toLowerCase().endsWith('.pdf') ? name.slice(0, -4) : name;
  return `${base}-unlocked.pdf`;
};

const readErrorMessage = async (res: Response): Promise<string> => {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Request failed with status ${res.status}.`;
  } catch {
    return `Request failed with status ${res.status}.`;
  }
};

export const requestUnlockedPdf = async (url: string, file: File, password: string): Promise<Blob> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);
  const res = await fetch(url, { method: 'POST', body: formData });
  if (res.status === 503) throw new Error(SERVICE_UNAVAILABLE);
  if (res.status === 400) throw new Error(INCORRECT_PASSWORD);
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
