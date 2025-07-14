import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface GetTourRequest {
  tourId: string;
}

// Mock data store (in production, this would be from Supabase database)
const TOURS_STORE = new Map<string, any>();

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

    const url = new URL(req.url);
    const tourId = url.searchParams.get('tourId');

    if (!tourId) {
      return new Response(
        JSON.stringify({ error: 'Missing tourId parameter' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Try to get from store
    const tour = TOURS_STORE.get(tourId);
    
    if (!tour) {
      return new Response(
        JSON.stringify({ error: 'Tour not found' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    return new Response(
      JSON.stringify(tour),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Get tour error:', error);
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

// Helper function to store tours (used by generate-tour function)
export function storeTour(tourId: string, tourData: any) {
  TOURS_STORE.set(tourId, tourData);
} 