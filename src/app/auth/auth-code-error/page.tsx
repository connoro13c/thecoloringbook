export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-ivory">
      <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-primary-indigo mb-4">Authentication Error</h1>
        <p className="text-neutral-slate mb-6">
          There was an error with the authentication process. Please try signing in again.
        </p>
        <a 
          href="/" 
          className="inline-block bg-primary-indigo text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
        >
          Return to Home
        </a>
      </div>
    </div>
  )
}
