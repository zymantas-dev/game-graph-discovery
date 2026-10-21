// Vercel function: server-side RAWG proxy so the API key never ships in the
// client bundle. Set RAWG_API_KEY in the project's environment variables.
// Only the read-only /games endpoints and filter params the app uses are allowed.

const ALLOWED_PATH = /^games(\/[\w-]+)?$/
const ALLOWED_PARAMS = new Set(['search', 'page_size', 'page', 'developers', 'genres', 'tags', 'ordering'])

export async function GET(request) {
  const key = process.env.RAWG_API_KEY
  if (!key) return Response.json({ error: 'RAWG is not configured.' }, { status: 503 })

  const incoming = new URL(request.url)
  const path = incoming.searchParams.get('path') ?? ''
  if (!ALLOWED_PATH.test(path)) return Response.json({ error: 'Unsupported path.' }, { status: 400 })

  const upstream = new URL(`https://api.rawg.io/api/${path}`)
  for (const [name, value] of incoming.searchParams) {
    if (ALLOWED_PARAMS.has(name)) upstream.searchParams.set(name, value)
  }
  upstream.searchParams.set('key', key)

  const response = await fetch(upstream, { headers: { Accept: 'application/json' } })
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
