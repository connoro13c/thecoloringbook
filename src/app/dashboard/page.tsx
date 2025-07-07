import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's pages
  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.email}!</p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {pages && pages.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page: { id: string; prompt: string; style: string; created_at: string; jpg_path: string | null }) => (
              <div key={page.id} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="aspect-square bg-gray-100 rounded-xl mb-4">
                  {page.jpg_path && (
                    <img
                      src={page.jpg_path}
                      alt={`Coloring page: ${page.prompt}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{page.prompt}</h3>
                <p className="text-sm text-gray-600 mb-2">Style: {page.style}</p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(page.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Pages Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first coloring page to get started!
            </p>
            <Link
              href="/"
              className="inline-block bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Your First Page
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
