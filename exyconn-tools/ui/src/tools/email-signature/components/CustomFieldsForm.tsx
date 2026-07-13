import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  
  IconButton,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore, Add, Delete, TextFields, Link, Phone, TuneRounded } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues, CustomField } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CustomFieldsFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <TextFields fontSize="small" />,
  link: <Link fontSize="small" />,
  phone: <Phone fontSize="small" />,
};

const CustomFieldsForm: React.FC<CustomFieldsFormProps> = ({ formik }) => {
  const { values, setFieldValue } = formik;

  const addField = () => {
    const newField: CustomField = {
      id: uuidv4(),
      label: '',
      value: '',
      type: 'text',
    };
    setFieldValue('customFields', [...values.customFields, newField]);
  };

  const removeField = (id: string) => {
    setFieldValue(
      'customFields',
      values.customFields.filter((f: CustomField) => f.id !== id)
    );
  };

  const updateField = (id: string, updates: Partial<CustomField>) => {
    setFieldValue(
      'customFields',
      values.customFields.map((f: CustomField) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  return (
    <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneRounded color="primary" fontSize="small" />
          <Typography fontWeight={600}>Custom Fields</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            ({values.customFields.length})
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          {values.customFields.map((field: CustomField, index: number) => (
            <Grid size={{ xs: 12 }} key={field.id}>
              <Box
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Field #{index + 1}
                  </Typography>
                  <IconButton size="small" color="error" onClick={() => removeField(field.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={field.type}
                        label="Type"
                        onChange={(e) => updateField(field.id, { type: e.target.value as 'text' | 'link' | 'phone' })}
                      >
                        <MenuItem value="text">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{typeIcons.text} Text</Box>
                        </MenuItem>
                        <MenuItem value="link">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{typeIcons.link} Link</Box>
                        </MenuItem>
                        <MenuItem value="phone">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{typeIcons.phone} Phone</Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Label"
                      placeholder="e.g., Booking Link"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Value"
                      placeholder={
                        field.type === 'link' ? 'https://...' : field.type === 'phone' ? '+1 234 567 890' : 'Value'
                      }
                      value={field.value}
                      onChange={(e) => updateField(field.id, { value: e.target.value })}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">{typeIcons[field.type]}</InputAdornment>,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button variant="outlined" startIcon={<Add />} onClick={addField} fullWidth sx={{ borderStyle: 'dashed' }}>
              Add Custom Field
            </Button>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default CustomFieldsForm;
