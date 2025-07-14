import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface GenerateTourRequest {
  locationData: {
    latitude: number;
    longitude: number;
    streetName: string;
    plusCode: string;
    area: string;
    city: string;
    country: string;
  };
  places: Array<{
    name: string;
    type: string[];
    address: string;
    placeId: string;
    rating?: number;
    userRatingsTotal?: number;
  }>;
  interests: string[];
}

interface TourResponse {
  tourId: string;
  narration: string;
  title: string;
  description: string;
  estimatedDuration: number;
  distance: string;
}

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

    // Check for required environment variables
    if (!OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing OpenAI API key. Please contact support.' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    const { locationData, places, interests } = await req.json() as GenerateTourRequest;

    if (!locationData || !interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }

    // Format places list
    const placesListFormatted = places && places.length > 0 
      ? places.map(p => {
          const rating = p.rating ? ` (${p.rating}★` + (p.userRatingsTotal ? `, ${p.userRatingsTotal} reviews)` : ')') : '';
          return `- ${p.name} at ${p.address}${rating}`;
        }).join('\n')
      : 'No specific places selected - focusing on street exploration';

    console.log('🚀 Starting simple tour generation...');

    // Simple, fast tour generation
    const tourPrompt = places && places.length > 0
      ? `Create an engaging 8-10 minute walking tour for ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

Location: ${locationData.streetName}, ${locationData.city}
User interests: ${interests.join(', ')}
Selected places: 
${placesListFormatted}

Create a tour that:
1. Introduces the street with historical context
2. Highlights each selected place with interesting facts
3. Connects to the user's interests: ${interests.join(', ')}
4. Provides a memorable conclusion

Keep it conversational, engaging, and around 1,200-1,500 words for 8-10 minutes of spoken content.`
      : `Create an engaging 8-10 minute street-focused walking tour for ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

Location: ${locationData.streetName}, ${locationData.city}
User interests: ${interests.join(', ')}
Focus: Street exploration (no specific places selected)

Since the user chose to explore the street itself, create a tour that:
1. Introduces the street's character and unique atmosphere
2. Highlights the street's history, architecture, and cultural significance
3. Points out interesting details visitors should notice while walking
4. Connects to the user's interests: ${interests.join(', ')}
5. Reveals what makes this street special and worth exploring
6. Provides a memorable conclusion about the street's essence

Focus on the street as a living, breathing place with its own personality. Guide visitors to see architectural details, understand the neighborhood character, and appreciate the street's role in the city.

Keep it conversational, engaging, and around 1,200-1,500 words for 8-10 minutes of spoken content.`;

    console.log('🤖 Calling OpenAI API...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a knowledgeable tour guide who creates engaging walking tours.' 
          },
          { role: 'user', content: tourPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    console.log('📡 OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ OpenAI API Success');

    const finalNarration = data.choices[0]?.message?.content || 'Tour generation failed';
    
    // Generate a unique tour ID
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const tourResponse: TourResponse = {
      tourId,
      narration: finalNarration,
      title: `${locationData.streetName} Walking Tour`,
      description: finalNarration.substring(0, 150) + '...',
      estimatedDuration: 10,
      distance: '0.5 mi'
    };

    console.log('🎉 Simple tour generated successfully!');

    return new Response(
      JSON.stringify(tourResponse),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('❌ Generate tour error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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