import React from 'react';
import { Box, Typography, alpha, } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { BusinessCenter, AutoAwesome, MinimizeRounded, BrushRounded } from '@mui/icons-material';
import { TemplateType } from '../../types';

interface TemplateOption {
  id: TemplateType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const templates: TemplateOption[] = [
  { id: 'professional', name: 'Professional', description: 'Clean corporate style', icon: <BusinessCenter /> },
  { id: 'modern', name: 'Modern', description: 'Stylish with subtle accents', icon: <AutoAwesome /> },
  { id: 'minimal', name: 'Minimal', description: 'Simple and compact', icon: <MinimizeRounded /> },
  { id: 'creative', name: 'Creative', description: 'Bold and colorful', icon: <BrushRounded /> },
];

interface TemplateSelectorProps {
  selectedTemplate: TemplateType;
  onTemplateChange: (template: TemplateType) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplate, onTemplateChange }) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Typography variant="subtitle2" gutterBottom>
        Template
      </Typography>
      <Grid container spacing={1.5}>
        {templates.map((template) => (
          <Grid size={{ xs: 6, sm: 3 }} key={template.id}>
            <Box
              onClick={() => onTemplateChange(template.id)}
              sx={{
                p: 2,
                border: 2,
                borderColor: selectedTemplate === template.id ? 'primary.main' : 'divider',
                borderRadius: 2,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
                bgcolor: selectedTemplate === template.id ? alpha('#2563eb', 0.08) : 'transparent',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box sx={{ color: selectedTemplate === template.id ? 'primary.main' : 'text.secondary', mb: 0.5 }}>
                {template.icon}
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {template.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {template.description}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Grid>
  );
};

export default TemplateSelector;
