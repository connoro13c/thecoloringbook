import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-playful">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-12">
          <div className="text-center space-y-8 max-w-6xl mx-auto w-full">
            <div className="relative">
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight">
                Turn your kids&apos; photos into
                <span className="block text-primary animate-bounce-gentle">
                  personalized coloring pages
                </span>
              </h1>
              <div className="absolute -top-4 -right-4 text-4xl animate-pencil-draw hidden sm:block">
                ✏️
              </div>
            </div>
            
            <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Upload, customize, print, and watch your little ones bring their own adventures to life!
            </p>

            <div className="pt-8">
              <SignedOut>
                <Link href="/upload">
                  <Button size="lg" className="touch-target px-8 py-4 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 transform transition-transform hover:scale-105 shadow-lg">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Start Creating Magic
                  </Button>
                </Link>
              </SignedOut>
              
              <SignedIn>
                <Link href="/upload">
                  <Button size="lg" className="touch-target px-8 py-4 text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 transform transition-transform hover:scale-105 shadow-lg">
                    Create Your Coloring Page 🎨
                  </Button>
                </Link>
              </SignedIn>
            </div>

            {/* Visual Example */}
            <div className="pt-12 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">
                See the magic in action
              </h2>
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 mb-4 aspect-square flex items-center justify-center">
                      <span className="text-6xl">👧🏻</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Your photo</p>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="text-4xl animate-bounce-gentle">→</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 mb-4 aspect-square flex items-center justify-center border-4 border-dashed border-gray-400">
                      <span className="text-4xl">✏️📝</span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Coloring page</p>
                  </div>
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-3xl">📸</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  1. Upload Photos
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Drag & drop up to 3 photos of your little ones. We accept JPG and PNG files.
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  2. Customize Style
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Choose from Classic Cartoon, Manga Lite, or Bold Outlines. Add your own scene description!
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-3xl">🖨️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  3. Print & Color
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Download your custom PDF instantly and watch the magic unfold with crayons!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}