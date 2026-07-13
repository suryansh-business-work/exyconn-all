import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, Article } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface WordChatFormProps {
  onSubmit: (wordContent: string, question: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  wordContent: Yup.string().required('Word document content is required').min(50, 'Content too short'),
  question: Yup.string().required('Question is required').min(5, 'Question too short'),
});

const WordChatForm: React.FC<WordChatFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { wordContent: '', question: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.wordContent, values.question),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Article color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Chat With Word Document
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="wordContent"
          label="Paste Word Document Content"
          placeholder="Paste Word document text here..."
          multiline
          rows={6}
          value={formik.values.wordContent}
          onChange={formik.handleChange}
          error={formik.touched.wordContent && Boolean(formik.errors.wordContent)}
          helperText={formik.touched.wordContent && formik.errors.wordContent}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Ask about this document..."
          value={formik.values.question}
          onChange={formik.handleChange}
          error={formik.touched.question && Boolean(formik.errors.question)}
          helperText={formik.touched.question && formik.errors.question}
          sx={{ mb: 2 }}
          size="small"
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
          sx={{ py: 1 }}
        >
          {isLoading ? 'Generating...' : 'Ask Question'}
        </Button>
      </form>
    </Paper>
  );
};

export default WordChatForm;
