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
  Collapse,
  IconButton,
} from '@mui/material';
import { Language, Search, Settings, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { SitemapFormValues } from '../types';

interface SitemapFormProps {
  onSubmit: (values: SitemapFormValues) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  url: Yup.string().url('Please enter a valid URL').required('URL is required'),
  checkCommonPaths: Yup.boolean(),
  parseRobotsTxt: Yup.boolean(),
  maxDepth: Yup.number().min(1).max(5),
});

const SitemapForm: React.FC<SitemapFormProps> = ({ onSubmit, isLoading }) => {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const formik = useFormik<SitemapFormValues>({
    initialValues: {
      url: '',
      checkCommonPaths: true,
      parseRobotsTxt: true,
      maxDepth: 2,
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    },
  });

  const handleReset = () => {
    formik.resetForm();
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Language color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Find Sitemaps
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
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

        {/* Advanced Options Toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 2,
            cursor: 'pointer',
          }}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            Advanced Options
          </Typography>
          <IconButton size="small">
            {showAdvanced ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Box>

        <Collapse in={showAdvanced}>
          <Box sx={{ mb: 3, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
            <FormControlLabel
              control={
                <Switch
                  name="parseRobotsTxt"
                  checked={formik.values.parseRobotsTxt}
                  onChange={formik.handleChange}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Parse robots.txt for sitemap references</Typography>}
              sx={{ mb: 1.5 }}
            />

            <FormControlLabel
              control={
                <Switch
                  name="checkCommonPaths"
                  checked={formik.values.checkCommonPaths}
                  onChange={formik.handleChange}
                  color="primary"
                  size="small"
                />
              }
              label={<Typography variant="body2">Check common sitemap locations</Typography>}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Max Sitemap Index Depth: <strong>{formik.values.maxDepth}</strong>
              </Typography>
              <Slider
                name="maxDepth"
                value={formik.values.maxDepth}
                onChange={(_, value) => formik.setFieldValue('maxDepth', value)}
                min={1}
                max={5}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 3, label: '3' },
                  { value: 5, label: '5' },
                ]}
                valueLabelDisplay="auto"
                size="small"
              />
              <Typography variant="caption" color="text.secondary">
                How deep to follow sitemap index files
              </Typography>
            </Box>
          </Box>
        </Collapse>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading || !formik.values.url || !!formik.errors.url}
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Search />}
            sx={{ py: 1.25 }}
          >
            {isLoading ? 'Finding Sitemaps...' : 'Find Sitemaps'}
          </Button>
          <Button variant="outlined" onClick={handleReset} disabled={isLoading} sx={{ minWidth: 100 }}>
            Reset
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default SitemapForm;
