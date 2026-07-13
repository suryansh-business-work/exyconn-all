import React from 'react';
import {
  Box,
  TextField,
  Button,
  Slider,
  FormControlLabel,
  Switch,
  Typography,
  Paper,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import { Language, Description, ContactPhone, Search, Settings } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { ExtractFormValues, ExtractionMode } from '../types';

interface ExtractFormProps {
  onSubmit: (values: ExtractFormValues, mode: ExtractionMode) => void;
  isLoading: boolean;
  loadingMode: ExtractionMode | null;
}

const validationSchema = Yup.object({
  url: Yup.string().url('Please enter a valid URL').required('URL is required'),
  maxPages: Yup.number().min(1, 'Minimum 1 page').max(50, 'Maximum 50 pages').required('Required'),
  followLinks: Yup.boolean(),
});

const ExtractForm: React.FC<ExtractFormProps> = ({ onSubmit, isLoading, loadingMode }) => {
  const formik = useFormik<ExtractFormValues>({
    initialValues: {
      url: '',
      maxPages: 5,
      followLinks: true,
    },
    validationSchema,
    onSubmit: () => {},
  });

  const handleExtract = (mode: ExtractionMode) => {
    if (formik.isValid && formik.values.url) {
      onSubmit(formik.values, mode);
    }
  };

  const isValidUrl = formik.values.url && !formik.errors.url;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Language color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Extract from Website
        </Typography>
      </Box>

      <form>
        <TextField
          fullWidth
          name="url"
          label="Website URL"
          placeholder="https://example.com"
          value={formik.values.url}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.url && Boolean(formik.errors.url)}
          helperText={formik.touched.url && formik.errors.url}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Language fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Settings fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Max Pages to Scan: <strong>{formik.values.maxPages}</strong>
            </Typography>
          </Box>
          <Slider
            name="maxPages"
            value={formik.values.maxPages}
            onChange={(_, value) => formik.setFieldValue('maxPages', value)}
            min={1}
            max={50}
            step={1}
            marks={[
              { value: 1, label: '1' },
              { value: 10, label: '10' },
              { value: 25, label: '25' },
              { value: 50, label: '50' },
            ]}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary">
            More pages = more contacts but longer extraction time
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              name="followLinks"
              checked={formik.values.followLinks}
              onChange={formik.handleChange}
              color="primary"
            />
          }
          label={
            <Box>
              <Typography variant="body2">Follow internal links</Typography>
              <Typography variant="caption" color="text.secondary">
                Crawl linked pages on the same domain
              </Typography>
            </Box>
          }
          sx={{ mb: 3, alignItems: 'flex-start' }}
        />

        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Choose Extraction Type
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading || !isValidUrl}
            onClick={() => handleExtract('pages')}
            startIcon={loadingMode === 'pages' ? <CircularProgress size={18} color="inherit" /> : <Description />}
            sx={{ py: 1.5, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            {loadingMode === 'pages' ? 'Extracting Pages...' : 'Extract Pages Only'}
          </Button>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading || !isValidUrl}
            onClick={() => handleExtract('contacts')}
            startIcon={loadingMode === 'contacts' ? <CircularProgress size={18} color="inherit" /> : <ContactPhone />}
            sx={{ py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            {loadingMode === 'contacts' ? 'Extracting...' : 'Extract Contacts (Email, Phone, Address)'}
          </Button>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading || !isValidUrl}
            onClick={() => handleExtract('all')}
            startIcon={loadingMode === 'all' ? <CircularProgress size={18} color="inherit" /> : <Search />}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' },
            }}
          >
            {loadingMode === 'all' ? 'Extracting Everything...' : 'Extract All (Pages + Contacts)'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ExtractForm;
