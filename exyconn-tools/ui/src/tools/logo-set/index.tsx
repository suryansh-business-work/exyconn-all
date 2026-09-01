import React from 'react';
import { Box, Container, Stack, IconButton, Tooltip, Divider } from '@mui/material';
import { AutoFixHigh, Undo, Redo } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import ImageUpload from './components/ImageUpload/ImageUpload';
import GlobalSettings from './components/GlobalSettings';
import PreviewGrid from './components/PreviewGrid/PreviewGrid';
import EmptyState from './components/EmptyState/EmptyState';
import CustomSizesDialog from './components/CustomSizesDialog/CustomSizesDialog';
import { useLogoState } from './useLogoState';

const LogoSet: React.FC = () => {
  const {
    image, settings, format, setFormat, applyScope, setApplyScope,
    customSizes, setCustomSizes, customSizesDialogOpen, setCustomSizesDialogOpen,
    croppedImages, sizeSettings, history, hasCustomChanges,
    handleImageUpload, handleUndo, handleRedo,
    handleCroppedImage, handleSizeSettings, handleSettingsChange,
    handleDelete, handleReset,
  } = useLogoState();

  const historyActions = (
    <>
      {history.imageHistory.length > 0 && (
        <>
          <Tooltip
            title={
              history.canUndo ? `Undo (${history.historyIndex}/${history.imageHistory.length - 1})` : 'Nothing to undo'
            }
          >
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={!history.canUndo}>
                <Undo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              history.canRedo ? `Redo (${history.historyIndex + 2}/${history.imageHistory.length})` : 'Nothing to redo'
            }
          >
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={!history.canRedo}>
                <Redo fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, alignSelf: 'center' }} />
        </>
      )}
    </>
  );

  return (
    <ToolLayout toolName="Logo Set" toolIcon={<AutoFixHigh />} toolColor="#6366f1" actions={historyActions}>
      <Container maxWidth="xl" sx={{ py: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <ImageUpload onImageUpload={handleImageUpload} onDelete={handleDelete} currentImage={image} />
              {image && (
                <GlobalSettings
                  settings={settings}
                  onChange={handleSettingsChange}
                  format={format}
                  onFormatChange={setFormat}
                  applyScope={applyScope}
                  onApplyScopeChange={setApplyScope}
                  customSizes={customSizes}
                  onCustomSizesChange={setCustomSizes}
                  onOpenCustomSizesDialog={() => setCustomSizesDialogOpen(true)}
                  onReset={handleReset}
                  hasCustomChanges={hasCustomChanges}
                  currentImage={image}
                />
              )}
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            {image ? (
              <PreviewGrid
                image={image}
                settings={settings}
                format={format}
                applyScope={applyScope}
                customSizes={customSizes}
                croppedImages={croppedImages}
                onCroppedImage={handleCroppedImage}
                sizeSettings={sizeSettings}
                onSizeSettings={handleSizeSettings}
              />
            ) : (
              <EmptyState />
            )}
          </Box>
        </Stack>
      </Container>
      <CustomSizesDialog
        open={customSizesDialogOpen}
        onClose={() => setCustomSizesDialogOpen(false)}
        customSizes={customSizes}
        onSave={setCustomSizes}
      />
    </ToolLayout>
  );
};

export default LogoSet;
