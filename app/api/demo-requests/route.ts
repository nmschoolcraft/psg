import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// In-memory rate limiter: 5 submissions per IP per hour
const rateMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= RATE_LIMIT) {
    return false
  }

  entry.count++
  return true
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sendNtfyNotification(data: {
  name: string
  email: string
  company: string
  phone?: string | null
  message?: string | null
}): Promise<void> {
  const topic = process.env.NTFY_TOPIC
  if (!topic) return

  const lines = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Company: ${data.company}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.message ? `Message: ${data.message}` : null,
  ].filter(Boolean)

  await fetch(`https://ntfy.sh/${topic}`, {
    method: 'POST',
    headers: {
      Title: 'New BSM Demo Request',
      Priority: 'high',
      Tags: 'bell,chart_increasing',
    },
    body: lines.join('\n'),
  })
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 }
    )
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null
  const message = typeof body.message === 'string' ? body.message.trim() || null : null

  if (!name || !email || !company) {
    return NextResponse.json(
      { success: false, error: 'Name, email, and company are required.' },
      { status: 400 }
    )
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, error: 'Invalid email address.' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: dbError } = await supabase.from('demo_requests').insert({
    name: name.slice(0, 255),
    email: email.toLowerCase().slice(0, 255),
    company: company.slice(0, 255),
    phone: phone?.slice(0, 50) ?? null,
    message: message?.slice(0, 2000) ?? null,
    ip_address: ip,
  })

  if (dbError) {
    console.error('[demo-requests] insert error:', dbError)
    return NextResponse.json(
      { success: false, error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    )
  }

  // Fire-and-forget — don't block response on notification
  sendNtfyNotification({ name, email, company, phone, message }).catch((err) =>
    console.error('[demo-requests] ntfy error:', err)
  )

  return NextResponse.json({ success: true })
}
