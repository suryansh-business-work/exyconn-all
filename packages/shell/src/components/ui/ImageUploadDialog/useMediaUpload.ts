import { useRef, useState } from 'react';
import { useNotify } from '@/components/feedback/NotificationProvider';
import {
  useImportMediaFromUrlMutation,
  useUploadImageMutation,
  type PexelsMediaFieldsFragment,
} from '@/graphql/generated';
import { fileToDataUrl, MAX_IMAGE_BYTES } from '@/utils/file';
import { cropImageToDataUrl, type CropRect } from './crop-image';

export const MAX_MB = MAX_IMAGE_BYTES / (1024 * 1024);

/** Vector art is uploaded as-is; rasterising a logo through the crop canvas would ruin it. */
const SVG_MIME = 'image/svg+xml';

/** What the user has picked but not yet uploaded — the dialog's review step renders this. */
export interface MediaSelection {
  /** Shown in the review step, and the source the cropper reads. */
  previewUrl: string;
  fileName: string;
  mimeType: string;
  /** A clip cannot be cropped, and is imported to ImageKit by URL rather than as base64. */
  isVideo: boolean;
  isVector: boolean;
  /** The Pexels URL behind a stock pick. Absent for a file from the device. */
  stockUrl?: string;
}

/** Everything but a vector or a clip goes through the crop step before it is uploaded. */
export const isCroppable = (selection: MediaSelection): boolean =>
  !selection.isVideo && !selection.isVector;

/** The bytes to upload: the cropped region, or the file itself when cropping does not apply. */
const resolveDataUrl = (selection: MediaSelection, crop: CropRect | null): Promise<string> => {
  if (!isCroppable(selection) || !crop) {
    return Promise.resolve(selection.previewUrl);
  }
  return cropImageToDataUrl(selection.previewUrl, crop, selection.mimeType);
};

/** Turns a Pexels result into a selection: a clip keeps its poster, a photo its full file. */
const toStockSelection = (item: PexelsMediaFieldsFragment): MediaSelection => {
  const isVideo = item.duration > 0;
  return {
    previewUrl: isVideo ? item.previewUrl : item.url,
    fileName: `pexels-${item.id}.${isVideo ? 'mp4' : 'jpg'}`,
    mimeType: isVideo ? 'video/mp4' : 'image/jpeg',
    isVideo,
    isVector: false,
    stockUrl: item.url,
  };
};

/**
 * The upload dialog's one piece of state: what is selected, and how it reaches ImageKit.
 * Nothing is stored against a third-party CDN — a device file and a stock photo are both
 * uploaded through `uploadImage`, and a stock clip is imported server-side by URL.
 */
export function useMediaUpload(folder: string | undefined, onUploaded: (url: string) => void) {
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<MediaSelection | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadImage] = useUploadImageMutation();
  const [importMedia] = useImportMediaFromUrlMutation();

  const clear = () => setSelection(null);

  const pickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;
    if (picked.size > MAX_IMAGE_BYTES) {
      notify(`Image must be ${MAX_MB} MB or smaller`, 'error');
      return;
    }
    try {
      setSelection({
        previewUrl: await fileToDataUrl(picked),
        fileName: picked.name,
        mimeType: picked.type,
        isVideo: false,
        isVector: picked.type === SVG_MIME,
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not read the file', 'error');
    }
  };

  const pickStock = (item: PexelsMediaFieldsFragment) => setSelection(toStockSelection(item));

  const sendToImageKit = async (current: MediaSelection, crop: CropRect | null) => {
    if (current.isVideo) {
      const { data } = await importMedia({
        variables: { url: current.stockUrl ?? '', fileName: current.fileName, folder },
      });
      return data?.importMediaFromUrl;
    }
    const { data } = await uploadImage({
      variables: {
        file: await resolveDataUrl(current, crop),
        fileName: current.fileName,
        folder,
      },
    });
    return data?.uploadImage;
  };

  const upload = async (crop: CropRect | null) => {
    if (!selection || uploading) return;
    setUploading(true);
    try {
      const url = await sendToImageKit(selection, crop);
      if (!url) throw new Error('Upload returned no URL');
      notify('Upload complete');
      setSelection(null);
      onUploaded(url);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return { inputRef, selection, uploading, pickFile, pickStock, clear, upload };
}
