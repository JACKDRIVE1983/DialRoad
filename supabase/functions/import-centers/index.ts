import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RawCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  region: string;
  phone: string;
  email: string | null;
  lat: number;
  lng: number;
  geocode_status: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get centers data from request body
    const { centers } = await req.json() as { centers: RawCenter[] };

    if (!centers || !Array.isArray(centers)) {
      return new Response(
        JSON.stringify({ error: 'Invalid centers data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[import-centers] Received ${centers.length} centers to import`);

    // Filter valid centers and deduplicate
    const seenIds = new Set<string>();
    const validCenters = centers
      .filter((c: RawCenter) => {
        if (!c.geocode_status || c.geocode_status !== 'OK') return false;
        if (!c.lat || !c.lng || !c.region) return false;
        if (seenIds.has(c.id)) return false;
        seenIds.add(c.id);
        return true;
      })
      .map((c: RawCenter) => ({
        id: c.id,
        name: c.name || 'Centro Dialisi',
        address: c.address || '',
        city: c.city || '',
        province: c.province || '',
        region: c.region ? c.region.charAt(0).toUpperCase() + c.region.slice(1).toLowerCase() : 'Sconosciuta',
        phone: c.phone || '',
        email: c.email,
        lat: c.lat,
        lng: c.lng,
        geocode_status: c.geocode_status,
        services: ['Emodialisi'],
        opening_hours: 'Lun-Sab: 6:00-20:00',
        is_open: true
      }));

    console.log(`[import-centers] Valid centers after filtering: ${validCenters.length}`);

    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < validCenters.length; i += batchSize) {
      const batch = validCenters.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('dialysis_centers')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error(`[import-centers] Batch error:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
      }
    }

    console.log(`[import-centers] Import complete: ${inserted} inserted, ${errors} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: inserted,
        errors,
        total: validCenters.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[import-centers] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
