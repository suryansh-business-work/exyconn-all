import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Paper, Typography, Box, Button } from '@mui/material';
import { Crop as CropIcon, Check, Close } from '@mui/icons-material';
import AspectRatioControls from './AspectRatioControls';
import TransformControls from './TransformControls';
import ZoomControl from './ZoomControl';

interface Props {
  image: string;
  onSave: (croppedImage: string) => void;
  onClose: () => void;
  targetSize: { width: number; height: number };
}

type AspectOption = 'free' | 'square' | 'target' | '16:9' | '4:3' | '3:2';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    if (!url.startsWith('data:')) {
      image.crossOrigin = 'anonymous';
    }
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  targetWidth: number,
  targetHeight: number,
  rotation: number = 0,
  flipH: boolean = false,
  flipV: boolean = false
): Promise<string | null> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.translate(targetWidth / 2, targetHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.translate(-targetWidth / 2, -targetHeight / 2);
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/png');
};

const CropTool: React.FC<Props> = ({ image, onSave, onClose, targetSize }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectOption, setAspectOption] = useState<AspectOption>('target');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getAspectRatio = (): number | undefined => {
    switch (aspectOption) {
      case 'free':
        return undefined;
      case 'square':
        return 1;
      case 'target':
        return targetSize.width / targetSize.height;
      case '16:9':
        return 16 / 9;
      case '4:3':
        return 4 / 3;
      case '3:2':
        return 3 / 2;
      default:
        return targetSize.width / targetSize.height;
    }
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const croppedImage = await getCroppedImg(
        image,
        croppedAreaPixels,
        targetSize.width,
        targetSize.height,
        rotation,
        flipH,
        flipV
      );
      if (croppedImage) onSave(croppedImage);
    } catch (e) {
      console.error('Error creating cropped image:', e);
    } finally {
      setIsSaving(false);
    }
  }, [croppedAreaPixels, image, targetSize, rotation, flipH, flipV, onSave]);

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  return (
    <Paper
      elevation={3}
      sx={{ width: 550, p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={600}>
            Crop {targetSize.width}×{targetSize.height}
          </Typography>
        </Box>
        <Button size="small" onClick={handleReset} sx={{ fontSize: '0.7rem' }}>
          Reset
        </Button>
      </Box>

      <AspectRatioControls aspectOption={aspectOption} targetSize={targetSize} onChange={setAspectOption} />

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 320,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          mb: 1.5,
          bgcolor: '#333',
        }}
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={getAspectRatio()}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{ containerStyle: { transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` } }}
        />
      </Box>

      <TransformControls
        rotation={rotation}
        flipH={flipH}
        flipV={flipV}
        onRotateLeft={() => setRotation((prev) => (prev - 90 + 360) % 360)}
        onRotateRight={() => setRotation((prev) => (prev + 90) % 360)}
        onFlipH={() => setFlipH((prev) => !prev)}
        onFlipV={() => setFlipV((prev) => !prev)}
      />

      <ZoomControl zoom={zoom} onZoomChange={setZoom} />

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <Button variant="outlined" size="small" startIcon={<Close />} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<Check />}
          onClick={handleSave}
          disabled={!croppedAreaPixels || isSaving}
        >
          {isSaving ? 'Applying...' : 'Apply Crop'}
        </Button>
      </Box>
    </Paper>
  );
};

export default CropTool;
