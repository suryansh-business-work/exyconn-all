import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  List,
  Paper,
} from '@mui/material';
import { Close, Save } from '@mui/icons-material';
import { Formik, Form, FieldArray, FormikErrors, FormikTouched } from 'formik';
import * as Yup from 'yup';
import { CustomSize } from '../../types';
import SizeItem from './SizeItem';
import AddSizeButtons from './AddSizeButtons';

interface Props {
  open: boolean;
  onClose: () => void;
  customSizes: CustomSize[];
  onSave: (sizes: CustomSize[]) => void;
}

const validationSchema = Yup.object().shape({
  sizes: Yup.array().of(
    Yup.object().shape({
      width: Yup.number()
        .required('Width is required')
        .min(1, 'Min 1px')
        .max(8192, 'Max 8192px')
        .integer('Must be integer'),
      height: Yup.number()
        .required('Height is required')
        .min(1, 'Min 1px')
        .max(8192, 'Max 8192px')
        .integer('Must be integer'),
      label: Yup.string().required('Label is required'),
    })
  ),
});

const CustomSizesDialog: React.FC<Props> = ({ open, onClose, customSizes, onSave }) => {
  const initialValues = {
    sizes: customSizes.length > 0 ? customSizes : [],
  };

  const handleSubmit = (values: { sizes: CustomSize[] }) => {
    onSave(values.sizes);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Custom Sizes</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, errors, touched, setFieldValue }) => (
          <Form>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add custom export sizes. Any width × height combination is supported (max 8192px).
              </Typography>

              <FieldArray name="sizes">
                {({ push, remove }) => (
                  <>
                    <AddSizeButtons sizesCount={values.sizes.length} onAddSize={push} />

                    {values.sizes.length === 0 ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          color: 'text.secondary',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <Typography>No custom sizes added yet.</Typography>
                        <Typography variant="caption">Click "Add Size" to create custom export dimensions.</Typography>
                      </Paper>
                    ) : (
                      <List disablePadding>
                        {values.sizes.map((size, index) => (
                          <SizeItem
                            key={size.id}
                            size={size}
                            index={index}
                            sizeErrors={(errors.sizes?.[index] as FormikErrors<CustomSize>) || {}}
                            sizeTouched={(touched.sizes?.[index] as FormikTouched<CustomSize>) || {}}
                            onRemove={() => remove(index)}
                            setFieldValue={setFieldValue}
                          />
                        ))}
                      </List>
                    )}
                  </>
                )}
              </FieldArray>
            </DialogContent>

            <DialogActions>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="contained" startIcon={<Save />}>
                Save {values.sizes.length > 0 ? `(${values.sizes.length})` : ''}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default CustomSizesDialog;
