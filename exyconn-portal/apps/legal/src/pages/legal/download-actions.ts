import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import type { RowActionSpec } from '@exyconn/crud';

/** Row buttons that download a document's text; their keys are the export formats. */
export const PDF_ACTION: RowActionSpec = {
  key: 'pdf',
  label: 'download PDF',
  icon: PictureAsPdfIcon,
};

export const WORD_ACTION: RowActionSpec = {
  key: 'docx',
  label: 'download Word document',
  icon: DescriptionIcon,
};
