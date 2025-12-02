import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface StartResearchRequest {
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
  userId?: string;
}

interface StartResearchResponse {
  researchId: string;
  responseId: string;
  status: 'queued' | 'in_progress';
  estimatedMinutes: number;
  message: string;
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
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'BR': 'America/Sao_Paulo',
    'MX': 'America/Mexico_City',
  };
  return timezoneMap[countryCode] || 'UTC';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
      throw new Error('Missing OPENAI_API_KEY');
    }

    const { locationData, places, interests, userId } = await req.json() as StartResearchRequest;

    if (!locationData || !interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const hasSelectedPlaces = places && places.length > 0;
    const placesContext = hasSelectedPlaces
      ? places.map(p => `- ${p.name}: ${p.type.join(', ')}`).join('\n')
      : '';

    const countryCode = getCountryCode(locationData.country);
    const timezone = getTimezone(countryCode);

    console.log('🚀 Starting o3-deep-research in background mode...');
    console.log('Location:', locationData.streetName, locationData.city, locationData.country);

    // Build the comprehensive deep research prompt
    const researchPrompt = `You are conducting deep historical research on ${locationData.streetName} in ${locationData.city}, ${locationData.country}. Your mission is to create the most comprehensive, well-researched walking tour ever produced for this street.

## RESEARCH OBJECTIVES

Use web search extensively to discover EVERYTHING about this street. Search for multiple queries, open pages, and dig deep into sources. This is deep research - take your time and be thorough.

### 1. STREET ORIGINS & ETYMOLOGY
Search for: "${locationData.streetName} ${locationData.city} history origin name etymology"
- When was this street first established? What year exactly?
- Why is it named "${locationData.streetName}"? Who or what was it named after?
- Has the name changed over time? What were previous names?
- What existed on this land before the street was built?

### 2. COMPREHENSIVE HISTORICAL TIMELINE
Search for: "${locationData.streetName} ${locationData.city} historical events timeline"
Search for: "${locationData.streetName} ${locationData.city} 19th century history"
Search for: "${locationData.streetName} ${locationData.city} 20th century history"
- Create a detailed timeline of major events on this street
- What happened here during major historical periods?
- Wars, revolutions, economic events that affected this street
- Fires, floods, disasters, reconstructions

### 3. NOTABLE PEOPLE & RESIDENTS
Search for: "${locationData.streetName} ${locationData.city} famous residents notable people"
Search for: "${locationData.streetName} ${locationData.city} historical figures"
- Who lived on this street? Politicians, artists, writers, scientists?
- Who died here? Any famous deaths or events?
- Who visited this street and why?
- What businesses did notable people operate here?

### 4. ARCHITECTURAL HISTORY
Search for: "${locationData.streetName} ${locationData.city} architecture buildings history"
Search for: "${locationData.streetName} ${locationData.city} oldest buildings landmarks"
- What are the oldest surviving buildings?
- What architectural styles are represented?
- Who were the architects?
- What buildings were demolished and why?
- Any hidden architectural details visitors should notice?

### 5. CULTURAL & SOCIAL HISTORY
Search for: "${locationData.streetName} ${locationData.city} culture community history"
Search for: "${locationData.streetName} ${locationData.city} neighborhood demographics"
- How has the neighborhood changed demographically?
- What cultural movements originated or flourished here?
- What role does this street play in the city's cultural life?
- Any protests, celebrations, or significant gatherings?

### 6. FILM, LITERATURE & MEDIA
Search for: "${locationData.streetName} ${locationData.city} movies films TV shows"
Search for: "${locationData.streetName} ${locationData.city} books novels literature"
- What films or TV shows were filmed here?
- What books mention or are set on this street?
- Any famous photographs or artworks depicting this street?

### 7. LOCAL LEGENDS & HIDDEN STORIES
Search for: "${locationData.streetName} ${locationData.city} legends stories secrets"
Search for: "${locationData.streetName} ${locationData.city} ghost stories haunted"
- Any urban legends or local myths?
- Hidden passages, secret rooms, underground tunnels?
- Unusual historical facts that would surprise visitors?

### 8. RECENT HISTORY & CURRENT SIGNIFICANCE
Search for: "${locationData.streetName} ${locationData.city} recent news developments"
- How has the street changed in recent decades?
- Any recent renovations or preservation efforts?
- What is the street known for today?

## LOCATION DETAILS
- **Street**: ${locationData.streetName}
- **City**: ${locationData.city}
- **Country**: ${locationData.country}
- **Area/Neighborhood**: ${locationData.area || 'Not specified'}
- **Coordinates**: ${locationData.latitude}, ${locationData.longitude}

${hasSelectedPlaces ? `## PLACES USER NOTICED (Context only - NOT the focus)
The user noticed these places. If any have historical significance, mention them briefly:
${placesContext}` : ''}

## USER INTERESTS (Subtle influence only)
User interests: ${interests.join(', ')}
Only highlight historical facts that NATURALLY connect to these interests. Do NOT force connections.

## OUTPUT FORMAT

After completing your research, create a comprehensive walking tour narration (30-45 minutes of spoken content, approximately 5,000-7,000 words) structured as:

### GRAND OPENING (5-6 minutes)
Transport listeners to this street's past. What would they see 100, 200, or 500 years ago? Set the historical stage with vivid imagery.

### HISTORICAL JOURNEY (20-25 minutes)
Walk through the street's history chronologically or thematically:
- Cite specific dates, names, and events from your research
- Describe what the street looked like in different eras
- Share stories of real people who lived and worked here
- Include dramatic moments - triumphs and tragedies

### ARCHITECTURAL EXPLORATION (5-7 minutes)
Guide visitors to notice:
- Specific buildings and their histories
- Architectural details they can still see today
- What's hidden in plain sight

### HIDDEN GEMS & SECRETS (5-7 minutes)
Share the insider knowledge:
- Lesser-known facts that even locals don't know
- Local legends and stories
- Secret spots and hidden details

### POWERFUL CLOSING (3-4 minutes)
Connect past to present. What stories does this street still tell? What should visitors notice as they continue walking?

## CRITICAL REQUIREMENTS
1. **CITE SOURCES**: Include specific facts, dates, and names you discovered
2. **BE ACCURATE**: Only include information you found through research
3. **BE HONEST**: If you couldn't find information about something, acknowledge it
4. **BE VIVID**: Paint pictures with words - help listeners SEE the history
5. **PRIORITIZE AUTHENTICITY**: Real history over forced connections to user interests

Now conduct your deep research and create this comprehensive historical walking tour.`;

    // Start the deep research in background mode using OpenAI Responses API
    const requestBody = {
      model: 'o3-deep-research',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: researchPrompt
            }
          ]
        }
      ],
      reasoning: {
        summary: 'auto'  // Get automatic summaries of reasoning steps
      },
      background: true,  // Enable background mode for long-running research
      store: true,       // Required for background mode
      tools: [
        {
          type: 'web_search_preview'  // Deep research requires web_search_preview
        }
      ],
      max_output_tokens: 12000, // keep within TPM limit to avoid rate-limit spikes
    };

    console.log('📤 Sending request to OpenAI o3-deep-research...');

    const maxAttempts = 5;
    let attempt = 0;
    let data: any = null;

    while (attempt < maxAttempts) {
      attempt += 1;
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      const errorData = await response.json();
      const errorMessage = errorData.error?.message || 'Unknown error';
      const errorType = errorData.error?.type || 'unknown_error';

      console.error(`❌ OpenAI API Error (attempt ${attempt}):`, errorData);

      // Handle rate limit retries with exponential backoff
      if (response.status === 429 && attempt < maxAttempts) {
        // Try to parse retry-after from header or error message
        const retryAfterHeader = response.headers.get('retry-after');
        const retryMatch = errorMessage.match(/try again in ([\d.]+)s/i);
        const retrySeconds = retryAfterHeader
          ? parseFloat(retryAfterHeader)
          : retryMatch
            ? parseFloat(retryMatch[1])
            : 2 * attempt; // fallback exponential backoff

        const waitMs = Math.max(1000, Math.min(10000, retrySeconds * 1000));
        console.warn(`⏳ Rate limited (tokens). Waiting ${waitMs}ms before retry...`);
        await delay(waitMs);
        continue;
      }

      throw new Error(`OpenAI API error (${response.status}): ${errorMessage} [${errorType}]`);
    }

    if (!data) {
      throw new Error('Failed to start deep research after multiple attempts. Please try again.');
    }
    console.log('✅ Deep research started successfully!');
    console.log('Response ID:', data.id);
    console.log('Status:', data.status);

    // Generate a unique research ID for our tracking
    const researchId = `research_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the research job in Supabase for tracking
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        await supabase.from('deep_research_jobs').insert({
          research_id: researchId,
          openai_response_id: data.id,
          status: data.status,
          location_data: locationData,
          places: places || [],
          interests: interests,
          user_id: userId || null,
          created_at: new Date().toISOString(),
        });
        
        console.log('📝 Research job saved to database');
      } catch (dbError) {
        console.warn('⚠️ Could not save to database (table may not exist):', dbError.message);
        // Continue anyway - the response ID is what matters
      }
    }

    const responseData: StartResearchResponse = {
      researchId: researchId,
      responseId: data.id,
      status: data.status,
      estimatedMinutes: 5, // Deep research typically takes 3-10 minutes
      message: `Deep research started! The AI is now conducting comprehensive historical research on ${locationData.streetName}. This typically takes 3-10 minutes. Use the response ID to check status.`
    };

    return new Response(
      JSON.stringify(responseData),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Start deep research error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

