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
    const mapillaryToken = Deno.env.get('MAPILLARY_ACCESS_TOKEN')

    if (!mapillaryToken) {
      return new Response(
        JSON.stringify({ error: 'MAPILLARY_ACCESS_TOKEN not configured' }),
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

        // No Mapillary image found - generate static OSM map as fallback
        const osmStaticUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${center.lat},${center.lng}&zoom=17&size=400x300&maptype=mapnik&markers=${center.lat},${center.lng},red-pushpin`
        
        try {
          const osmResponse = await fetch(osmStaticUrl)
          
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
                  place_id: 'osm_static',
                  fetched_at: new Date().toISOString()
                }, { onConflict: 'center_id' })

              console.log(`[${processed}/${centers?.length}] ${center.id} - ✓ OSM map saved`)
              results.push({ centerId: center.id, status: 'osm_map', imageUrl: finalUrl })
              found++
              continue
            }
          }
        } catch (osmErr) {
          console.error(`[${processed}/${centers?.length}] ${center.id} - OSM fallback error:`, osmErr)
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
