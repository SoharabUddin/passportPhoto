import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ResetIcon } from './Icons';

interface CropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

const CROP_ASPECT_RATIO = 3.5 / 4.5; // Indian Passport Photo
const HANDLES = ['nw', 'ne', 'sw', 'se']; // Corner handles for aspect-ratio locked resizing

export const Cropper: React.FC<CropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 / CROP_ASPECT_RATIO });
  const [interaction, setInteraction] = useState<{
    type: 'move' | 'resize';
    handle: string;
    startX: number;
    startY: number;
    startBox: typeof cropBox;
  } | null>(null);

  const initializeCropBox = useCallback(() => {
    const image = imageRef.current;
    const container = containerRef.current;
    if (!image || !container || !isImageLoaded || image.naturalWidth === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerRatio = containerRect.width / containerRect.height;
    const imgRatio = image.naturalWidth / image.naturalHeight;

    let newWidth, newHeight, newLeft = 0, newTop = 0;

    if (imgRatio > containerRatio) {
      newWidth = containerRect.width;
      newHeight = newWidth / imgRatio;
      newTop = (containerRect.height - newHeight) / 2;
    } else {
      newHeight = containerRect.height;
      newWidth = newHeight * imgRatio;
      newLeft = (containerRect.width - newWidth) / 2;
    }

    image.style.width = `${newWidth}px`;
    image.style.height = `${newHeight}px`;
    image.style.position = 'absolute';
    image.style.left = `${newLeft}px`;
    image.style.top = `${newTop}px`;

    const boxWidth = Math.min(newWidth, newHeight * CROP_ASPECT_RATIO) * 0.8;
    const boxHeight = boxWidth / CROP_ASPECT_RATIO;
    const boxX = newLeft + (newWidth - boxWidth) / 2;
    const boxY = newTop + (newHeight - boxHeight) / 2;

    setCropBox({ x: boxX, y: boxY, width: boxWidth, height: boxHeight });
  }, [isImageLoaded]);

  // Handle image loading
  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };
  
  // Initialize and re-initialize on window resize
  useEffect(() => {
    if (isImageLoaded) {
      initializeCropBox();
      window.addEventListener('resize', initializeCropBox);
      return () => window.removeEventListener('resize', initializeCropBox);
    }
  }, [isImageLoaded, initializeCropBox]);

  const drawCroppedImage = useCallback((targetCanvas: HTMLCanvasElement | null, highQuality = false) => {
    const image = imageRef.current;
    if (!image || !targetCanvas || image.naturalWidth === 0 || !image.complete) return;

    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    
    const imageStyle = window.getComputedStyle(image);
    const imageRect = {
        left: parseFloat(imageStyle.left),
        top: parseFloat(imageStyle.top),
        width: parseFloat(imageStyle.width),
        height: parseFloat(imageStyle.height),
    };

    const relativeX = cropBox.x - imageRect.left;
    const relativeY = cropBox.y - imageRect.top;

    const scaleX = image.naturalWidth / imageRect.width;
    const scaleY = image.naturalHeight / imageRect.height;

    const sourceX = relativeX * scaleX;
    const sourceY = relativeY * scaleY;
    const sourceWidth = cropBox.width * scaleX;
    const sourceHeight = cropBox.height * scaleY;
    
    if (highQuality) {
        const DPI = 300;
        targetCanvas.width = (3.5 / 2.54) * DPI;
        targetCanvas.height = (4.5 / 2.54) * DPI;
    } else {
        targetCanvas.width = 105;
        targetCanvas.height = 135;
    }

    ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetCanvas.width,
      targetCanvas.height
    );
  }, [cropBox]);

  // Update live preview whenever the crop box changes
  useEffect(() => {
    if (isImageLoaded) {
      drawCroppedImage(previewCanvasRef.current);
    }
  }, [drawCroppedImage, isImageLoaded, cropBox]);

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent, type: 'move' | 'resize', handle = '') => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setInteraction({
      type,
      handle,
      startX: clientX,
      startY: clientY,
      startBox: { ...cropBox }
    });
  };
  
  const handleInteractionMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!interaction) return;
    e.preventDefault();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - interaction.startX;
    const dy = clientY - interaction.startY;
    
    const image = imageRef.current;
    if (!image) return;

    const imageStyle = window.getComputedStyle(image);
    const imageBounds = {
      left: parseFloat(imageStyle.left),
      top: parseFloat(imageStyle.top),
      right: parseFloat(imageStyle.left) + parseFloat(imageStyle.width),
      bottom: parseFloat(imageStyle.top) + parseFloat(imageStyle.height)
    };

    if (interaction.type === 'move') {
      let newX = interaction.startBox.x + dx;
      let newY = interaction.startBox.y + dy;
      
      newX = Math.max(imageBounds.left, Math.min(newX, imageBounds.right - interaction.startBox.width));
      newY = Math.max(imageBounds.top, Math.min(newY, imageBounds.bottom - interaction.startBox.height));
      
      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (interaction.type === 'resize') {
      let { x, y, width, height } = interaction.startBox;
      const minSize = 20;

      if (interaction.handle.includes('e')) width += dx;
      if (interaction.handle.includes('w')) { width -= dx; x += dx; }
      if (interaction.handle.includes('s')) height += dy;
      if (interaction.handle.includes('n')) { height -= dy; y += dy; }

      if (interaction.handle.includes('w') || interaction.handle.includes('e')) {
        height = width / CROP_ASPECT_RATIO;
      } else {
        width = height * CROP_ASPECT_RATIO;
      }

      if (interaction.handle.includes('n')) y = interaction.startBox.y + interaction.startBox.height - height;
      if (interaction.handle.includes('w')) x = interaction.startBox.x + interaction.startBox.width - width;

      if (width > minSize && height > minSize && x >= imageBounds.left && y >= imageBounds.top && x + width <= imageBounds.right && y + height <= imageBounds.bottom) {
        setCropBox({ x, y, width, height });
      }
    }
  }, [interaction]);

  const handleInteractionEnd = useCallback(() => {
    setInteraction(null);
  }, []);
  
  useEffect(() => {
    if (interaction) {
      document.addEventListener('mousemove', handleInteractionMove);
      document.addEventListener('mouseup', handleInteractionEnd);
      document.addEventListener('touchmove', handleInteractionMove, { passive: false });
      document.addEventListener('touchend', handleInteractionEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleInteractionMove);
      document.removeEventListener('mouseup', handleInteractionEnd);
      document.removeEventListener('touchmove', handleInteractionMove);
      document.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [interaction, handleInteractionMove, handleInteractionEnd]);

  const handleCropClick = () => {
    drawCroppedImage(finalCanvasRef.current, true);
    if (finalCanvasRef.current) {
        onCrop(finalCanvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4">Crop Your Photo</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-lg">
        Drag and resize the box to select the perfect area for your photo. The aspect ratio is locked for passport requirements.
      </p>

      <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-8 mb-6">
        <div 
          ref={containerRef}
          className="relative w-full max-w-lg mx-auto bg-slate-200 dark:bg-slate-700 rounded-lg shadow-inner touch-none overflow-hidden"
          style={{ height: '450px' }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop source"
            className="select-none pointer-events-none"
            onLoad={handleImageLoad}
            style={{ display: isImageLoaded ? 'block' : 'none' }}
          />
          {isImageLoaded && (
            <div
              className="absolute border-2 border-dashed border-white cursor-move"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              }}
              onMouseDown={(e) => handleInteractionStart(e, 'move')}
              onTouchStart={(e) => handleInteractionStart(e, 'move')}
            >
              {HANDLES.map(handle => (
                <div
                  key={handle}
                  className="absolute w-4 h-4 -m-2 border-2 bg-white rounded-full"
                  style={{
                    top: handle.includes('n') ? 0 : '100%',
                    left: handle.includes('w') ? 0 : '100%',
                    cursor: `${handle}-resize`
                  }}
                  onMouseDown={(e) => handleInteractionStart(e, 'resize', handle)}
                  onTouchStart={(e) => handleInteractionStart(e, 'resize', handle)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-md font-semibold mb-2 text-slate-600 dark:text-slate-300">Live Preview</h3>
          <canvas ref={previewCanvasRef} className="rounded-lg shadow-lg bg-slate-200 dark:bg-slate-700" />
          <button onClick={initializeCropBox} className="mt-4 flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" aria-label="Reset crop">
             <ResetIcon /> Reset
          </button>
        </div>
      </div>

      <canvas ref={finalCanvasRef} style={{ display: 'none' }} />

      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCropClick}
          className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          Confirm Crop
        </button>
      </div>
    </div>
  );
};