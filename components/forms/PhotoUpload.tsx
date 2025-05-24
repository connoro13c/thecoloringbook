'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { validateFiles } from '@/lib/validation';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onFilesSelect: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export default function PhotoUpload({
  onFilesSelect,
  maxFiles = 3,
  disabled = false,
}: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');

  const handleFilesUpdate = useCallback((newFiles: File[]) => {
    setSelectedFiles(newFiles);
    onFilesSelect(newFiles);
    setError('');
  }, [onFilesSelect]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError('');
      
      const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
      const validation = validateFiles(newFiles);
      
      if (!validation.isValid) {
        setError(validation.error || 'Invalid files');
        return;
      }

      handleFilesUpdate(newFiles);
    },
    [selectedFiles, maxFiles, handleFilesUpdate]
  );

  const removeFile = useCallback(
    (indexToRemove: number) => {
      const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
      handleFilesUpdate(newFiles);
    },
    [selectedFiles, handleFilesUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
    },
    maxFiles: maxFiles - selectedFiles.length,
    disabled,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 touch-target
          ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5 hover:scale-102'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="relative">
          <div className={`mx-auto w-20 h-20 rounded-2xl mb-6 flex items-center justify-center ${isDragActive ? 'bg-primary/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'} transition-all duration-300`}>
            {isDragActive ? (
              <span className="text-4xl animate-bounce">📸</span>
            ) : (
              <Upload className={`h-10 w-10 ${isDragActive ? 'text-primary' : 'text-gray-500'} transition-colors`} />
            )}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isDragActive ? '✨ Drop your photos here!' : '📷 Drop your photos here or click to upload'}
        </h3>
        <p className="text-gray-600 mb-2">
          {selectedFiles.length === 0 
            ? `Upload up to ${maxFiles} photos of your little ones`
            : `Add ${maxFiles - selectedFiles.length} more photo${maxFiles - selectedFiles.length !== 1 ? 's' : ''}`
          }
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
          <span>JPG or PNG</span>
          <span>•</span>
          <span>Max 10MB each</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✅</span>
            <h4 className="text-lg font-bold text-gray-900">
              Your Photos ({selectedFiles.length}/{maxFiles})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative bg-white rounded-2xl p-4 border-2 border-gray-100 hover:border-primary/20 transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-2 flex-shrink-0">
                    <ImageIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full touch-target"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}