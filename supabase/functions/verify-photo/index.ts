import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { storage_path } = await req.json()
    if (!storage_path) throw new Error('Missing storage_path')

    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const supabaseService  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey     = Deno.env.get('ANTHROPIC_API_KEY')!

    if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY not configured')

    // ── 1. Download the image from storage ────────────────────────────────
    const adminClient = createClient(supabaseUrl, supabaseService)
    const { data: blob, error: dlError } = await adminClient.storage
      .from('avatars')
      .download(storage_path)

    if (dlError || !blob) throw new Error(dlError?.message ?? 'Could not download image')

    // ── 2. Convert to base64 ──────────────────────────────────────────────
    const buffer   = await blob.arrayBuffer()
    const bytes    = new Uint8Array(buffer)
    let binary     = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    const base64   = btoa(binary)

    // Detect media type from path extension
    const ext      = storage_path.split('.').pop()?.toLowerCase() ?? 'jpg'
    const mediaType =
      ext === 'png'  ? 'image/png'  :
      ext === 'webp' ? 'image/webp' :
      ext === 'gif'  ? 'image/gif'  :
      'image/jpeg'

    // ── 3. Ask Claude to verify the photo ────────────────────────────────
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `Analyse this image for use as a dating app profile photo.

Respond with JSON only (no markdown, no explanation):
{"valid": true/false, "reason": "one short sentence"}

Set valid=true ONLY if:
- The image clearly shows a real human face
- It is a genuine photograph (not AI-generated, illustration, cartoon, drawing, avatar)
- The person's face is reasonably visible and takes up a meaningful portion of the image

Set valid=false if:
- No human face is visible
- It appears AI-generated or digitally created
- It is a cartoon, illustration, meme, object, animal, or landscape
- The image is blurry, too dark, or the face is obscured`,
              },
            ],
          },
        ],
      }),
    })

    if (!claudeRes.ok) {
      const errText = await claudeRes.text()
      throw new Error(`Claude API error ${claudeRes.status}: ${errText}`)
    }

    const claudeData = await claudeRes.json()
    const rawText    = claudeData.content?.[0]?.text ?? '{}'

    // Parse JSON — Claude may occasionally wrap in backticks
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    const result    = jsonMatch
      ? JSON.parse(jsonMatch[0])
      : { valid: false, reason: 'Could not verify photo.' }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[verify-photo]', msg)
    return new Response(
      JSON.stringify({ valid: false, reason: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
