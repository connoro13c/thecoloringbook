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
  maxFiles = 1,
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
        
        {selectedFiles.length > 0 ? (
          // Show uploaded photo
          <div className="relative">
            <div className="mx-auto mb-6 max-w-sm">
              <img
                src={URL.createObjectURL(selectedFiles[0])}
                alt="Preview of uploaded content"
                className="w-full h-auto max-h-64 object-contain rounded-2xl shadow-lg"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(0);
                }}
                className="absolute -top-2 -right-2 h-8 w-8 p-0 text-white bg-red-500 hover:bg-red-600 rounded-full shadow-lg"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ✅ Photo uploaded successfully!
            </h3>
            <p className="text-gray-600 mb-2">
              {selectedFiles[0].name} • {(selectedFiles[0].size / 1024 / 1024).toFixed(1)} MB
            </p>
            <p className="text-sm text-gray-500">
              Click to replace or drag a new photo
            </p>
          </div>
        ) : (
          // Show upload area
          <div className="relative">
            <div className={`mx-auto w-20 h-20 rounded-2xl mb-6 flex items-center justify-center ${isDragActive ? 'bg-primary/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'} transition-all duration-300`}>
              {isDragActive ? (
                <span className="text-4xl animate-bounce">📸</span>
              ) : (
                <Upload className={`h-10 w-10 ${isDragActive ? 'text-primary' : 'text-gray-500'} transition-colors`} />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {isDragActive ? '✨ Drop your photo here!' : '📷 Drop your photo here or click to upload'}
            </h3>
            <p className="text-gray-600 mb-2">
              Upload a photo of your little one
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
              <span>JPG or PNG</span>
              <span>•</span>
              <span>Max 10MB each</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}