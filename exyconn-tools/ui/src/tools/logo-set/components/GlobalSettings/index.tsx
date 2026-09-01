import React, { useState } from 'react';
import { Paper } from '@mui/material';
import { LogoSettings, ExportFormat, ApplyScope, CustomSize } from '../../types';
import SettingsHeader from './SettingsHeader';
import ScopeSelector from './ScopeSelector';
import TransformSection from './TransformSection';
import AppearanceSection from './AppearanceSection';
import ExportSection from './ExportSection';
import CustomSizesSection from './CustomSizesSection';
import ResetDialog from './ResetDialog';

interface Props {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  applyScope: ApplyScope;
  onApplyScopeChange: (scope: ApplyScope) => void;
  customSizes: CustomSize[];
  onCustomSizesChange: (sizes: CustomSize[]) => void;
  onOpenCustomSizesDialog: () => void;
  onReset: () => void;
  hasCustomChanges: boolean;
  currentImage?: string;
}

const GlobalSettings: React.FC<Props> = ({
  settings,
  onChange,
  format,
  onFormatChange,
  applyScope,
  onApplyScopeChange,
  customSizes,
  onCustomSizesChange: _onCustomSizesChange,
  onOpenCustomSizesDialog,
  onReset,
  hasCustomChanges,
  currentImage,
}) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleUpdate = (key: keyof LogoSettings, value: number | string | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    if (hasCustomChanges) {
      setResetDialogOpen(true);
    } else {
      onReset();
    }
  };

  const confirmReset = () => {
    onReset();
    setResetDialogOpen(false);
  };

  return (
    <Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
      <SettingsHeader hasCustomChanges={hasCustomChanges} onReset={handleReset} />

      <ScopeSelector applyScope={applyScope} onApplyScopeChange={onApplyScopeChange} />

      <TransformSection settings={settings} onUpdate={handleUpdate} />

      <AppearanceSection settings={settings} onUpdate={handleUpdate} currentImage={currentImage} />

      <ExportSection format={format} onFormatChange={onFormatChange} />

      <CustomSizesSection customSizes={customSizes} onOpenCustomSizesDialog={onOpenCustomSizesDialog} />

      <ResetDialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)} onConfirm={confirmReset} />
    </Paper>
  );
};

export default GlobalSettings;
