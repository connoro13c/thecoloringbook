import Link from 'next/link'

export default async function AuthCodeError({ 
  searchParams 
}: { 
  searchParams: Promise<{ error?: string; error_description?: string }> 
}) {
  const params = await searchParams
  const error = params.error
  const errorDescription = params.error_description

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-ivory">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-primary-indigo mb-4">Authentication Error</h1>
        <p className="text-neutral-slate mb-4">
          There was an error with the authentication process.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-left">
            <p className="text-sm font-medium text-red-800">Error: {error}</p>
            {errorDescription && (
              <p className="text-sm text-red-600 mt-1">{errorDescription}</p>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          <p className="text-sm text-neutral-slate/70">
            Common solutions:
          </p>
          <ul className="text-xs text-neutral-slate/60 text-left space-y-1">
            <li>• Check if localhost:3000 is in Supabase redirect URLs</li>
            <li>• Verify Google OAuth is properly configured</li>
            <li>• Try clearing browser cookies</li>
          </ul>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Link 
            href="/test" 
            className="flex-1 bg-primary-indigo text-white px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            Try Again
          </Link>
          <Link 
            href="/" 
            className="flex-1 bg-neutral-slate/10 text-neutral-slate px-4 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
