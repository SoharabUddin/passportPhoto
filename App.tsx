import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { ImageSelector } from './components/ImageSelector';
import { Cropper } from './components/Cropper';
import { Editor } from './components/Editor';
import { editImageBackground } from './services/geminiService';
import { fileToDataUrl } from './utils/imageUtils';
import { AppState, BackgroundOption, DownloadFormat } from './types';
import { Header } from './components/Header';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('selecting');
  const [originalImage, setOriginalImage] = useState<{ url: string; file: File } | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [widthCm, setWidthCm] = useState(3.5);
  const [heightCm, setHeightCm] = useState(4.5);
  const [copies, setCopies] = useState(8);

  const a4CanvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageSelect = useCallback(async (file: File) => {
    setError(null);
    try {
      const url = await fileToDataUrl(file);
      setOriginalImage({ url, file });
      setAppState('cropping');
    } catch (err) {
      setError('Failed to read the image file. Please try another one.');
      console.error(err);
    }
  }, []);

  const handleCrop = useCallback((image: string) => {
    setCroppedImage(image);
    setFinalImage(image);
    setAppState('editing');
  }, []);

  const handleBack = useCallback(() => {
    setCroppedImage(null);
    setFinalImage(null);
    setOriginalImage(null);
    setError(null);
    setAppState('selecting');
  }, []);
  
  const handleRecrop = useCallback(() => {
    setFinalImage(croppedImage); // Reset any AI edits and use the last known good crop
    setAppState('cropping');
  }, [croppedImage]);

  const handleBackgroundEdit = useCallback(async (option: BackgroundOption) => {
    if (!croppedImage || !originalImage) return;

    setError(null);
    setIsLoading(true);

    const prompts = {
      white: 'Change the background to a solid, plain, uniform off-white color suitable for a passport photo.',
      blue: 'Change the background to a solid, plain, uniform light blue color suitable for a passport photo.',
    };

    setLoadingMessage(`Applying ${option} background...`);

    try {
      const newImage = await editImageBackground(
        croppedImage.split(',')[1],
        originalImage.file.type,
        prompts[option]
      );
      setFinalImage(`data:image/png;base64,${newImage}`);
    // FIX: Added curly braces to the catch block to fix syntax error.
    } catch (err) {
      console.error(err);
      setError('Failed to edit background. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [croppedImage, originalImage]);

  const renderContent = () => {
    switch (appState) {
      case 'selecting':
        return <ImageSelector onImageSelect={handleImageSelect} />;
      case 'cropping':
        if (originalImage) {
          return <Cropper imageSrc={originalImage.url} onCrop={handleCrop} onCancel={handleBack} />;
        }
        return null;
      case 'editing':
        return (
          <Editor
            imageSrc={finalImage}
            onBackgroundEdit={handleBackgroundEdit}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            onBack={handleBack}
            onRecrop={handleRecrop}
            widthCm={widthCm}
            heightCm={heightCm}
            copies={copies}
            setWidthCm={setWidthCm}
            setHeightCm={setHeightCm}
            setCopies={setCopies}
            a4CanvasRef={a4CanvasRef}
          />
        );
      default:
        return <ImageSelector onImageSelect={handleImageSelect} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 sm:p-6 md:p-8 transition-all duration-300">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 dark:text-slate-400 text-sm">
        <p>Powered by Gemini. Created for demonstration purposes.</p>
      </footer>
    </div>
  );
};

export default App;
