import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Use NEXT_PUBLIC_APP_URL when available — necessary when running behind a
  // reverse proxy (e.g. Caddy) where request.url reflects the internal address
  // (localhost:3030) instead of the public domain (portal.psgweb.me).
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestOrigin

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
