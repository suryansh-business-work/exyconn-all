import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress, Chip } from '@mui/material';
import { Title, AutoAwesome } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface BlogTitleFormProps {
  onSubmit: (topic: string, keywords: string, count: number) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  topic: Yup.string().required('Topic is required').min(5, 'Topic must be at least 5 characters'),
  keywords: Yup.string(),
});

const BlogTitleForm: React.FC<BlogTitleFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { topic: '', keywords: '', count: 10 },
    validationSchema,
    onSubmit: (values) => onSubmit(values.topic, values.keywords, values.count),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Title color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Generate Blog Titles
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="topic"
          label="Blog Topic"
          placeholder="e.g., AI in healthcare, remote work productivity..."
          value={formik.values.topic}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.topic && Boolean(formik.errors.topic)}
          helperText={formik.touched.topic && formik.errors.topic}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="keywords"
          label="SEO Keywords (Optional)"
          placeholder="comma-separated keywords..."
          value={formik.values.keywords}
          onChange={formik.handleChange}
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Number of titles: {formik.values.count}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {[5, 10, 15, 20].map((num) => (
              <Chip
                key={num}
                label={num}
                onClick={() => formik.setFieldValue('count', num)}
                color={formik.values.count === num ? 'primary' : 'default'}
                variant={formik.values.count === num ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.topic}
          startIcon={isLoading ? <CircularProgress size={18} /> : <AutoAwesome />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating...' : 'Generate Titles'}
        </Button>
      </form>
    </Paper>
  );
};

export default BlogTitleForm;
