'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@/lib/auth';
import { User } from '@supabase/supabase-js';
import PhotoUpload from '@/components/forms/PhotoUpload';
import ScenePrompt from '@/components/forms/ScenePrompt';
import StylePicker, { type StyleType } from '@/components/forms/StylePicker';
import DifficultySlider from '@/components/forms/DifficultySlider';
import EditableAnalysis from '@/components/forms/EditableAnalysis';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { type ChildAttributes } from '@/lib/prompt-builder';

interface UploadResult {
  url: string;
  filename: string;
}

export default function UploadPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-playful flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center animate-pulse">
          <span className="text-2xl">🎨</span>
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-playful flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
        <p className="text-gray-600">You need to be authenticated to create coloring pages.</p>
      </div>
    </div>;
  }
  
  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [imageAnalysis, setImageAnalysis] = useState<ChildAttributes | null>(null);

  // Job parameters
  const [scenePrompt, setScenePrompt] = useState<string>('');
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [style, setStyle] = useState<StyleType>('classic');
  const [difficulty, setDifficulty] = useState<number>(3);

  // Generation state
  const [generatedImage, setGeneratedImage] = useState<{
    jobId: string;
    imageUrl: string;
    imageAnalysis?: string;
    status: 'completed' | 'processing' | 'failed';
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadError('');
    setImageAnalysis(null); // Clear previous analysis

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
      
      // Get image analysis for the first uploaded file
      if (result.files && result.files.length > 0) {
        try {
          const analysisResponse = await fetch('/api/v1/analyze-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageUrl: result.files[0].url
            }),
          });
          
          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json();
            setImageAnalysis(analysisResult.attributes || null);
          }
        } catch (error) {
          console.error('Failed to analyze image:', error);
          // Continue without analysis - it's not critical
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (uploadResults.length === 0) return;

    setIsGenerating(true);
    setUploadError('');

    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputUrl: uploadResults[0].url, // Use first uploaded image
          prompt: scenePrompt.trim() || 'Turn this photo into a coloring book page',
          refinementPrompt: refinementPrompt.trim() || undefined,
          style,
          difficulty,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate coloring page');
      }

      setGeneratedImage({
        jobId: result.pageId || 'temp',
        imageUrl: result.imageUrl,
        imageAnalysis: result.imageAnalysis,
        status: 'completed',
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to generate coloring page');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (uploadResults.length === 0) return;
    
    // Reset generated image and create new one
    setGeneratedImage(null);
    await handleGenerate();
  };

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
                Hey {user?.user_metadata?.first_name || user?.email?.split('@')[0]}! 👋
              </span>
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="rounded-full">
                  My Creations
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
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
                  disabled={uploading || isGenerating}
                />

                {selectedFiles.length > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading || isGenerating}
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
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Step 3: Style Selection */}
                  <div className="mt-6 space-y-4">
                    <StylePicker
                      value={style}
                      onChange={setStyle}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Step 4: Difficulty */}
                  <div className="mt-6 space-y-4">
                    <DifficultySlider
                      value={difficulty}
                      onChange={setDifficulty}
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Generate Button */}
                  {!generatedImage && (
                    <div className="mt-8 pt-6 border-t">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-3 text-lg"
                        size="lg"
                      >
                        {isGenerating ? 'Creating Your Coloring Page...' : 'Generate Coloring Page'}
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



              {/* Upload Success */}
              {uploadResults.length > 0 && !generatedImage && (
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
                  {imageAnalysis && (
                    <EditableAnalysis
                      analysis={imageAnalysis}
                      onUpdate={setImageAnalysis}
                    />
                  )}
                  <p className="text-sm text-green-600 mt-2">
                    Now configure your coloring page settings and click &quot;Generate&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            {/* Generated Image Preview */}
            {generatedImage && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Your Coloring Page
                </h3>
                <div className="relative">
                  <img
                    src={generatedImage.imageUrl}
                    alt="Generated coloring page"
                    className="w-full rounded-lg border"
                  />
                </div>
                {generatedImage.imageAnalysis && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      What our AI saw in your photo:
                    </h4>
                    <p className="text-sm text-blue-800">{generatedImage.imageAnalysis}</p>
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refinement Instructions (Optional)
                    </label>
                    <textarea
                      value={refinementPrompt}
                      onChange={(e) => setRefinementPrompt(e.target.value)}
                      placeholder="Tell us what to change: 'Remove background', 'Make lines thicker', 'Add more detail to the face', etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      maxLength={300}
                    />
                    <p className="text-xs text-gray-500 mt-1">{refinementPrompt.length}/300 characters</p>
                  </div>
                  <div className="flex gap-2">
                  <Button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1"
                  >
                    {isGenerating ? 'Generating...' : 'Regenerate'}
                  </Button>
                  <Button className="flex-1">
                    Download PDF ($0.99)
                  </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholder when no image */}
            {!generatedImage && (
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