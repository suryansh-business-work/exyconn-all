import { FaFileExcel } from 'react-icons/fa';
import OfficeToPdf from '../../shared/components/OfficeToPdf';
import { ACCEPT_ATTR, isAcceptedFile } from './utils';

export default function ExcelToPdf() {
  return (
    <OfficeToPdf
      toolName="Excel to PDF"
      icon={<FaFileExcel />}
      color="#14b8a6"
      hoverColor="#0d9488"
      accept={ACCEPT_ATTR}
      isAcceptedFile={isAcceptedFile}
      invalidFileMessage="Please select an Excel file (.xls or .xlsx)."
      dropTitle="Drag & Drop Excel File Here"
      supportedFormats="Supports .xls and .xlsx files"
      emptyHint="Upload an Excel spreadsheet to get started"
    />
  );
}
