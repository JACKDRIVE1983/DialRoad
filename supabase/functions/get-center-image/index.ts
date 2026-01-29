import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { center_id, name, address, city } = await req.json()

    if (!center_id) {
      return new Response(
        JSON.stringify({ error: 'center_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')

    if (!googleMapsApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured')
      return new Response(
        JSON.stringify({ image_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role for write access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if we already have a cached image for this center
    const { data: existingImage, error: fetchError } = await supabase
      .from('center_images')
      .select('image_url')
      .eq('center_id', center_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching cached image:', fetchError)
    }

    // If we have a cached image (even if null - meaning we already tried and found nothing)
    if (existingImage !== null) {
      console.log(`[${center_id}] Returning cached image:`, existingImage.image_url ? 'found' : 'null')
      return new Response(
        JSON.stringify({ image_url: existingImage.image_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No cached data - fetch from Google Places API
    console.log(`[${center_id}] Fetching from Google Places API...`)

    // Build search query
    const searchQuery = `${name} ${address} ${city}`.trim()
    
    // Step 1: Find place using Text Search (New)
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos'
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        languageCode: 'it',
        maxResultCount: 1
      })
    })

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('Places API search error:', errorText)
      
      // Cache null result to avoid repeated failed calls
      await supabase.from('center_images').insert({
        center_id,
        image_url: null,
        place_id: null
      })
      
      return new Response(
        JSON.stringify({ image_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const searchData = await searchResponse.json()
    console.log(`[${center_id}] Search result:`, JSON.stringify(searchData).substring(0, 200))

    if (!searchData.places || searchData.places.length === 0) {
      console.log(`[${center_id}] No place found`)
      
      // Cache null result
      await supabase.from('center_images').insert({
        center_id,
        image_url: null,
        place_id: null
      })
      
      return new Response(
        JSON.stringify({ image_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const place = searchData.places[0]
    const placeId = place.id

    // Check if place has photos
    if (!place.photos || place.photos.length === 0) {
      console.log(`[${center_id}] Place found but no photos available`)
      
      // Cache null result with place_id for reference
      await supabase.from('center_images').insert({
        center_id,
        image_url: null,
        place_id: placeId
      })
      
      return new Response(
        JSON.stringify({ image_url: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Get photo URL using the photo name
    const photoName = place.photos[0].name
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${googleMapsApiKey}`
    
    console.log(`[${center_id}] Photo URL generated`)

    // Cache the result
    const { error: insertError } = await supabase.from('center_images').insert({
      center_id,
      image_url: photoUrl,
      place_id: placeId
    })

    if (insertError) {
      console.error('Error caching image:', insertError)
    }

    return new Response(
      JSON.stringify({ image_url: photoUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in get-center-image:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage, image_url: null }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
