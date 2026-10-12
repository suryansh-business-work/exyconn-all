import { hasAcceptedExtension } from '../../shared/components/OfficeToPdf/utils';

export {
  NETWORK_ERROR_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  downloadBlob,
  formatSize,
  pdfFileName,
  readErrorMessage,
} from '../../shared/components/OfficeToPdf/utils';

export const ACCEPTED_EXTENSIONS = ['.ppt', '.pptx'];

export const ACCEPT_ATTR =
  '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation';

export const isAcceptedFile = (name: string): boolean => hasAcceptedExtension(name, ACCEPTED_EXTENSIONS);
