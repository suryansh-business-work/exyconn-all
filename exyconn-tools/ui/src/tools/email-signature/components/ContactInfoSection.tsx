import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  TextField,
  Typography,
  
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore, Phone, Email, PhoneAndroid, LocationOn } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues } from '../types';

interface ContactInfoSectionProps {
  formik: FormikProps<SignatureFormValues>;
}

const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({ formik }) => {
  const { values, errors, touched, handleChange, handleBlur } = formik;

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' }, mt: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Phone color="primary" fontSize="small" />
          <Typography fontWeight={600}>Contact Information</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              name="email"
              label="Email Address"
              type="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              name="phone"
              label="Phone Number"
              value={values.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.phone && Boolean(errors.phone)}
              helperText={touched.phone && errors.phone}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              name="mobile"
              label="Mobile Number"
              value={values.mobile}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.mobile && Boolean(errors.mobile)}
              helperText={touched.mobile && errors.mobile}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneAndroid fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              name="address"
              label="Address"
              value={values.address}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.address && Boolean(errors.address)}
              helperText={touched.address && errors.address}
              multiline
              rows={2}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

export default ContactInfoSection;
