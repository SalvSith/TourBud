import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

interface GeocodeRequest {
  latitude?: number;
  longitude?: number;
  address?: string;
}

interface GeocodeResponse {
  streetName: string;
  plusCode: string;
  area: string;
  city: string;
  country: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      });
    }

    const { latitude, longitude, address } = await req.json() as GeocodeRequest;

    // Validate input - need either coordinates or address
    if ((!latitude || !longitude) && !address) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude/longitude or address' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    let geocodeUrl: string;
    
    // Determine if this is reverse geocoding (coordinates → address) or forward geocoding (address → coordinates)
    if (latitude && longitude) {
      // Reverse geocoding: coordinates to address
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
    } else {
      // Forward geocoding: address to coordinates
      const encodedAddress = encodeURIComponent(address!);
      geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    // Call Google Geocoding API
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results || geocodeData.results.length === 0) {
      throw new Error(`Geocoding failed: ${geocodeData.status}`);
    }

    const result = geocodeData.results[0];
    const addressComponents = result.address_components || [];
    
    // Extract street name
    let streetName = '';
    const route = addressComponents.find((comp: any) => comp.types.includes('route'));
    if (route) {
      streetName = route.long_name;
    }

    // Extract plus code
    let plusCode = '';
    if (geocodeData.plus_code) {
      plusCode = geocodeData.plus_code.global_code || geocodeData.plus_code.compound_code || '';
    }

    // Extract area, city, country
    let area = '';
    let city = '';
    let country = '';

    // For "area" (suburb/neighborhood), check multiple types in priority order:
    // 1. sublocality_level_1 - most specific suburb (e.g., "St Andrews")
    // 2. sublocality - general suburb
    // 3. neighborhood - neighborhood within a city
    // 4. administrative_area_level_3 - sometimes used for suburbs
    const sublocalityLevel1 = addressComponents.find((comp: any) => comp.types.includes('sublocality_level_1'));
    const sublocality = addressComponents.find((comp: any) => comp.types.includes('sublocality'));
    const neighborhood = addressComponents.find((comp: any) => comp.types.includes('neighborhood'));
    const adminArea3 = addressComponents.find((comp: any) => comp.types.includes('administrative_area_level_3'));
    
    // Use the most specific one available
    if (sublocalityLevel1) {
      area = sublocalityLevel1.long_name;
    } else if (sublocality) {
      area = sublocality.long_name;
    } else if (neighborhood) {
      area = neighborhood.long_name;
    } else if (adminArea3) {
      area = adminArea3.long_name;
    }

    const locality = addressComponents.find((comp: any) => comp.types.includes('locality'));
    const countryComp = addressComponents.find((comp: any) => comp.types.includes('country'));

    if (locality) city = locality.long_name;
    if (countryComp) country = countryComp.long_name;

    const response: GeocodeResponse = {
      streetName,
      plusCode,
      area,
      city,
      country,
      formattedAddress: result.formatted_address,
      // Include coordinates in response (useful for forward geocoding)
      latitude: result.geometry?.location?.lat || latitude,
      longitude: result.geometry?.location?.lng || longitude
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Geocoding error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}); 