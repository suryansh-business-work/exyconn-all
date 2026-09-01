import React from 'react';
import { Box } from '@mui/material';
import { LogoSettings } from '../../types';
import TransparencyToggle from './TransparencyToggle';
import BackgroundColorPicker from './BackgroundColorPicker';
import { useColorExtraction } from './useColorExtraction';

interface AppearanceSectionProps {
  settings: LogoSettings;
  onUpdate: (key: keyof LogoSettings, value: number | string | boolean) => void;
  currentImage?: string;
}

const AppearanceSection: React.FC<AppearanceSectionProps> = ({ settings, onUpdate, currentImage }) => {
  const { extractedColors, isExtractingColors } = useColorExtraction(currentImage);

  return (
    <Box>
      <TransparencyToggle transparent={settings.transparent} onUpdate={onUpdate} />
      {!settings.transparent && (
        <BackgroundColorPicker
          backgroundColor={settings.backgroundColor}
          extractedColors={extractedColors}
          isExtractingColors={isExtractingColors}
          onUpdate={onUpdate}
        />
      )}
    </Box>
  );
};

export default AppearanceSection;
