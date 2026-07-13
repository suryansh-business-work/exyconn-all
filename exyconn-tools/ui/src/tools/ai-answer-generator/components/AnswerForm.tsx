import React from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { QuestionAnswer, Send } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface AnswerFormProps {
  onSubmit: (question: string, context: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  question: Yup.string().required('Question is required').min(5, 'Question must be at least 5 characters'),
  context: Yup.string(),
});

const AnswerForm: React.FC<AnswerFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { question: '', context: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.question, values.context),
  });

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <QuestionAnswer color="primary" />
        <Typography variant="h6" fontWeight={600}>
          Ask a Question
        </Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Enter your question here..."
          value={formik.values.question}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.question && Boolean(formik.errors.question)}
          helperText={formik.touched.question && formik.errors.question}
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="context"
          label="Context (Optional)"
          placeholder="Add any relevant context to get a better answer..."
          value={formik.values.context}
          onChange={formik.handleChange}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading || !formik.values.question}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1.25 }}
        >
          {isLoading ? 'Generating Answer...' : 'Get Answer'}
        </Button>
      </form>
    </Paper>
  );
};

export default AnswerForm;
