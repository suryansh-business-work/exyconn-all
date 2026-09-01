import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  LogoSettings,
  ExportFormat,
  ApplyScope,
  CustomSize,
  DEFAULT_SETTINGS,
  DEFAULT_CUSTOM_SIZES,
  FAVICON_SIZES,
  ICON_SIZES,
  LOGO_SIZES,
  SPLASH_SIZES,
} from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useImageHistory } from './hooks/useImageHistory';

export const useLogoState = () => {
  const { saveState, loadState, isLoaded } = useLocalStorage();
  const history = useImageHistory();

  const [image, setImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<LogoSettings>(DEFAULT_SETTINGS);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [applyScope, setApplyScope] = useState<ApplyScope>('all');
  const [customSizes, setCustomSizes] = useState<CustomSize[]>(DEFAULT_CUSTOM_SIZES);
  const [customSizesDialogOpen, setCustomSizesDialogOpen] = useState(false);
  const [croppedImages, setCroppedImages] = useState<Record<string, string>>({});
  const [sizeSettings, setSizeSettings] = useState<Record<string, LogoSettings>>({});
  const [initialSettings] = useState<LogoSettings>(DEFAULT_SETTINGS);

  const handleImageUpload = useCallback(
    (newImage: string | null) => {
      if (newImage) history.addToHistory(newImage);
      setImage(newImage);
    },
    [history]
  );

  const handleUndo = useCallback(() => {
    const prevImage = history.undo();
    if (prevImage) setImage(prevImage);
  }, [history]);

  const handleRedo = useCallback(() => {
    const nextImage = history.redo();
    if (nextImage) setImage(nextImage);
  }, [history]);

  useEffect(() => {
    if (isLoaded) {
      const saved = loadState();
      if (saved.image) setImage(saved.image);
      if (saved.globalSettings) setSettings(saved.globalSettings);
      if (saved.sizeSettings) setSizeSettings(saved.sizeSettings);
      if (saved.croppedImages) setCroppedImages(saved.croppedImages);
      if (saved.format) setFormat(saved.format as ExportFormat);
      if (saved.customSizes) setCustomSizes(saved.customSizes);
    }
  }, [isLoaded, loadState]);

  useEffect(() => {
    if (isLoaded) {
      saveState({ image, globalSettings: settings, sizeSettings, croppedImages, format, customSizes });
    }
  }, [image, settings, sizeSettings, croppedImages, format, customSizes, isLoaded, saveState]);

  const hasCustomChanges = useMemo(() => {
    return (
      JSON.stringify(settings) !== JSON.stringify(initialSettings) ||
      Object.keys(croppedImages).length > 0 ||
      Object.keys(sizeSettings).length > 0
    );
  }, [settings, initialSettings, croppedImages, sizeSettings]);

  const handleCroppedImage = useCallback((sizeKey: string, croppedImage: string) => {
    setCroppedImages((prev) => {
      if (croppedImage === '') {
        const updated = { ...prev };
        delete updated[sizeKey];
        return updated;
      }
      return { ...prev, [sizeKey]: croppedImage };
    });
  }, []);

  const handleSizeSettings = useCallback((sizeKey: string, newSettings: LogoSettings | null) => {
    setSizeSettings((prev) => {
      if (newSettings === null) {
        const updated = { ...prev };
        delete updated[sizeKey];
        return updated;
      }
      return { ...prev, [sizeKey]: newSettings };
    });
  }, []);

  const handleSettingsChange = useCallback(
    (newSettings: LogoSettings) => {
      setSettings(newSettings);
      if (applyScope !== 'all') {
        const allSizes = [...FAVICON_SIZES, ...ICON_SIZES, ...LOGO_SIZES, ...SPLASH_SIZES];
        const targetSizes: string[] = [];
        if (applyScope.endsWith('-all')) {
          const category = applyScope.replace('-all', '');
          allSizes.filter((s) => s.category === category).forEach((s) => targetSizes.push(`${s.category}-${s.width}`));
        } else if (applyScope === 'custom-all') {
          customSizes.forEach((s) => targetSizes.push(`custom-${s.id}`));
        } else if (applyScope.match(/^(\w+)-(\d+)$/)) {
          targetSizes.push(applyScope);
        }
        setSizeSettings((prev) => {
          const updated = { ...prev };
          targetSizes.forEach((key) => (updated[key] = newSettings));
          return updated;
        });
      }
    },
    [applyScope, customSizes]
  );

  const handleDelete = () => {
    setImage(null);
    setSettings(DEFAULT_SETTINGS);
    setCustomSizes(DEFAULT_CUSTOM_SIZES);
    setApplyScope('all');
    setCroppedImages({});
    setSizeSettings({});
    history.clearHistory();
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setCroppedImages({});
    setSizeSettings({});
  };

  return {
    image, settings, format, setFormat, applyScope, setApplyScope,
    customSizes, setCustomSizes, customSizesDialogOpen, setCustomSizesDialogOpen,
    croppedImages, sizeSettings, history, hasCustomChanges,
    handleImageUpload, handleUndo, handleRedo,
    handleCroppedImage, handleSizeSettings, handleSettingsChange,
    handleDelete, handleReset,
  };
};
