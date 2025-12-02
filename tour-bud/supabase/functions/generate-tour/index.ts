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
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Switzerland': 'CH',
    'Austria': 'AT',
    'Belgium': 'BE',
    'Ireland': 'IE',
    'Portugal': 'PT',
    'Greece': 'GR',
    'Poland': 'PL',
    'Czech Republic': 'CZ',
    'Hungary': 'HU',
    'Romania': 'RO',
    'Bulgaria': 'BG',
    'Croatia': 'HR',
    'Slovenia': 'SI',
    'Slovakia': 'SK',
    'Estonia': 'EE',
    'Latvia': 'LV',
    'Lithuania': 'LT',
    'Luxembourg': 'LU',
    'Malta': 'MT',
    'Cyprus': 'CY',
    'Iceland': 'IS',
    'Turkey': 'TR',
    'Russia': 'RU',
    'Ukraine': 'UA',
    'South Korea': 'KR',
    'Taiwan': 'TW',
    'Hong Kong': 'HK',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'New Zealand': 'NZ',
    'South Africa': 'ZA',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Colombia': 'CO',
    'Peru': 'PE',
    'Egypt': 'EG',
    'Morocco': 'MA',
    'Israel': 'IL',
    'United Arab Emirates': 'AE',
    'Saudi Arabia': 'SA',
  };
  
  return countryMap[country] || 'US';
}

// Get timezone from country code (simplified)
function getTimezone(countryCode: string, city: string): string {
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
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'BR': 'America/Sao_Paulo',
    'MX': 'America/Mexico_City',
  };
  return timezoneMap[countryCode] || 'UTC';
}

