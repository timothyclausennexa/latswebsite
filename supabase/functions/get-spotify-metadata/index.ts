// supabase/functions/get-spotify-metadata/index.ts

// This file contains the code for your new Supabase Edge Function.
// You must deploy this function using the Supabase CLI for the jukebox to work.
// Run this command in your project's root directory:
// npx supabase functions deploy get-spotify-metadata

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Define CORS headers to allow requests from any origin (or lock it down to your domain)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle preflight CORS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { song_url } = await req.json()
    if (!song_url) {
        return new Response(JSON.stringify({ error: 'song_url is required in the request body' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }

    // Make the server-to-server request to Spotify's oEmbed API
    const spotifyResponse = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(song_url)}`)

    if (!spotifyResponse.ok) {
        const errorText = await spotifyResponse.text();
        throw new Error(`Spotify API request failed with status ${spotifyResponse.status}: ${errorText}`)
    }

    const data = await spotifyResponse.json()

    // Return the successful response to the client
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
