import { AuthTester } from '@/components/dev/AuthTester'
import Link from 'next/link'

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-rose-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Auth Testing</h1>
          <p className="text-gray-600">Test authentication without going through the full flow</p>
        </div>
        
        <AuthTester />
        
        <div className="text-center mt-6">
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            ← Back to main app
          </Link>
        </div>
      </div>
    </div>
  )
}
