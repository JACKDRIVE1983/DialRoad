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
    const { center_id, name, address, city, lat, lng } = await req.json()

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

    // If we have a cached image stored locally (Supabase Storage URL), return it
    if (existingImage?.image_url && existingImage.image_url.includes('storage')) {
      console.log(`[${center_id}] Returning locally cached image`)
      return new Response(
        JSON.stringify({ image_url: existingImage.image_url }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const hasExistingRecord = existingImage !== null

    // Fetch from Google Places API
    console.log(`[${center_id}] Fetching from Google Places API...`)

    // Build search query
    const searchQuery = `${name} ${address} ${city}`.trim()
    
    // Step 1: Find place using Text Search (New)
    const searchUrl = `https://places.googleapis.com/v1/places:searchText`
    
    let googleImageUrl: string | null = null
    let placeId: string | null = null

    try {
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

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        console.log(`[${center_id}] Search result:`, JSON.stringify(searchData).substring(0, 200))

        if (searchData.places && searchData.places.length > 0) {
          const place = searchData.places[0]
          placeId = place.id

          // Check if place has photos
          if (place.photos && place.photos.length > 0) {
            const photoName = place.photos[0].name
            googleImageUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${googleMapsApiKey}`
            console.log(`[${center_id}] Place Photo URL generated`)
          }
        }
      } else {
        const errorText = await searchResponse.text()
        console.error('Places API search error:', errorText)
      }
    } catch (err) {
      console.error('Error fetching from Places API:', err)
    }

    // Step 2: If no Place Photo, try Street View as fallback
    if (!googleImageUrl && lat && lng) {
      console.log(`[${center_id}] No Place Photo, trying Street View fallback...`)
      
      // Verify Street View is available by checking metadata
      const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${googleMapsApiKey}`
      
      try {
        const metadataResponse = await fetch(metadataUrl)
        const metadata = await metadataResponse.json()
        
        if (metadata.status === 'OK') {
          googleImageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=90&key=${googleMapsApiKey}`
          console.log(`[${center_id}] Street View available, using as fallback`)
        } else {
          console.log(`[${center_id}] Street View not available: ${metadata.status}`)
        }
      } catch (err) {
        console.error('Error checking Street View metadata:', err)
      }
    }

    // Step 3: Download image from Google and upload to Supabase Storage
    let finalImageUrl: string | null = null

    if (googleImageUrl) {
      console.log(`[${center_id}] Downloading image from Google...`)
      
      try {
        const imageResponse = await fetch(googleImageUrl)
        
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob()
          const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
          
          // Determine file extension
          let extension = 'jpg'
          if (contentType.includes('png')) extension = 'png'
          else if (contentType.includes('webp')) extension = 'webp'
          
          const filePath = `${center_id}.${extension}`
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('center-images')
            .upload(filePath, imageBlob, {
              contentType,
              upsert: true // Overwrite if exists
            })
          
          if (uploadError) {
            console.error(`[${center_id}] Upload error:`, uploadError)
          } else {
            // Get public URL
            const { data: publicUrlData } = supabase
              .storage
              .from('center-images')
              .getPublicUrl(filePath)
            
            finalImageUrl = publicUrlData.publicUrl
            console.log(`[${center_id}] Image saved to storage: ${finalImageUrl}`)
          }
        } else {
          console.error(`[${center_id}] Failed to download image: ${imageResponse.status}`)
        }
      } catch (err) {
        console.error(`[${center_id}] Error downloading/uploading image:`, err)
      }
    }

    // Step 4: Cache the result in database
    if (hasExistingRecord) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('center_images')
        .update({
          image_url: finalImageUrl,
          place_id: placeId,
          fetched_at: new Date().toISOString()
        })
        .eq('center_id', center_id)

      if (updateError) {
        console.error('Error updating cached image:', updateError)
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('center_images')
        .insert({
          center_id,
          image_url: finalImageUrl,
          place_id: placeId
        })

      if (insertError) {
        console.error('Error caching image:', insertError)
      }
    }

    return new Response(
      JSON.stringify({ image_url: finalImageUrl }),
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
