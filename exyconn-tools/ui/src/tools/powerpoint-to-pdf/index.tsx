import { FaFilePowerpoint } from 'react-icons/fa';
import OfficeToPdf from '../../shared/components/OfficeToPdf';
import { ACCEPT_ATTR, isAcceptedFile } from './utils';

export default function PowerpointToPdf() {
  return (
    <OfficeToPdf
      toolName="PowerPoint to PDF"
      icon={<FaFilePowerpoint />}
      color="#8b5cf6"
      hoverColor="#7c3aed"
      accept={ACCEPT_ATTR}
      isAcceptedFile={isAcceptedFile}
      invalidFileMessage="Please select a PowerPoint file (.ppt or .pptx)."
      dropTitle="Drag & Drop PowerPoint File Here"
      supportedFormats="Supports .ppt and .pptx files"
      emptyHint="Upload a PowerPoint presentation to get started"
    />
  );
}
