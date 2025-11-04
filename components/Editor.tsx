import React, { useEffect } from 'react';
import { BackgroundOption, DownloadFormat } from '../types';
import Spinner from './Spinner';
import { LeftArrowIcon, CropIcon } from './Icons';

// Use a declaration to inform TypeScript about the global jsPDF object from the CDN
declare const jspdf: any;

interface EditorProps {
  imageSrc: string | null;
  onBackgroundEdit: (option: BackgroundOption) => void;
  isLoading: boolean;
  loadingMessage: string;
  onBack: () => void;
  onRecrop: () => void;
  widthCm: number;
  heightCm: number;
  copies: number;
  setWidthCm: (n: number) => void;
  setHeightCm: (n: number) => void;
  setCopies: (n: number) => void;
  a4CanvasRef: React.RefObject<HTMLCanvasElement>;
}

const DPI = 300; // Standard print quality
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MM_PER_INCH = 25.4;

export const Editor: React.FC<EditorProps> = ({
  imageSrc,
  onBackgroundEdit,
  isLoading,
  loadingMessage,
  onBack,
  onRecrop,
  widthCm,
  heightCm,
  copies,
  setWidthCm,
  setHeightCm,
  setCopies,
  a4CanvasRef
}) => {

  useEffect(() => {
    const canvas = a4CanvasRef.current;
    if (!canvas || !imageSrc) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const a4WidthPx = (A4_WIDTH_MM / MM_PER_INCH) * DPI;
      const a4HeightPx = (A4_HEIGHT_MM / MM_PER_INCH) * DPI;
      canvas.width = a4WidthPx;
      canvas.height = a4HeightPx;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const photoWidthPx = (widthCm * 10 / MM_PER_INCH) * DPI;
      const photoHeightPx = (heightCm * 10 / MM_PER_INCH) * DPI;
      const marginPx = 10;
      
      let x = marginPx;
      let y = marginPx;
      
      for (let i = 0; i < copies; i++) {
        if (y + photoHeightPx > a4HeightPx) break; 
        
        ctx.drawImage(img, x, y, photoWidthPx, photoHeightPx);

        x += photoWidthPx + marginPx;
        if (x + photoWidthPx > a4WidthPx) {
          x = marginPx;
          y += photoHeightPx + marginPx;
        }
      }
    };
    img.src = imageSrc;

  }, [imageSrc, widthCm, heightCm, copies, a4CanvasRef]);
  
  const handleDownload = (format: DownloadFormat) => {
    const canvas = a4CanvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `passport_photos.${format}`;

    if (format === 'pdf') {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
        pdf.save('passport_photos.pdf');
    } else {
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
    }
  };


  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
        <LeftArrowIcon />
        Start Over
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">AI Background</h3>
            <div className="flex gap-2">
              <button onClick={() => onBackgroundEdit('white')} disabled={isLoading} className="w-full p-2 text-sm font-medium border-2 border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full bg-gray-200 border"></span> White
              </button>
              <button onClick={() => onBackgroundEdit('blue')} disabled={isLoading} className="w-full p-2 text-sm font-medium border-2 border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full bg-blue-200 border"></span> Light Blue
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Adjust Crop</h3>
            <button
              onClick={onRecrop}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CropIcon />
              Re-crop Image
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Custom Size</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="width" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Width (cm)</label>
                <input type="number" id="width" value={widthCm} onChange={(e) => setWidthCm(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-700"/>
              </div>
              <div className="flex-1">
                <label htmlFor="height" className="block text-sm font-medium text-slate-600 dark:text-slate-300">Height (cm)</label>
                <input type="number" id="height" value={heightCm} onChange={(e) => setHeightCm(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white dark:bg-slate-700"/>
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-lg font-semibold mb-3">Copies on A4</h3>
             <div className="flex items-center gap-4">
               <input type="range" min="1" max="30" value={copies} onChange={(e) => setCopies(Number(e.target.value))} className="w-full"/>
               <span className="font-bold text-indigo-600 dark:text-indigo-400 w-8 text-center">{copies}</span>
             </div>
          </div>
          
          <div>
             <h3 className="text-lg font-semibold mb-3">Download</h3>
             <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => handleDownload('pdf')} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-2">PDF</button>
                <button onClick={() => handleDownload('png')} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-2">PNG</button>
                <button onClick={() => handleDownload('jpeg')} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">JPEG</button>
             </div>
          </div>

        </div>

        {/* Image Preview */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
             <div>
                <h3 className="text-lg font-semibold mb-2">A4 Print Preview</h3>
                <div className="bg-slate-200 dark:bg-slate-700 p-4 rounded-lg shadow-inner">
                    <canvas ref={a4CanvasRef} className="w-full h-auto rounded-md shadow-lg" />
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2">Single Photo Preview</h3>
                <div className="relative w-40 h-auto bg-slate-200 dark:bg-slate-700 p-2 rounded-lg shadow-inner">
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white rounded-lg z-10">
                      <Spinner />
                      <p className="text-sm mt-2 text-center">{loadingMessage}</p>
                    </div>
                  )}
                  {imageSrc && <img src={imageSrc} alt="Final passport photo" className="w-full h-auto rounded-md shadow" />}
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
