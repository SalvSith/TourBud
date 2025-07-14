import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Always set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    console.log('🧪 Basic test function called');
    console.log('API Key present:', !!OPENAI_API_KEY);

    const { locationData, places, interests } = await req.json();

    console.log('Request data received:', {
      streetName: locationData?.streetName,
      city: locationData?.city,
      placesCount: places?.length || 0,
      interestsCount: interests?.length || 0
    });

    // Simple mock tour without calling any external APIs
    const mockTour = {
      tourId: `test_${Date.now()}`,
      narration: `Welcome to ${locationData?.streetName || 'this street'} in ${locationData?.city || 'the city'}! This is a test tour to verify the function works. Your interests in ${interests?.join(' and ') || 'exploration'} will guide our journey. We'll explore ${places?.map(p => p.name).join(', ') || 'the selected locations'} together. This tour demonstrates that the basic function infrastructure is working correctly.`,
      title: `${locationData?.streetName || 'Test'} Tour`,
      description: 'Test tour to verify function infrastructure...',
      estimatedDuration: 5,
      distance: '0.3 mi'
    };

    console.log('✅ Mock tour generated successfully');

    return new Response(
      JSON.stringify(mockTour),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('❌ Test error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        hasApiKey: !!OPENAI_API_KEY,
        timestamp: Date.now()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}); 