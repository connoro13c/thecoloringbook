'use client'

import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const { isSignedIn, user } = useUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            🎨 <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Coloring Magic
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Turn any photo into a beautiful coloring Page. 
            Perfect for kids, teachers, and creative fun!
          </p>
          
          {isSignedIn ? (
            <div className="space-y-4">
              <p className="text-lg text-gray-700">Welcome back, {user?.firstName}! 👋</p>
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
              <p className="text-lg text-gray-700">Get started in seconds!</p>
              <div className="space-y-4">
                <Link href="/upload">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    🚀 Start Creating
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2">Upload Photos</h3>
            <p className="text-gray-600">Upload up to 3 photos of your kids, pets, or any scene</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-lg font-semibold mb-2">AI Magic</h3>
            <p className="text-gray-600">Our AI transforms your photos into beautiful line art</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-4">🖨️</div>
            <h3 className="text-lg font-semibold mb-2">Print & Color</h3>
            <p className="text-gray-600">Download high-quality PDFs ready for coloring fun</p>
          </div>
        </div>
      </div>
    </div>
  )
}