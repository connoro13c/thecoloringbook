import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',           // Landing page (sign-in gate)
  '/api/auth/',  // Supabase auth endpoints
  '/api/webhooks/', // Stripe webhooks
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Preserve existing response headers when setting new cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  
  // Handle redirects for unauthenticated users
  if (!user && !isPublicPath(path)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('redirectedFrom', path)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Preserve cookies on redirect
    request.cookies.getAll().forEach(cookie => 
      redirectResponse.cookies.set(cookie.name, cookie.value)
    )
    return redirectResponse
  }

  // Redirect authenticated users away from landing page and obsolete auth pages to generator
  if (user && (path === '/' || path === '/login' || path === '/debug-auth')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/generator'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    
    // Preserve cookies on redirect
    request.cookies.getAll().forEach(cookie => 
      redirectResponse.cookies.set(cookie.name, cookie.value)
    )
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes handle their own auth)
     * - Static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
