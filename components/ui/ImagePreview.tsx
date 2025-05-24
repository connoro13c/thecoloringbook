'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Download, Eye, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  imageUrl?: string;
  pdfUrl?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function ImagePreview({
  imageUrl,
  pdfUrl,
  onRegenerate,
  isRegenerating = false,
}: ImagePreviewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!imageUrl) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl border-2 border-dashed border-primary/30 p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl animate-bounce-gentle">🎨</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Your masterpiece is coming!
          </h3>
          <p className="text-gray-600">
            Your amazing coloring page will appear here in just a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-3xl border-2 border-primary/10 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-2xl">🎉</span>
              <h3 className="text-2xl font-bold text-gray-900">
                Ta-da! Your Coloring Page
              </h3>
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-gray-600">
              Ready to print and color!
            </p>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative bg-white">
          <div className="aspect-square relative bg-gray-100">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading preview...</div>
              </div>
            )}
            <Image
              src={imageUrl}
              alt="Generated coloring page preview"
              fill
              className={`object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            )}
            
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Full Size
              </a>
            )}
          </div>

          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              disabled={isRegenerating}
              variant="outline"
              className="w-full"
            >
              {isRegenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerate ($0.50)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="relative bg-white rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt="Generated coloring page - full size"
                width={800}
                height={800}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}