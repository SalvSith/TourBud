import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface TourSummary {
  tourId: string;
  title: string;
  description: string;
  streetName: string;
  city: string;
  country: string;
  estimatedDuration: number;
  distance: string;
  audioStatus: string;
  createdAt: string;
  viewCount: number;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const userId = url.searchParams.get('userId'); // Optional - for future auth

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration');
    }

    // Connect to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Build query
    let query = supabase
      .from('tours')
      .select('tour_id, title, description, street_name, city, country, estimated_duration, distance, audio_status, created_at, view_count')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // If userId provided, filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // For now, return all tours (or could filter by is_public in future)
      // query = query.eq('is_public', true);
    }

    const { data: tours, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Format response
    const formattedTours: TourSummary[] = (tours || []).map(tour => ({
      tourId: tour.tour_id,
      title: tour.title,
      description: tour.description,
      streetName: tour.street_name,
      city: tour.city,
      country: tour.country,
      estimatedDuration: tour.estimated_duration,
      distance: tour.distance,
      audioStatus: tour.audio_status,
      createdAt: tour.created_at,
      viewCount: tour.view_count,
    }));

    console.log(`✅ Retrieved ${formattedTours.length} tours`);

    return new Response(
      JSON.stringify({
        tours: formattedTours,
        total: count || formattedTours.length,
        limit,
        offset
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error) {
    console.error('List tours error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});

