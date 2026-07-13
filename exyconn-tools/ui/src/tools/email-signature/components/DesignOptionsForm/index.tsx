import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Grid } from '@mui/material';
import { ExpandMore, Palette } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues, TemplateType, ThemeType } from '../../types';
import TemplateSelector from './TemplateSelector';
import ThemeSelector from './ThemeSelector';
import ColorPicker from './ColorPicker';
import FontSettings from './FontSettings';

interface DesignOptionsFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const primaryColorPresets = ['#2563eb', '#059669', '#dc2626', '#7c3aed', '#ea580c', '#0891b2', '#be185d', '#1e293b'];

const secondaryColorPresets = ['#64748b', '#6b7280', '#71717a', '#78716c', '#737373', '#a1a1aa', '#9ca3af', '#94a3b8'];

const DesignOptionsForm: React.FC<DesignOptionsFormProps> = ({ formik }) => {
  const { values, setFieldValue } = formik;

  return (
    <Box>
      <Accordion
        defaultExpanded
        elevation={0}
        sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}
      >
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Palette color="primary" fontSize="small" />
            <Typography fontWeight={600}>Design & Style</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <TemplateSelector
              selectedTemplate={values.template}
              onTemplateChange={(template: TemplateType) => setFieldValue('template', template)}
            />
            <ThemeSelector
              selectedTheme={values.theme}
              onThemeChange={(theme: ThemeType) => setFieldValue('theme', theme)}
            />
            <ColorPicker
              label="Primary Color"
              colors={primaryColorPresets}
              selectedColor={values.primaryColor}
              onColorChange={(color) => setFieldValue('primaryColor', color)}
            />
            <ColorPicker
              label="Secondary Color"
              colors={secondaryColorPresets}
              selectedColor={values.secondaryColor}
              onColorChange={(color) => setFieldValue('secondaryColor', color)}
            />
            <FontSettings
              fontFamily={values.fontFamily}
              fontSize={values.fontSize}
              onFontFamilyChange={(fontFamily) => setFieldValue('fontFamily', fontFamily)}
              onFontSizeChange={(fontSize) => setFieldValue('fontSize', fontSize)}
            />
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default DesignOptionsForm;
