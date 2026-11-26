import { useEffect, useRef, useState } from 'react';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

/**
 * Mobile-friendly image upload component supporting click-to-browse,
 * mobile camera capture, drag-and-drop, validation, and preview.
 */
export default function ImageUploader({ onDiagnose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Please pick a JPG or PNG photo.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('That photo is over 5 MB. Please choose a smaller one.');
      return;
    }

    setError('');
    setSelectedFile(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    validateAndSetFile(file);
    // Reset input value so re-selecting the same file still triggers onChange
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleDropZoneKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleBrowseClick();
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError('');
  };

  const handleDiagnoseClick = () => {
    if (selectedFile) {
      onDiagnose?.(selectedFile);
    }
  };

  return (
    <div className="w-full max-w-[560px] mx-auto">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload leaf photo"
      />

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onClick={handleBrowseClick}
          onKeyDown={handleDropZoneKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed p-6 sm:p-10 min-h-64 cursor-pointer transition-colors select-none focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 ${
            isDragging
              ? 'border-emerald-600 bg-emerald-50'
              : 'border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50/40'
          }`}
        >
          <svg
            className="w-14 h-14 text-emerald-700 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-xl font-semibold text-slate-900">
            Add a leaf photo
          </p>
          <p className="mt-2 text-lg text-slate-700">
            Tap here to take a photo or choose one from your device
          </p>
          <p className="mt-3 text-base text-slate-500">
            Works with JPG or PNG photos up to 5 MB
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Preview of ${selectedFile.name}`}
                className="w-full max-h-80 object-contain mx-auto"
              />
            )}
          </div>

          <p className="mt-4 text-lg font-medium text-slate-700 truncate">
            {selectedFile.name}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDiagnoseClick}
              className="w-full min-h-[56px] rounded-xl bg-emerald-600 px-6 py-4 text-xl font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 cursor-pointer"
            >
              Diagnose
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="w-full min-h-[56px] rounded-xl border border-slate-300 bg-white px-6 py-3 text-lg font-semibold text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 cursor-pointer"
            >
              Choose a different photo
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-lg text-red-800 text-center"
        >
          {error}
        </p>
      )}
    </div>
  );
}
