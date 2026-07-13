import React from 'react';
import { Box, Button, TextField, Paper, Typography, CircularProgress, MenuItem } from '@mui/material';
import { Analytics, Insights } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

interface ChatAnalyzerFormProps {
  onSubmit: (chatLog: string, focusArea: string) => void;
  isLoading: boolean;
}

const focusAreas = [
  { value: '', label: 'General Analysis' },
  { value: 'user_satisfaction', label: 'User Satisfaction' },
  { value: 'bot_accuracy', label: 'Bot Accuracy' },
  { value: 'conversation_flow', label: 'Conversation Flow' },
  { value: 'common_issues', label: 'Common Issues' },
  { value: 'improvement_opportunities', label: 'Improvement Opportunities' },
];

const validationSchema = Yup.object({
  chatLog: Yup.string().required('Chat log is required').min(100, 'Chat log too short'),
  focusArea: Yup.string(),
});

const ChatAnalyzerForm: React.FC<ChatAnalyzerFormProps> = ({ onSubmit, isLoading }) => {
  const formik = useFormik({
    initialValues: { chatLog: '', focusArea: '' },
    validationSchema,
    onSubmit: (values) => onSubmit(values.chatLog, values.focusArea),
  });

  return (
    <Paper elevation={0} sx={{ p: 2.5, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Insights color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Analyze Chat Conversations
        </Typography>
      </Box>
      <form onSubmit={formik.handleSubmit}>
        <TextField
          fullWidth
          name="chatLog"
          label="Paste Chat Log"
          placeholder="User: Hello\nBot: Hi! How can I help?\nUser: ..."
          multiline
          rows={6}
          value={formik.values.chatLog}
          onChange={formik.handleChange}
          error={formik.touched.chatLog && Boolean(formik.errors.chatLog)}
          helperText={formik.touched.chatLog && formik.errors.chatLog}
          sx={{ mb: 2 }}
          size="small"
        />
        <TextField
          fullWidth
          select
          name="focusArea"
          label="Focus Area (Optional)"
          value={formik.values.focusArea}
          onChange={formik.handleChange}
          sx={{ mb: 2 }}
          size="small"
        >
          {focusAreas.map((area) => (
            <MenuItem key={area.value} value={area.value}>
              {area.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={18} /> : <Analytics />}
          sx={{ py: 1 }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Conversation'}
        </Button>
      </form>
    </Paper>
  );
};

export default ChatAnalyzerForm;
