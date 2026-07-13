import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'quill/dist/quill.snow.css';
import {
  Box,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  
  InputAdornment,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ExpandMore, Campaign, Link, TextSnippet } from '@mui/icons-material';
import { FormikProps } from 'formik';
import { SignatureFormValues } from '../types';

interface CTADisclaimerFormProps {
  formik: FormikProps<SignatureFormValues>;
}

const CTADisclaimerForm: React.FC<CTADisclaimerFormProps> = ({ formik }) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;

  const quillModules = useMemo(
    () => ({
      toolbar: [['bold', 'italic', 'underline'], ['link'], ['clean']],
    }),
    []
  );

  const quillFormats = ['bold', 'italic', 'underline', 'link'];

  return (
    <Box>
      <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Campaign color="primary" fontSize="small" />
            <Typography fontWeight={600}>Call to Action</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                name="ctaText"
                label="Button Text"
                placeholder="e.g., Schedule a Meeting"
                value={values.ctaText}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.ctaText && Boolean(errors.ctaText)}
                helperText={touched.ctaText && errors.ctaText}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <TextSnippet fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                name="ctaUrl"
                label="Button Link"
                placeholder="https://calendly.com/yourname"
                value={values.ctaUrl}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.ctaUrl && Boolean(errors.ctaUrl)}
                helperText={touched.ctaUrl && errors.ctaUrl}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Link fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion elevation={0} sx={{ border: 1, borderColor: 'divider', '&:before': { display: 'none' }, mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextSnippet color="primary" fontSize="small" />
            <Typography fontWeight={600}>Disclaimer (Legal Text)</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Add confidentiality notices, legal disclaimers, or other text that appears below your signature.
          </Typography>
          <Box
            sx={{
              '& .quill': {
                borderRadius: 1,
                '& .ql-toolbar': {
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  borderColor: 'divider',
                },
                '& .ql-container': {
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                  borderColor: 'divider',
                  minHeight: 100,
                  fontSize: 14,
                },
              },
            }}
          >
            <ReactQuill
              theme="snow"
              value={values.disclaimer}
              onChange={(content) => setFieldValue('disclaimer', content)}
              modules={quillModules}
              formats={quillFormats}
              placeholder="e.g., This email and any attachments are confidential..."
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default CTADisclaimerForm;
