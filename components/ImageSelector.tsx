import React, { useRef } from 'react';
import { CameraIcon, UploadIcon } from './Icons';

interface ImageSelectorProps {
  onImageSelect: (file: File) => void;
}

export const ImageSelector: React.FC<ImageSelectorProps> = ({ onImageSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
      <h2 className="text-2xl font-bold mb-2 text-slate-700 dark:text-slate-200">Start Your Passport Photo</h2>
      <p className="mb-6 text-slate-500 dark:text-slate-400">Choose a high-quality, well-lit photo for the best results.</p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
        >
          <UploadIcon />
          Upload Photo
        </button>

        <input
          type="file"
          accept="image/*"
          capture="user"
          ref={cameraInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-slate-300 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
        >
          <CameraIcon />
          Take Photo
        </button>
      </div>
       <div className="mt-8 text-sm text-slate-500 dark:text-slate-400 max-w-md">
        <h3 className="font-semibold mb-2">Photo Tips:</h3>
        <ul className="list-disc list-inside text-left space-y-1">
          <li>Face the camera directly with a neutral expression.</li>
          <li>Ensure your full face is visible, from top of hair to bottom of chin.</li>
          <li>Use a plain, light-colored background if possible.</li>
          <li>Avoid shadows on your face or in the background.</li>
        </ul>
      </div>
    </div>
  );
};
