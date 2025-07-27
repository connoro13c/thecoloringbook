'use client'

export function SignInCallout() {
  return (
    <div className="bg-gradient-to-br from-accent-aqua/10 via-white to-primary-indigo/5 rounded-3xl p-8 shadow-lg border border-primary-indigo/10 max-w-2xl mx-auto">
      <div className="text-center space-y-6">
        
        {/* Header */}
        <div>
          <h3 className="font-playfair text-2xl font-bold text-neutral-slate mb-3">
            Why sign in?
          </h3>
          <p className="text-neutral-slate/80 text-lg">
            We're a simple app helping families turn pictures into fun coloring pages. 
            All proceeds go to Stanford Children's Hospital.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 py-4">
          
          {/* Tax Documentation */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="font-medium text-neutral-slate mb-1">Tax Documentation</h4>
            <p className="text-sm text-neutral-slate/70">
              Proper receipts for your charitable donations
            </p>
          </div>

          {/* Quality & Safety */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-secondary-rose/20 to-secondary-rose/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-secondary-rose" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="font-medium text-neutral-slate mb-1">Prevent Abuse</h4>
            <p className="text-sm text-neutral-slate/70">
              Maintain quality and keep the service safe
            </p>
          </div>

          {/* Save Creations */}
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary-indigo/20 to-primary-indigo/40 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-indigo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="7,3 7,8 15,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="font-medium text-neutral-slate mb-1">Save Creations</h4>
            <p className="text-sm text-neutral-slate/70">
              Keep your coloring pages secure forever
            </p>
          </div>
        </div>

        {/* Hospital Callout */}
        <div className="bg-gradient-to-r from-accent-aqua/10 to-secondary-rose/10 rounded-2xl p-6 border border-accent-aqua/20">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-8 h-8 text-secondary-rose" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path 
                d="M22 12h-4l-3 9L9 3l-3 9H2" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <h4 className="font-playfair text-xl font-bold text-neutral-slate">
              Supporting Stanford Children's Hospital
            </h4>
          </div>
          <p className="text-neutral-slate/80 text-center">
            Sorry for the added step – it helps us help kids! 🏥
          </p>
        </div>

      </div>
    </div>
  )
}
