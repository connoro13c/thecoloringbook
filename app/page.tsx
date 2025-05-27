'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import PhotoUpload from '@/components/forms/PhotoUpload'
import ScenePrompt from '@/components/forms/ScenePrompt'
import StylePicker, { type StyleType } from '@/components/forms/StylePicker'
import DifficultySlider from '@/components/forms/DifficultySlider'
import OrientationPicker from '@/components/forms/OrientationPicker'
import EditableAnalysis from '@/components/forms/EditableAnalysis'
import { type ChildAttributes } from '@/lib/prompt-builder'

interface UploadResult {
  url: string;
  filename: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Upload state for anonymous users
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [uploadError, setUploadError] = useState<string>('')
  const [imageAnalysis, setImageAnalysis] = useState<ChildAttributes | null>(null)

  // Job parameters
  const [scenePrompt, setScenePrompt] = useState<string>('')
  const [style, setStyle] = useState<StyleType>('classic')
  const [difficulty, setDifficulty] = useState<number>(3)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Generation state
  const [generatedImage, setGeneratedImage] = useState<{
    jobId: string;
    imageUrl: string;
    status: 'completed' | 'processing' | 'failed';
    sessionId?: string;
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)


  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])



  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadError('')
    setImageAnalysis(null) // Clear previous analysis

    try {
      const formData = new FormData()
      for (const file of selectedFiles) {
        formData.append('files', file)
      }

      const response = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadResults(result.files)
      setSelectedFiles([])
      
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
          })
          
          if (analysisResponse.ok) {
            const analysisResult = await analysisResponse.json()
            setImageAnalysis(analysisResult.attributes || null)
          }
        } catch (error) {
          console.error('Failed to analyze image:', error)
          // Continue without analysis - it's not critical
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (uploadResults.length === 0) return

    setIsGenerating(true)
    setUploadError('')

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
          orientation,
          anonymous: !user, // Flag for anonymous generation
          imageAnalysis, // Pass the current (possibly edited) analysis
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate coloring page')
      }

      setGeneratedImage({
        jobId: result.jobId,
        imageUrl: result.imageUrl,
        status: 'completed',
        sessionId: result.sessionId,
      })


    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to generate coloring page')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    if (uploadResults.length === 0) return
    
    setGeneratedImage(null)
    await handleGenerate()
  }

  const downloadImage = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `coloring-page-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setUploadError('Failed to download image')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 pt-8 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            🎨 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Turn any photo into a coloring-book adventure
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Let your imagination run wild — from space explorations with dinosaurs to underwater tea parties with mermaids. Turn everyday pictures into fun coloring pages.
          </p>
          
          {loading ? (
            <div className="space-y-4">
              <div className="animate-pulse">
                <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-4" />
                <div className="h-12 w-64 bg-gray-200 rounded mx-auto" />
              </div>
            </div>
          ) : user ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0]}! 👋</p>
              <div className="flex gap-4 justify-center">
                <Link href="/upload">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    ✨ Create New Coloring Page
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" size="lg">
                    📚 My Creations
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/auth">
                  <Button variant="outline" size="lg">
                    🔐 Sign In for More Features
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Upload Interface for Anonymous Users */}
        {!user && (
          <div className="max-w-4xl mx-auto mb-16">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Let’s Create
                </h2>
                <p className="text-gray-600">
                  Upload your photos and create amazing coloring pages instantly!
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left Column - Upload and Settings */}
                <div className="space-y-6">
                  {/* Photo Upload */}
                  <div className="space-y-4">
                    
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
                      <div className="pt-6 border-t space-y-4">

                        
                        <ScenePrompt
                          value={scenePrompt}
                          onChange={setScenePrompt}
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Step 3: Style Selection */}
                      <div className="space-y-4">
                        <StylePicker
                          value={style}
                          onChange={setStyle}
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Step 4: Difficulty */}
                      <div className="space-y-4">
                        <DifficultySlider
                          value={difficulty}
                          onChange={setDifficulty}
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Step 5: Orientation */}
                      <div className="space-y-4">
                        <OrientationPicker
                          value={orientation}
                          onChange={setOrientation}
                          disabled={isGenerating}
                        />
                      </div>

                      {/* Generate Button */}
                      {!generatedImage && (
                        <div className="pt-6 border-t">
                          <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            size="lg"
                          >
                            {isGenerating ? 'Creating Your Coloring Page...' : '🎨 Create Coloring Page'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Error Display */}
                  {uploadError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}

                  {/* Upload Success */}
                  {uploadResults.length > 0 && !generatedImage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <h3 className="text-lg font-medium text-green-800 mb-2">
                        Photos Uploaded Successfully!
                      </h3>
                      <div className="space-y-2">
                        {uploadResults.map((result) => (
                          <div key={result.filename} className="text-sm text-green-600">
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

                {/* Right Column - Preview */}
                <div>
                  {generatedImage ? (
                    <div className="bg-gray-50 rounded-lg border p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          Your Coloring Page
                        </h3>
                      </div>
                      <div className="relative">
                        <img
                          src={generatedImage.imageUrl}
                          alt="Generated coloring page"
                          className="w-full rounded-lg border"
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        <Button
                          onClick={downloadImage}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          📥 Download JPG (Free!)
                        </Button>
                        <Button
                          onClick={handleRegenerate}
                          disabled={isGenerating}
                          variant="outline"
                          className="w-full"
                        >
                          {isGenerating ? 'Generating...' : '🔄 Regenerate'}
                        </Button>
                        <div className="text-center pt-2">
                          <Link href="/auth">
                            <Button variant="link" className="text-purple-600">
                              💾 Sign up to save forever & export PDFs
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg border p-6">
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
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2">Upload & Generate</h3>
            <p className="text-gray-600">Drop your photo and get an instant coloring page (FREE)</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">💾</div>
            <h3 className="text-lg font-semibold mb-2">Save Forever</h3>
            <p className="text-gray-600">Create account to save pages and export print-ready PDFs</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">Easy to Use</h3>
            <p className="text-gray-600">Upload photos and get instant coloring pages with just a few clicks!</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Do I need an account to use Colorific?
              </h3>
              <p className="text-gray-600">
                No! You can start creating coloring pages immediately without signing up. However, an account lets you save your creations forever, export high-quality PDFs, and access unlimited generations.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                What happens to my pages without an account?
              </h3>
              <p className="text-gray-600">
                Without an account, you can still generate and download coloring pages instantly. Creating an account lets you save your pages permanently, organize them in a dashboard, and export high-quality PDFs.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                What are the benefits of creating an account?
              </h3>
              <p className="text-gray-600">
                With an account, you get unlimited generations, permanent storage of all your coloring pages, the ability to export print-ready PDFs, and access to your creation history from any device.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-2 text-gray-900">
                Is it really free?
              </h3>
              <p className="text-gray-600">
                Yes! Basic coloring page generation is completely free. Premium features like PDF export and unlimited storage are available with a free account. Only PDF downloads have a small fee ($0.99) to cover processing costs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}