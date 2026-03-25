import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/auth/callback', '/api/health']

export async function middleware(request: NextRequest) {
  // Temporary: surface errors instead of crashing with MIDDLEWARE_INVOCATION_FAILED
  try {
    return await middlewareImpl(request)
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    console.error('[middleware] unhandled error:', msg)
    // Allow public paths through; redirect everything else to login
    const { pathname } = request.nextUrl
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
    return NextResponse.redirect(new URL(`/login`, request.url))
  }
}

async function middlewareImpl(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
// end middlewareImpl

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
