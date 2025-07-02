'use client'

import { useCallback, useState } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { UploadIcon, ImageIcon } from '@/components/ui/icons/WatercolorIcons'

interface PhotoUploadProps {
  onPhotoSelect: (file: File | null) => void
  selectedPhoto: File | null
}

export function PhotoUpload({ onPhotoSelect, selectedPhoto }: PhotoUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setError(null)
    
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors?.[0]?.code === 'file-too-large') {
        setError('File is too large. Please choose an image under 10MB.')
      } else if (rejection.errors?.[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a JPG or PNG image.')
      } else {
        setError('Please upload a valid image file.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      onPhotoSelect(acceptedFiles[0])
    }
  }, [onPhotoSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const removePhoto = () => {
    onPhotoSelect(null)
    setError(null)
  }

  if (selectedPhoto) {
    return (
      <Card className="p-6 bg-neutral-ivory border-2 border-dashed border-accent-aqua/50">
        <div className="text-center">
          <h2 className="font-playfair text-2xl font-bold text-neutral-slate mb-4">
            Photo selected
          </h2>
          
          <div className="relative inline-block">
            <Image
              src={URL.createObjectURL(selectedPhoto)}
              alt="Selected photo"
              width={400}
              height={200}
              className="max-w-xs max-h-48 rounded-lg shadow-md object-cover"
            />
            <Button
              onClick={removePhoto}
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-sm text-neutral-slate/70 mt-4">
            {selectedPhoto.name} ({(selectedPhoto.size / 1024 / 1024).toFixed(1)}MB)
          </p>
          
          <Button
            onClick={removePhoto}
            variant="outline"
            className="mt-4"
          >
            Choose different photo
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 bg-neutral-ivory border-2 border-dashed border-accent-aqua/50 hover:border-accent-aqua transition-colors">
      <div className="text-center">
        <h2 className="font-playfair text-3xl font-bold text-neutral-slate mb-6">
          Upload your child&apos;s photo
        </h2>
        
        <p className="text-lg text-neutral-slate/80 mb-8 max-w-md mx-auto">
          Choose a clear, well-lit photo for best results.
        </p>

        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-300
            ${isDragActive 
              ? 'border-primary-indigo bg-primary-indigo/5 scale-105' 
              : 'border-accent-aqua/60 hover:border-primary-indigo hover:bg-accent-aqua/5'
            }
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center space-y-4">
            {isDragActive ? (
              <div className="p-4 bg-primary-indigo/10 rounded-full">
                <UploadIcon className="w-8 h-8 text-primary-indigo" />
              </div>
            ) : (
              <div className="p-4 bg-accent-aqua/20 rounded-full">
                <ImageIcon className="w-8 h-8 text-accent-aqua" />
              </div>
            )}
            
            <div>
              <p className="text-lg font-medium text-neutral-slate mb-2">
                {isDragActive ? 'Drop your photo here' : 'Drag & drop your photo here'}
              </p>
              <p className="text-sm text-neutral-slate/60 mb-4">
                or click to browse files
              </p>
              <Button 
                type="button"
                className="bg-primary-indigo hover:bg-primary-indigo/90 text-white"
              >
                Choose photo
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-6 text-xs text-neutral-slate/50">
          Supported formats: JPG, PNG • Maximum size: 10MB
        </div>
      </div>
    </Card>
  )
}
