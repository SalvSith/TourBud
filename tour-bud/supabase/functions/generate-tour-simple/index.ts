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

// Helper function to convert country names to ISO codes
function getCountryCode(country: string): string {
  const countryMap: { [key: string]: string } = {
    'United States': 'US',
    'United Kingdom': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'Italy': 'IT',
    'Spain': 'ES',
    'Japan': 'JP',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Netherlands': 'NL',
  };
  return countryMap[country] || 'US';
}

// Get timezone from country code
function getTimezone(countryCode: string): string {
  const timezoneMap: { [key: string]: string } = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'CA': 'America/Toronto',
    'AU': 'Australia/Sydney',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'IT': 'Europe/Rome',
    'ES': 'Europe/Madrid',
    'JP': 'Asia/Tokyo',
  };
  return timezoneMap[countryCode] || 'UTC';
}

// Call OpenAI Responses API with web_search tool
async function callOpenAIWithWebSearch(
  prompt: string,
  locationData: { city: string; area: string; country: string }
): Promise<string> {
  const countryCode = getCountryCode(locationData.country);
  const timezone = getTimezone(countryCode);
  
  console.log('🔍 Calling OpenAI Responses API with web_search...');

  const requestBody = {
    model: 'gpt-4o-mini',
    input: prompt,
    tools: [
      {
        type: 'web_search',
        user_location: {
          type: 'approximate',
          city: locationData.city,
          region: locationData.area || locationData.city,
          country: countryCode,
          timezone: timezone
        }
      }
    ],
    tool_choice: 'auto',
    max_output_tokens: 4000,
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ OpenAI API Error:', errorData);
    throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('✅ OpenAI API Success');
  
  // Extract content from response
  let content = '';
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === 'message' && item.content) {
        for (const contentItem of item.content) {
          if (contentItem.type === 'output_text') {
            content += contentItem.text;
          }
        }
      }
    }
  }
  
  return content;
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (!OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY environment variable');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing OpenAI API key.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { locationData, places, interests } = await req.json() as GenerateTourRequest;

    if (!locationData || !interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Format places - optional context only
    const placesContext = places && places.length > 0 
      ? `\n\nPlaces the user noticed (mention briefly if historically relevant): ${places.map(p => p.name).join(', ')}`
      : '';

    console.log('🚀 Starting quick tour generation with web search...');

    // Simplified but still history-focused prompt
    const tourPrompt = `You are a knowledgeable historian creating a walking tour. Search the web to find REAL historical facts about ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

## RESEARCH & CREATE A TOUR

Search for:
1. The history and origins of ${locationData.streetName} - when was it built? Why is it named that?
2. Notable historical events that happened on or near this street
3. Famous people associated with this street
4. Interesting architectural or cultural facts

Then create a 10-12 minute walking tour (approximately 1,500-1,800 words) that:
- Opens with the street's historical origins
- Shares 3-4 specific historical facts or stories you discovered
- Describes what the street looked like in different time periods
- Closes with how the street connects past to present

## IMPORTANT GUIDELINES
- The user's interests (${interests.join(', ')}) should only SUBTLY flavor the tour - don't force connections
- Focus on REAL, verified historical facts from your web search
- If you can't find specific history, be honest and focus on what you can verify${placesContext}

Location: ${locationData.streetName}, ${locationData.area || ''}, ${locationData.city}, ${locationData.country}

Create an engaging, historically accurate tour now.`;

    const finalNarration = await callOpenAIWithWebSearch(tourPrompt, locationData);
    
    if (!finalNarration || finalNarration.trim().length === 0) {
      throw new Error('Failed to generate tour content');
    }

    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wordCount = finalNarration.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);

    const tourResponse: TourResponse = {
      tourId,
      narration: finalNarration,
      title: `${locationData.streetName} Historical Tour`,
      description: finalNarration.substring(0, 150) + '...',
      estimatedDuration: Math.max(8, Math.min(15, estimatedMinutes)),
      distance: '0.5 mi'
    };

    console.log('🎉 Quick tour generated successfully!');

    return new Response(
      JSON.stringify(tourResponse),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Generate tour error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
