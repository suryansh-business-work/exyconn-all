import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress } from '@mui/material';
import { Send, TextFields } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface TextChatFormProps {
  onSubmit: (textContent: string, question: string) => void;
  isLoading: boolean;
}

const validationSchema = Yup.object({
  textContent: Yup.string().required('Text content is required').min(20, 'Content too short'),
  question: Yup.string().required('Question is required').min(5, 'Question too short'),
});

const TextChatForm: React.FC<TextChatFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { textContent: '', question: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.textContent, values.question),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextFields color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Chat With Text
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="textContent"
          label="Paste Your Text"
          placeholder="Paste any text you want to chat about..."
          multiline
          rows={6}
          value={formik.values.textContent}
          onChange={formik.handleChange}
          error={formik.touched.textContent && Boolean(formik.errors.textContent)}
          helperText={formik.touched.textContent && formik.errors.textContent}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          name="question"
          label="Your Question"
          placeholder="Ask a question about this text..."
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

export default TextChatForm;
