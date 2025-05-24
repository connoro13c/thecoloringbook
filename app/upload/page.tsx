'use client';

import { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/nextjs';
import PhotoUpload from '@/components/forms/PhotoUpload';
import ScenePrompt from '@/components/forms/ScenePrompt';
import StylePicker, { type StyleType } from '@/components/forms/StylePicker';
import DifficultySlider from '@/components/forms/DifficultySlider';
import JobProgress from '@/components/ui/JobProgress';
import ImagePreview from '@/components/ui/ImagePreview';
import { PaymentFlow } from '@/components/forms/PaymentFlow';
import { Button } from '@/components/ui/button';
import { useJobPolling } from '@/lib/hooks/useJobPolling';
import Link from 'next/link';

interface UploadResult {
  url: string;
  filename: string;
}

export default function UploadPage() {
  const { user } = useUser() || { user: null };
  
  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  // Job parameters
  const [scenePrompt, setScenePrompt] = useState<string>('');
  const [style, setStyle] = useState<StyleType>('classic');
  const [difficulty, setDifficulty] = useState<number>(3);

  // Job state
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Job polling
  const { job, error: jobError } = useJobPolling({
    jobId: currentJobId,
    onComplete: (completedJob) => {
      console.log('Job completed:', completedJob);
    },
    onError: (error) => {
      console.error('Job error:', error);
    },
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadResults(result.files);
      setSelectedFiles([]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateJob = async () => {
    if (uploadResults.length === 0) return;

    setIsCreatingJob(true);
    setUploadError('');

    try {
      const response = await fetch('/api/v1/createJob', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls: uploadResults.map(result => result.url),
          scenePrompt: scenePrompt.trim() || undefined,
          style,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create job');
      }

      setCurrentJobId(result.jobId);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleRegenerate = async () => {
    if (uploadResults.length === 0) return;
    
    // Reset current job and create new one
    setCurrentJobId(null);
    await handleCreateJob();
  };

  const isProcessing = isCreatingJob || Boolean(job && job.status !== 'completed' && job.status !== 'failed');

  return (
    <div className="min-h-screen bg-gradient-playful">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🎨</span>
              <h1 className="text-xl font-bold text-gray-900">
                Coloring Magic
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 font-medium">
                Hey {user?.firstName}! 👋
              </span>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="rounded-full">
                  My Creations
                </Button>
              </Link>
              <SignOutButton>
                <Button variant="outline" size="sm" className="rounded-full">
                  Sign Out
                </Button>
              </SignOutButton>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Configuration */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-3 mb-4">
                  <span className="text-3xl animate-bounce-gentle">✨</span>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Create Your Magic
                  </h2>
                  <span className="text-3xl animate-bounce-gentle">🎨</span>
                </div>
                <p className="text-gray-600">
                  Let&apos;s turn your photos into amazing coloring pages!
                </p>
              </div>
              
              {/* Step 1: Photo Upload */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full">
                    1
                  </span>
                  <h3 className="text-lg font-medium text-gray-900">Upload Photos</h3>
                </div>
                
                <PhotoUpload
                  onFilesSelect={setSelectedFiles}
                  disabled={uploading || isProcessing}
                />

                {selectedFiles.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || isProcessing}
                      className="px-8"
                    >
                      {uploading ? 'Uploading...' : 'Upload Photos'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Configuration Section */}
              {uploadResults.length > 0 && (
                <>
                  {/* Step 2: Scene Prompt */}
                  <div className="mt-8 pt-6 border-t space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-medium rounded-full">
                        2
                      </span>
                      <h3 className="text-lg font-medium text-gray-900">Customize Your Page</h3>
                    </div>
                    
                    <ScenePrompt
                      value={scenePrompt}
                      onChange={setScenePrompt}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Step 3: Style Selection */}
                  <div className="mt-6 space-y-4">
                    <StylePicker
                      value={style}
                      onChange={setStyle}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Step 4: Difficulty */}
                  <div className="mt-6 space-y-4">
                    <DifficultySlider
                      value={difficulty}
                      onChange={setDifficulty}
                      disabled={isProcessing}
                    />
                  </div>

                  {/* Generate Button */}
                  {!currentJobId && (
                    <div className="mt-8 pt-6 border-t">
                      <Button
                        onClick={handleCreateJob}
                        disabled={isCreatingJob || isProcessing}
                        className="w-full py-3 text-lg"
                        size="lg"
                      >
                        {isCreatingJob ? 'Creating Your Coloring Page...' : 'Generate Coloring Page'}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Error Display */}
              {uploadError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              {jobError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{jobError}</p>
                </div>
              )}

              {/* Upload Success */}
              {uploadResults.length > 0 && !currentJobId && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-medium text-green-800 mb-2">
                    Photos Uploaded Successfully!
                  </h3>
                  <div className="space-y-2">
                    {uploadResults.map((result, index) => (
                      <div key={index} className="text-sm text-green-600">
                        ✓ {result.filename}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Now configure your coloring page settings and click &quot;Generate&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Progress and Preview */}
          <div className="space-y-6">
            {/* Job Progress */}
            {job && (
              <JobProgress
                job={job}
                onRetry={handleRegenerate}
              />
            )}

            {/* Image Preview */}
            {job && (job.status === 'completed' || job.imageUrl) && (
              <ImagePreview
                imageUrl={job.imageUrl}
                pdfUrl={job.pdfUrl}
                onRegenerate={handleRegenerate}
                isRegenerating={isCreatingJob}
              />
            )}

            {/* Payment Flow */}
            {job && job.status === 'completed' && (
              <PaymentFlow
                jobId={job.jobId}
                jobStatus={job.status}
                onPaymentSuccess={() => {
                  // Handle payment success - refresh page or trigger download
                  window.location.reload();
                }}
              />
            )}

            {/* Placeholder when no job */}
            {!job && (
              <div className="bg-white rounded-lg border p-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to Create Magic?
                  </h3>
                  <p className="text-gray-500">
                    Upload your photos and configure your preferences to generate a custom coloring page.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}