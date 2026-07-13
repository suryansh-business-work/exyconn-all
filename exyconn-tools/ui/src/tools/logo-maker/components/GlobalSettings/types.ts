import { LogoSettings, ExportFormat, ApplyScope, CustomSize } from '../../types';

export interface GlobalSettingsProps {
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

export interface SettingsUpdateFn {
  (key: keyof LogoSettings, value: number | string | boolean): void;
}

export interface SliderControlProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

export interface ScopeSelectorProps {
  applyScope: ApplyScope;
  onApplyScopeChange: (scope: ApplyScope) => void;
}

export interface ExportFormatSelectorProps {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

export interface CustomSizesSectionProps {
  customSizes: CustomSize[];
  onOpenCustomSizesDialog: () => void;
}

export interface ResetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface SettingsHeaderProps {
  hasCustomChanges: boolean;
  onReset: () => void;
}
