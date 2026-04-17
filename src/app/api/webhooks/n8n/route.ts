import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { N8nConfirmationSchema } from '@/lib/schemas/publishing'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  const secret = process.env.N8N_WEBHOOK_SECRET
  if (secret) {
    const provided = request.headers.get('x-webhook-secret')
    if (provided !== secret) {
      return NextResponse.json({ error: 'Secret invalide' }, { status: 401 })
    }
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  let confirmation
  try {
    confirmation = N8nConfirmationSchema.parse(rawBody)
  } catch (err) {
    const message =
      err instanceof ZodError ? err.issues.map((i) => i.message).join(', ') : 'Payload invalide'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing, error: loadError } = await supabase
    .from('publishing_events')
    .select('id, published_at')
    .eq('id', confirmation.event_id)
    .maybeSingle()

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Évènement introuvable' }, { status: 404 })
  }

  if (existing.published_at) {
    return NextResponse.json({ success: true, idempotent: true })
  }

  const publishedAt =
    confirmation.status === 'delivered'
      ? (confirmation.published_at ?? new Date().toISOString())
      : null

  const { error: updateError } = await supabase
    .from('publishing_events')
    .update({
      published_at: publishedAt,
      response_status: confirmation.response_status ?? null,
      response_body: confirmation.response_body ?? null,
    })
    .eq('id', confirmation.event_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
