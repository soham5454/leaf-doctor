import { useEffect, useState } from 'react';
import { predictDisease } from './api.js';
import ImageUploader from './components/ImageUploader.jsx';
import ResultCard from './components/ResultCard.jsx';

export default function App() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'result' | 'error'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setErrorMessage('');
    setStatus('idle');
  };

  const handleDiagnose = async (file) => {
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setResult(null);
    setErrorMessage('');
    setStatus('loading');

    try {
      const data = await predictDisease(file);
      setResult(data);
      setStatus('result');
    } catch (error) {
      setErrorMessage(
        error?.message || 'Something went wrong. Please try again.'
      );
      setStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6 sm:py-10 flex flex-col items-center justify-center text-[18px] text-slate-800">
      <div className="w-full max-w-[560px] mx-auto space-y-6">
        <header className="text-center space-y-2 px-1">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Leaf Doctor
          </h1>
          <p className="text-[18px] sm:text-xl text-slate-700 leading-relaxed">
            Take a photo of a tomato leaf to check its health.
          </p>
        </header>

        {status === 'idle' && <ImageUploader onDiagnose={handleDiagnose} />}

        {previewUrl && (status === 'loading' || status === 'result') && (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <img
              src={previewUrl}
              alt={
                selectedFile
                  ? `Uploaded leaf: ${selectedFile.name}`
                  : 'Uploaded leaf preview'
              }
              className="w-full max-h-80 object-contain rounded-xl bg-slate-100 mx-auto"
            />
          </div>
        )}

        {status === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            className="w-full rounded-2xl border border-slate-200 bg-white p-7 sm:p-8 shadow-sm flex flex-col items-center justify-center gap-5 text-center"
          >
            <div
              className="h-16 w-16 rounded-full border-[5px] border-emerald-200 border-t-emerald-600 animate-spin"
              aria-hidden="true"
            />
            <p className="text-2xl font-semibold text-slate-900">
              Analysing your leaf...
            </p>
          </div>
        )}

        {status === 'result' && (
          <ResultCard result={result} onReset={handleReset} />
        )}

        {status === 'error' && (
          <div className="w-full space-y-4">
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6 text-center text-[18px] text-red-900 shadow-sm leading-relaxed"
            >
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="w-full min-h-[56px] rounded-xl bg-emerald-600 px-6 py-4 text-xl font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
