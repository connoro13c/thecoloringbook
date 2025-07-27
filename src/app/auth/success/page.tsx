import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AuthSuccessPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-md mx-auto text-center space-y-6 p-8 bg-white rounded-2xl shadow-lg">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
        <p className="text-gray-600">
          You are now signed in and can access, create, and manage your coloring pages
        </p>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Create Another Page
          </Link>
        </div>
      </div>
    </div>
  )
}
