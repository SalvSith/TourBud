import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the client's IP from headers (Vercel/Cloudflare/etc set these)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    
    // Use the first available IP
    let clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || '';
    
    console.log('Client IP:', clientIp);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    // If no IP found or it's localhost, return error
    if (!clientIp || clientIp === '127.0.0.1' || clientIp === '::1') {
      // Try to get from request body if provided
      const body = await req.json().catch(() => ({}));
      if (body.testIp) {
        clientIp = body.testIp;
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'Could not determine client IP',
            fallback: true,
            // Return a default location (can be customized)
            latitude: 0,
            longitude: 0,
            city: 'Unknown',
            country: 'Unknown'
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Use ip-api.com (free, no API key needed, 45 requests/minute limit)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,city,lat,lon,timezone`);
    
    if (!geoResponse.ok) {
      throw new Error(`IP geolocation failed: ${geoResponse.status}`);
    }

    const geoData = await geoResponse.json();
    
    console.log('Geo data:', geoData);

    if (geoData.status === 'fail') {
      return new Response(
        JSON.stringify({ 
          error: geoData.message || 'IP geolocation failed',
          fallback: true,
          latitude: 0,
          longitude: 0,
          city: 'Unknown',
          country: 'Unknown'
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({
        latitude: geoData.lat,
        longitude: geoData.lon,
        city: geoData.city,
        country: geoData.country,
        timezone: geoData.timezone,
        ip: clientIp,
        source: 'ip-geolocation',
        accuracy: 'city-level' // IP geolocation is only accurate to city level
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('IP geolocation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true,
        latitude: 0,
        longitude: 0,
        city: 'Unknown',
        country: 'Unknown'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

