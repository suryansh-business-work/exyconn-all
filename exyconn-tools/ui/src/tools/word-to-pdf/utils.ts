import { hasAcceptedExtension } from '../../shared/components/OfficeToPdf/utils';

export {
  NETWORK_ERROR_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  downloadBlob,
  formatSize,
  pdfFileName,
  readErrorMessage,
} from '../../shared/components/OfficeToPdf/utils';

export const ACCEPTED_EXTENSIONS = ['.doc', '.docx'];

export const ACCEPT_ATTR =
  '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const isAcceptedFile = (name: string): boolean => hasAcceptedExtension(name, ACCEPTED_EXTENSIONS);