// Call OpenAI Responses API with web_search tool for real-time research
async function callOpenAIResponsesAPI(
  prompt: string,
  locationData: { city: string; area: string; country: string },
  maxOutputTokens: number = 16000
): Promise<{ content: string; sources: string[] }> {
  const countryCode = getCountryCode(locationData.country);
  const timezone = getTimezone(countryCode, locationData.city);
  
  console.log('🔍 Calling OpenAI Responses API with web_search tool...');
  console.log('Location context:', { 
    city: locationData.city, 
    region: locationData.area || locationData.city,
    country: countryCode,
    timezone 
  });

  const requestBody = {
    model: 'gpt-4o',
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
    max_output_tokens: maxOutputTokens,
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  console.log('Response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ OpenAI Responses API Error:', {
      status: response.status,
      error: errorData,
    });
    throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('✅ OpenAI Responses API Success');
  
  // Extract content and sources from the response
  let content = '';
  const sources: string[] = [];
  
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      // Handle web search results
      if (item.type === 'web_search_call') {
        console.log('📡 Web search performed:', item.action);
      }
      
      // Handle message content
      if (item.type === 'message' && item.content) {
        for (const contentItem of item.content) {
          if (contentItem.type === 'output_text') {
            content += contentItem.text;
            
            // Extract URL citations
            if (contentItem.annotations) {
              for (const annotation of contentItem.annotations) {
                if (annotation.type === 'url_citation' && annotation.url) {
                  sources.push(annotation.url);
                }
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`📚 Found ${sources.length} sources from web search`);
  
  return { content, sources: [...new Set(sources)] };
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

    // Format places list - these are OPTIONAL context, not the primary focus
    const placesListFormatted = places && places.length > 0 
      ? places.map(p => {
          const rating = p.rating ? ` (${p.rating}★` + (p.userRatingsTotal ? `, ${p.userRatingsTotal} reviews)` : ')') : '';
          return `- ${p.name}: ${p.type.join(', ')}${rating}`;
        }).join('\n')
      : '';

    const hasSelectedPlaces = places && places.length > 0;

    console.log('🚀 Starting comprehensive tour generation with web search...');
    console.log('Location:', locationData.streetName, locationData.city, locationData.country);
    console.log('User interests (subtle influence):', interests);
    console.log('Selected places (optional context):', hasSelectedPlaces ? places.length : 'None');

    // Build the comprehensive research prompt
    // KEY CHANGE: Interests and businesses are SUBTLE INFLUENCES, not the primary focus
    // PRIMARY FOCUS: Deep historical research on the street itself
    const researchPrompt = `You are a world-class historian and tour guide creating an immersive walking tour. Your PRIMARY mission is to research and present the COMPLETE HISTORY of ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

## YOUR RESEARCH MISSION

Search the web thoroughly to discover EVERYTHING about this street:

### 1. STREET ORIGINS & NAMING (Search for this)
- When was ${locationData.streetName} first established? What year?
- Why is it called "${locationData.streetName}"? Who or what was it named after?
- What was here BEFORE this street existed? What did the land look like?
- How has the street's name changed over time?

### 2. HISTORICAL TIMELINE (Search for this)
- What major historical events happened ON or NEAR this street?
- What famous people walked this street? Who lived here? Who died here?
- What buildings were built and demolished over the centuries?
- How did this street change during major historical periods (wars, revolutions, economic booms/busts)?
- What crimes, scandals, or tragedies occurred here?
- What celebrations, achievements, or moments of joy happened here?

### 3. ARCHITECTURAL HISTORY (Search for this)
- What are the oldest buildings on this street? When were they built?
- What architectural styles are represented? Victorian? Art Deco? Brutalist? Modern?
- Who were the architects? What were their stories?
- What buildings were demolished and why? What replaced them?
- Are there any hidden architectural details visitors should notice?

### 4. CULTURAL & SOCIAL HISTORY (Search for this)
- What role has this street played in the city's culture?
- What movements, protests, or cultural shifts happened here?
- What famous films, books, or songs feature this street?
- What local legends, ghost stories, or urban myths are associated with it?
- How has the neighborhood's demographics changed over time?

### 5. NOTABLE EVENTS & STORIES (Search for this)
- What specific events happened at specific addresses on this street?
- What businesses opened and closed? What were their stories?
- What famous visitors came to this street? What did they do here?
- What everyday life was like on this street in different eras?

## LOCATION DETAILS
- **Street**: ${locationData.streetName}
- **City**: ${locationData.city}
- **Country**: ${locationData.country}
- **Area/Neighborhood**: ${locationData.area || 'Not specified'}
- **Coordinates**: ${locationData.latitude}, ${locationData.longitude}

${hasSelectedPlaces ? `## PLACES THE USER NOTICED (Use as subtle context, NOT primary focus)
The user noticed these places while exploring. You may briefly mention them IF they have interesting historical connections, but do NOT structure the tour around them. The street's history is the star, not these businesses:
${placesListFormatted}` : ''}

## USER'S INTERESTS (Subtle flavor, NOT primary focus)
The user has these interests: ${interests.join(', ')}

When you encounter historical facts that naturally connect to these interests, you may highlight them slightly. But do NOT invent connections or force the narrative to match these interests. If the street's history doesn't naturally connect to their interests, that's fine - the authentic history is more valuable than forced relevance.

## OUTPUT FORMAT

Create a comprehensive, engaging walking tour narration (25-35 minutes of spoken content, approximately 4,000-5,500 words) structured as follows:

### OPENING (3-4 minutes)
Set the scene. Transport the listener back in time. What would they have seen on this street 100, 200, or 500 years ago? Make them feel the weight of history beneath their feet.

### HISTORICAL JOURNEY (15-20 minutes)
Walk the listener through the street's history chronologically or thematically. Include:
- Specific dates, names, and verifiable facts
- Vivid descriptions of what the street looked like in different eras
- Stories of real people who lived, worked, and died here
- Dramatic moments - the fires, the floods, the celebrations, the tragedies
- Architectural details they can still see today that connect to the past

### HIDDEN GEMS & SECRETS (5-7 minutes)
Share lesser-known facts, local legends, and details that only a true historian would know. Make the listener feel like an insider.

### CLOSING (2-3 minutes)
Reflect on how this street connects past to present. What stories does it still have to tell? What should the listener notice as they continue walking?

## CRITICAL REQUIREMENTS
1. **CITE SPECIFIC FACTS**: Include actual dates, names, and events you discover through web search
2. **BE HONEST**: If you cannot find information about something, say so rather than inventing
3. **PRIORITIZE AUTHENTICITY**: Real history is more interesting than fabricated connections to user interests
4. **USE VIVID LANGUAGE**: Paint pictures with words - help listeners SEE the history
5. **INCLUDE SOURCES**: Your research should be grounded in real historical records

Now, search the web thoroughly and create this comprehensive historical walking tour.`;

    // Execute the research with web search
    const { content: tourNarration, sources } = await callOpenAIResponsesAPI(
      researchPrompt,
      locationData,
      16000
    );

    if (!tourNarration || tourNarration.trim().length === 0) {
      throw new Error('Failed to generate tour content');
    }

    console.log('🎉 Tour generated successfully!');
    console.log('Content length:', tourNarration.length, 'characters');
    console.log('Sources used:', sources.length);

    // Generate tour ID
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract first meaningful line for description
    const lines = tourNarration.split('\n').filter(line => line.trim().length > 20);
    const description = lines[0]?.substring(0, 200) + '...' || `A comprehensive historical tour of ${locationData.streetName}`;

    // Estimate duration based on word count (average speaking rate: 150 words/minute)
    const wordCount = tourNarration.split(/\s+/).length;
    const estimatedMinutes = Math.round(wordCount / 150);

    const response: TourResponse = {
      tourId,
      narration: tourNarration,
      title: `${locationData.streetName}: A Historical Journey`,
      description,
      estimatedDuration: Math.max(20, Math.min(40, estimatedMinutes)),
      distance: '0.8 mi'
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Generate tour error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
