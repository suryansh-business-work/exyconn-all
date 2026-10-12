import { FaFileWord } from 'react-icons/fa';
import OfficeToPdf from '../../shared/components/OfficeToPdf';
import { ACCEPT_ATTR, isAcceptedFile } from './utils';

export default function WordToPdf() {
  return (
    <OfficeToPdf
      toolName="Word to PDF"
      icon={<FaFileWord />}
      color="#2563eb"
      hoverColor="#1d4ed8"
      accept={ACCEPT_ATTR}
      isAcceptedFile={isAcceptedFile}
      invalidFileMessage="Please select a Word document (.doc or .docx)."
      dropTitle="Drag & Drop Word File Here"
      supportedFormats="Supports .doc and .docx files"
      emptyHint="Upload a Word document to get started"
    />
  );
}
