import { hasAcceptedExtension } from '../../shared/components/OfficeToPdf/utils';

export {
  NETWORK_ERROR_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
  downloadBlob,
  formatSize,
  pdfFileName,
  readErrorMessage,
} from '../../shared/components/OfficeToPdf/utils';

export const ACCEPTED_EXTENSIONS = ['.xls', '.xlsx'];

export const ACCEPT_ATTR =
  '.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const isAcceptedFile = (name: string): boolean => hasAcceptedExtension(name, ACCEPTED_EXTENSIONS);
