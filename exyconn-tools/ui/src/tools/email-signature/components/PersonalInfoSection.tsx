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
import { ExpandMore, Person, Work, Business } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues } from '../types';

interface PersonalInfoSectionProps {
  formik: FormikProps<SignatureFormValues>;
}

const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({ formik }) => {
  const { values, errors, touched, handleChange, handleBlur } = formik;

  return (
    <Accordion
      defaultExpanded
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="primary" fontSize="small" />
          <Typography fontWeight={600}>Personal Information</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              name="fullName"
              label="Full Name"
              value={values.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.fullName && Boolean(errors.fullName)}
              helperText={touched.fullName && errors.fullName}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              name="jobTitle"
              label="Job Title"
              value={values.jobTitle}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.jobTitle && Boolean(errors.jobTitle)}
              helperText={touched.jobTitle && errors.jobTitle}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Work fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              name="department"
              label="Department"
              value={values.department}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.department && Boolean(errors.department)}
              helperText={touched.department && errors.department}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              name="company"
              label="Company"
              value={values.company}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.company && Boolean(errors.company)}
              helperText={touched.company && errors.company}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business fontSize="small" color="action" />
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

export default PersonalInfoSection;
