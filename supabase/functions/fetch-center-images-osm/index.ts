import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapillary API - free street-level imagery
const MAPILLARY_API = 'https://graph.mapillary.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const mapillaryToken = Deno.env.get('mapillary')

    if (!mapillaryToken) {
      return new Response(
        JSON.stringify({ error: 'mapillary secret not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all centers from database
    const { data: centers, error: centersError } = await supabase
      .from('dialysis_centers')
      .select('id, name, lat, lng, city')

    if (centersError) {
      throw new Error(`Failed to fetch centers: ${centersError.message}`)
    }

    console.log(`Processing ${centers?.length || 0} centers...`)

    const results: { centerId: string; status: string; imageUrl?: string }[] = []
    let processed = 0
    let found = 0
    let notFound = 0

    for (const center of centers || []) {
      processed++
      
      // Check if we already have an image for this center
      const { data: existing } = await supabase
        .from('center_images')
        .select('image_url')
        .eq('center_id', center.id)
        .maybeSingle()

      if (existing?.image_url && existing.image_url.includes('storage')) {
        console.log(`[${processed}/${centers?.length}] ${center.id} - already has image`)
        results.push({ centerId: center.id, status: 'existing', imageUrl: existing.image_url })
        found++
        continue
      }

      // Search for Mapillary images near the coordinates
      // radius in meters (100m radius)
      const searchUrl = `${MAPILLARY_API}/images?access_token=${mapillaryToken}&fields=id,thumb_1024_url,thumb_256_url&bbox=${center.lng - 0.001},${center.lat - 0.001},${center.lng + 0.001},${center.lat + 0.001}&limit=1`

      try {
        const response = await fetch(searchUrl)
        
        if (!response.ok) {
          console.error(`[${processed}/${centers?.length}] ${center.id} - Mapillary API error: ${response.status}`)
          results.push({ centerId: center.id, status: 'api_error' })
          notFound++
          continue
        }

        const data = await response.json()

        if (data.data && data.data.length > 0) {
          const imageData = data.data[0]
          const mapillaryImageUrl = imageData.thumb_1024_url || imageData.thumb_256_url

          if (mapillaryImageUrl) {
            // Download and store the image
            const imageResponse = await fetch(mapillaryImageUrl)
            
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.blob()
              const filePath = `${center.id}.jpg`

              const { error: uploadError } = await supabase
                .storage
                .from('center-images')
                .upload(filePath, imageBlob, {
                  contentType: 'image/jpeg',
                  upsert: true
                })

              if (!uploadError) {
                const { data: publicUrlData } = supabase
                  .storage
                  .from('center-images')
                  .getPublicUrl(filePath)

                const finalUrl = publicUrlData.publicUrl

                // Save to database
                await supabase
                  .from('center_images')
                  .upsert({
                    center_id: center.id,
                    image_url: finalUrl,
                    place_id: `mapillary_${imageData.id}`,
                    fetched_at: new Date().toISOString()
                  }, { onConflict: 'center_id' })

                console.log(`[${processed}/${centers?.length}] ${center.id} - ✓ image saved`)
                results.push({ centerId: center.id, status: 'saved', imageUrl: finalUrl })
                found++
                continue
              }
            }
          }
        }

        // No Mapillary image found - use OpenStreetMap tile as fallback
        // Calculate tile coordinates for zoom level 16
        const zoom = 16
        const n = Math.pow(2, zoom)
        const tileX = Math.floor((center.lng + 180) / 360 * n)
        const tileY = Math.floor((1 - Math.log(Math.tan(center.lat * Math.PI / 180) + 1 / Math.cos(center.lat * Math.PI / 180)) / Math.PI) / 2 * n)
        
        // Use OSM tile server directly
        const osmTileUrl = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
        
        try {
          const osmResponse = await fetch(osmTileUrl, {
            headers: {
              'User-Agent': 'DialRoad-App/1.0 (dialysis center finder)'
            }
          })
          
          if (osmResponse.ok) {
            const osmBlob = await osmResponse.blob()
            const filePath = `${center.id}.png`

            const { error: uploadError } = await supabase
              .storage
              .from('center-images')
              .upload(filePath, osmBlob, {
                contentType: 'image/png',
                upsert: true
              })

            if (!uploadError) {
              const { data: publicUrlData } = supabase
                .storage
                .from('center-images')
                .getPublicUrl(filePath)

              const finalUrl = publicUrlData.publicUrl

              await supabase
                .from('center_images')
                .upsert({
                  center_id: center.id,
                  image_url: finalUrl,
                  place_id: 'osm_tile',
                  fetched_at: new Date().toISOString()
                }, { onConflict: 'center_id' })

              console.log(`[${processed}/${centers?.length}] ${center.id} - ✓ OSM tile saved`)
              results.push({ centerId: center.id, status: 'osm_tile', imageUrl: finalUrl })
              found++
              continue
            }
          }
        } catch (osmErr) {
          console.error(`[${processed}/${centers?.length}] ${center.id} - OSM tile error:`, osmErr)
        }

        console.log(`[${processed}/${centers?.length}] ${center.id} - no image found`)
        results.push({ centerId: center.id, status: 'not_found' })
        notFound++

      } catch (err) {
        console.error(`[${processed}/${centers?.length}] ${center.id} - error:`, err)
        results.push({ centerId: center.id, status: 'error' })
        notFound++
      }

      // Rate limiting - avoid overwhelming the APIs
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: centers?.length || 0,
        found,
        notFound,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in fetch-center-images-osm:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
