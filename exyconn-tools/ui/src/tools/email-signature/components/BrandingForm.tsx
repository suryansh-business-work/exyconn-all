import React, { useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore, Image, AccountCircle, InsertPhoto, CloudUpload, Link } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues } from '../types';
import { ImageUpload } from '../../../shared/components/ImageUpload';

interface BrandingFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const BrandingForm: React.FC<BrandingFormProps> = ({ formik }) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Image color="primary" fontSize="small" />
          <Typography fontWeight={600}>Branding & Images</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={(_, value) => value && setInputMode(value)}
            size="small"
            fullWidth
          >
            <ToggleButton value="upload">
              <CloudUpload sx={{ mr: 1 }} fontSize="small" /> Upload
            </ToggleButton>
            <ToggleButton value="url">
              <Link sx={{ mr: 1 }} fontSize="small" /> URL
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {inputMode === 'upload' ? (
          <Grid container spacing={3} direction={'column'}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Profile Photo
              </Typography>
              <ImageUpload
                value={values.profilePhotoUrl}
                fileId={values.profilePhotoFileId}
                onChange={(url, fileId) => {
                  setFieldValue('profilePhotoUrl', url);
                  setFieldValue('profilePhotoFileId', fileId);
                }}
                folder="/email-signatures/photos"
                label="Drop photo here"
                helperText="Square (200×200)"
                maxWidth={100}
                maxHeight={100}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Company Logo
              </Typography>
              <ImageUpload
                value={values.logoUrl}
                fileId={values.logoFileId}
                onChange={(url, fileId) => {
                  setFieldValue('logoUrl', url);
                  setFieldValue('logoFileId', fileId);
                }}
                folder="/email-signatures/logos"
                label="Drop logo here"
                helperText="PNG with transparency"
                maxWidth={120}
                maxHeight={80}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle2" gutterBottom>
                Banner
              </Typography>
              <ImageUpload
                value={values.bannerUrl}
                fileId={values.bannerFileId}
                onChange={(url, fileId) => {
                  setFieldValue('bannerUrl', url);
                  setFieldValue('bannerFileId', fileId);
                }}
                folder="/email-signatures/banners"
                label="Drop banner here"
                helperText="Promotional (400×100)"
                maxWidth={200}
                maxHeight={60}
              />
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2} direction={'row'}>
            <Grid size={{ lg: 12, sm: 12, md: 12, xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                name="profilePhotoUrl"
                label="Profile Photo URL"
                placeholder="https://example.com/photo.jpg"
                value={values.profilePhotoUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.profilePhotoUrl && Boolean(errors.profilePhotoUrl)}
                helperText={
                  (touched.profilePhotoUrl && errors.profilePhotoUrl) || 'Square images work best (e.g., 200x200)'
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ lg: 12, sm: 12, md: 12, xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                name="logoUrl"
                label="Company Logo URL"
                placeholder="https://example.com/logo.png"
                value={values.logoUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.logoUrl && Boolean(errors.logoUrl)}
                helperText={(touched.logoUrl && errors.logoUrl) || 'Use a transparent PNG for best results'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Image fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ lg: 12, sm: 12, md: 12, xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                name="bannerUrl"
                label="Banner Image URL"
                placeholder="https://example.com/banner.jpg"
                value={values.bannerUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.bannerUrl && Boolean(errors.bannerUrl)}
                helperText={(touched.bannerUrl && errors.bannerUrl) || 'Optional promotional banner (max 400px width)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InsertPhoto fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default BrandingForm;
