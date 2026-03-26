import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'

  // Use NEXT_PUBLIC_APP_URL when available — necessary when running behind a
  // reverse proxy (e.g. Caddy) where request.url reflects the internal address
  // (localhost:3030) instead of the public domain (portal.psgweb.me).
  const origin = process.env.NEXT_PUBLIC_APP_URL || requestOrigin

  const supabase = await createServerClient()

  // PKCE flow: code sent after Supabase verifies the token server-side
  const code = searchParams.get('code')
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Token-hash flow: used when the magic link is opened in a different
  // browser/device than where signInWithOtp was called (no PKCE verifier cookie).
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
