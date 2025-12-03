import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Perplexity Research Function for TourBud - DUAL QUERY VERSION
 * 
 * Runs two parallel queries:
 * 1. Area Research - Broader neighborhood/district context (30% of content)
 * 2. Street Research - Specific street history and details (70% of content)
 * 
 * Both queries research through the LENS of user's selected interests.
 * Uses highly-reviewed nearby places internally to understand what's important,
 * but doesn't mention review counts in the output.
 * 
 * API Reference: https://docs.perplexity.ai/
 */

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface Place {
  name: string;
  type: string[];
  address: string;
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
}

interface ResearchRequest {
  locationData: {
    latitude: number;
    longitude: number;
    streetName: string;
    plusCode: string;
    area: string;
    city: string;
    country: string;
    formattedAddress?: string;
  };
  places: Place[];  // User-selected places to focus on
  nearbyPlaces?: Place[];  // Other interesting places nearby (for "While You're Here" section)
  interests: string[];
  userId?: string;
}

interface TourResponse {
  tourId: string;
  narration: string;
  title: string;
  description: string;
  estimatedDuration: number;
  distance: string;
  sources: string[];
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
  id?: string;
}

// Helper to format interests for prompts
function formatInterests(interests: string[]): string {
  if (interests.length === 0) return "general history and culture";
  if (interests.length === 1) return interests[0];
  if (interests.length === 2) return `${interests[0]} and ${interests[1]}`;
  return `${interests.slice(0, -1).join(', ')}, and ${interests[interests.length - 1]}`;
}

// Helper to create interest-focused lens description
function createInterestLens(interests: string[]): string {
  const lensDescriptions: { [key: string]: string } = {
    'history': 'historical events, timelines, and how the past shaped this place',
    'architecture': 'buildings, architectural styles, construction history, and notable structures',
    'art': 'artistic movements, galleries, street art, public installations, and creative history',
    'culture': 'local traditions, cultural practices, community identity, and social fabric',
    'politics': 'political history, governance, protests, elections, and civic movements',
    'religion': 'religious institutions, spiritual history, places of worship, and faith communities',
    'crime': 'criminal history, infamous incidents, law enforcement, and notable cases',
    'war': 'military history, conflicts, wartime events, memorials, and defense',
    'economy': 'economic development, trade history, industries, and financial significance',
    'business': 'commerce, notable companies, entrepreneurs, and business landmarks',
    'innovation': 'inventions, technological advances, pioneers, and scientific breakthroughs',
    'nature': 'natural features, parks, environmental history, and green spaces',
    'literature': 'authors, literary connections, bookshops, and written works set here',
    'music': 'musical history, venues, artists, recordings, and sonic heritage',
    'film-tv': 'filming locations, productions shot here, celebrity connections, and media history',
    'design': 'design history, notable designers, aesthetic movements, and visual culture',
    'food': 'culinary history, food traditions, notable restaurants, and gastronomic culture',
    'legends': 'myths, folklore, local legends, ghost stories, and mysterious tales',
    'science': 'scientific discoveries, research institutions, and notable scientists',
    'fashion': 'fashion history, designers, boutiques, and style movements'
  };

  const descriptions = interests.map(i => lensDescriptions[i] || i);
  return descriptions.join('; ');
}

// Make a single Perplexity API call
async function callPerplexity(systemPrompt: string, userPrompt: string, maxTokens: number = 4000): Promise<PerplexityResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      search_recency_filter: 'month',
      return_citations: true,
      return_related_questions: false,
      web_search_options: {
        search_context_size: 'high'
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Perplexity API error (${response.status}): ${errorData.error?.message || JSON.stringify(errorData)}`);
  }

  return await response.json();
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

    if (!PERPLEXITY_API_KEY) {
      throw new Error('Missing PERPLEXITY_API_KEY');
    }

    const { locationData, places, nearbyPlaces, interests, userId } = await req.json() as ResearchRequest;

    if (!locationData || !interests || interests.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    console.log('🔍 Starting DUAL-QUERY Perplexity research');
    console.log(`📍 Location: ${locationData.streetName}, ${locationData.area || locationData.city}`);
    console.log(`🎯 Interests (THE LENS): ${interests.join(', ')}`);
    console.log(`⭐ Selected places: ${places?.length || 0}`);
    console.log(`📍 Nearby places: ${nearbyPlaces?.length || 0}`);

    const interestLens = createInterestLens(interests);
    const formattedInterests = formatInterests(interests);
    const areaName = locationData.area || locationData.city;

    // Get important places (high review count = locally significant)
    // We use this internally but DON'T mention review counts in output
    const importantPlaces = [...(places || []), ...(nearbyPlaces || [])]
      .filter(p => p.userRatingsTotal && p.userRatingsTotal > 50)
      .sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0))
      .slice(0, 12);

    // Build selected places list for the street prompt
    const selectedPlacesList = places && places.length > 0
      ? places.map((p, i) => `${i + 1}. **${p.name}** - ${p.address}`).join('\n')
      : null;

    // Build nearby places list for "While You're Here" section (no review counts!)
    const nearbyPlacesList = nearbyPlaces && nearbyPlaces.length > 0
      ? nearbyPlaces.slice(0, 10).map(p => `- ${p.name}`).join('\n')
      : null;

    // Important places for context (names only, no review counts)
    const importantPlacesContext = importantPlaces.length > 0
      ? importantPlaces.map(p => `- ${p.name}`).join('\n')
      : '';

    // ========================================
    // QUERY 1: AREA RESEARCH (30% of content)
    // ========================================
    const areaSystemPrompt = `You are a knowledgeable local historian who knows ${locationData.city} and its neighborhoods intimately.

YOUR RESEARCH LENS: ${formattedInterests}
Focus on: ${interestLens}

SEARCH STRATEGY - THIS IS CRITICAL:
- Search for "interesting facts ${areaName} ${locationData.city}"
- Search for "history ${areaName} ${locationData.city}"
- Search for "${areaName} ${locationData.city} landmarks"
- Search for "${areaName} historical sites"
- Search for notable places, buildings, people connected to this area

ABSOLUTE RULES:
1. NEVER say "I couldn't find information" or "I must be transparent about limitations"
2. NEVER give research advice ("you should check archives", "local historians would know")
3. NEVER add disclaimers about what you can or cannot verify
4. NEVER mention reviews, ratings, or popularity metrics
5. Just share what you find - no meta-commentary

Write like a knowledgeable friend who LIVES here and knows the stories.`;

    const areaUserPrompt = `Research **${areaName}** in ${locationData.city}, ${locationData.country}.

Search for: "interesting facts ${areaName} ${locationData.city}", "history ${areaName}", "${areaName} landmarks", "${areaName} historical sites"

Your focus lens: ${formattedInterests}

The user is visiting ${locationData.streetName} in this area.

${importantPlacesContext ? `NOTABLE PLACES IN THIS AREA (research these for context):\n${importantPlacesContext}\n\nThese are significant local spots - find out WHY they matter.` : ''}

## About ${areaName}

Write 800-1500 words covering:

1. **What is ${areaName}?** - Introduction to this area. When was it established? What defines it?

2. **History & Development** - How did this area develop? Key dates, founding stories, notable events. Tell it through the lens of ${formattedInterests}.

3. **Notable Landmarks & Sites** - What is this area famous for? Historic buildings, parks, monuments, interesting places. Research the notable places listed above.

4. **${formattedInterests} Significance** - Specific ${formattedInterests} connections - events, people, stories related to this area.

5. **Character & Culture** - What's the vibe? What would someone notice? What's the community like?

RULES:
- Write substantive, researched content (800-1500 words)
- Use **bold** for key facts, dates, names, place names
- Include specific dates, names, and facts you find
- NO disclaimers, NO "I couldn't find", NO research advice
- NO mentions of reviews or ratings
- Just share interesting information`;

    // ========================================
    // QUERY 2: STREET RESEARCH (70% of content)
    // ========================================
    const streetSystemPrompt = `You are a knowledgeable local who knows ${locationData.city} well. You're telling a friend about a street they're visiting.

YOUR RESEARCH LENS: ${formattedInterests}
Focus on: ${interestLens}

SEARCH STRATEGY - THIS IS CRITICAL:
- Search for "${locationData.streetName} ${locationData.city}"
- Search for "${locationData.streetName} ${areaName} history"
- Search for each specific place by name
- Search for "interesting facts ${areaName} ${locationData.city}"
- If the street itself is obscure, focus on the area and specific places

ABSOLUTE RULES:
1. NEVER say "I couldn't find information" or "I must be transparent"
2. NEVER give research advice ("check local archives", "municipal records")
3. NEVER add disclaimers or caveats about your research
4. NEVER mention reviews, ratings, or how popular something is
5. Just share what you find - be helpful, not apologetic

Write like a local friend sharing what they know.`;

    const streetUserPrompt = `Research **${locationData.streetName}** in ${areaName}, ${locationData.city}, ${locationData.country}.

Search for: "${locationData.streetName} ${locationData.city}", "${locationData.streetName} history", and each place listed below by name.

Your focus lens: ${formattedInterests}

${selectedPlacesList ? `
THE USER SELECTED THESE PLACES - RESEARCH EACH ONE IN DEPTH:
${selectedPlacesList}

For each selected place, search and find:
- What is it? When was it established?
- History and background
- What it's known for
- Any interesting stories or facts
- Connection to ${formattedInterests}
` : `
NOTABLE PLACES NEARBY (research these):
${importantPlacesContext || 'Research what notable places exist on or near this street.'}
`}

## ${locationData.streetName}

Write 1200-2000 words covering:

1. **The Street** - What do we know about ${locationData.streetName}? Origins, naming, when it was established, how it developed.

2. ${selectedPlacesList ? '**Selected Places** - Deep dive into each place the user selected. Research each one thoroughly.' : '**Notable Places** - What interesting places are on or near this street?'}

3. **Street Character** - What would someone notice walking here? Architecture, feel, activity?

4. **${formattedInterests} Connections** - Any ${formattedInterests}-related history, events, or significance for this street?

5. **Stories & Details** - Interesting facts, historical events, notable people connected to this street.

RULES:
- Write substantial content (1200-2000 words)
- Use **bold** for place names, dates, key facts
- Include specific details you find through research
- NO disclaimers, NO "I couldn't verify", NO research advice
- NO mentions of reviews or ratings
- Be informative and engaging`;

    // ========================================
    // RUN BOTH QUERIES IN PARALLEL
    // ========================================
    console.log('🚀 Running PARALLEL queries (area + street)...');
    const startTime = Date.now();

    const [areaResponse, streetResponse] = await Promise.all([
      callPerplexity(areaSystemPrompt, areaUserPrompt, 3000),
      callPerplexity(streetSystemPrompt, streetUserPrompt, 5000)
    ]);

    const queryTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Both queries completed in ${queryTime}s`);

    // Extract content and citations
    const areaContent = areaResponse.choices[0]?.message?.content || '';
    const streetContent = streetResponse.choices[0]?.message?.content || '';
    const areaCitations = areaResponse.citations || [];
    const streetCitations = streetResponse.citations || [];

    // ========================================
    // BUILD "WHILE YOU'RE HERE" SECTION
    // ========================================
    let whileYoureHere = '';
    if (nearbyPlacesList && nearbyPlaces && nearbyPlaces.length > 0) {
      whileYoureHere = `

## While You're Here...

As you walk ${locationData.streetName}, you'll pass some places worth noting:

${nearbyPlaces.slice(0, 8).map(p => {
        const typeStr = p.type.filter(t => !t.includes('establishment') && !t.includes('point_of_interest')).slice(0, 2).join(', ');
        return `- **${p.name}**${typeStr ? ` (${typeStr})` : ''} - ${p.address}`;
      }).join('\n')}

These aren't the main focus of today's tour, but you might enjoy exploring them.`;
    }

    // ========================================
    // COMBINE INTO FINAL TOUR
    // ========================================
    const combinedNarration = `${areaContent}

---

${streetContent}${whileYoureHere}`;

    // Combine citations (deduplicated)
    const allCitations = [...new Set([...areaCitations, ...streetCitations])];

    // Generate tour metadata
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wordCount = combinedNarration.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount / 150);

    const title = `${locationData.streetName}, ${areaName}`;
    const description = `A ${formattedInterests}-focused tour of ${locationData.streetName} in ${areaName}, ${locationData.city}. ${estimatedDuration} min read.`;

    console.log(`📝 Combined tour: ${wordCount} words, ${estimatedDuration} min`);
    console.log(`📚 Sources: ${allCitations.length} citations`);

    // Save to database if available
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        await supabase.from('deep_research_jobs').insert({
          research_id: tourId,
          openai_response_id: `perplexity_dual_${areaResponse.id || Date.now()}_${streetResponse.id || Date.now()}`,
          status: 'completed',
          location_data: locationData,
          places: places || [],
          interests: interests,
          user_id: userId || null,
          tour_id: tourId,
          narration: combinedNarration,
          sources: allCitations,
          word_count: wordCount,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });

        console.log('💾 Research saved to database');
      } catch (dbError) {
        console.warn('⚠️ Could not save to database:', dbError.message);
      }
    }

    const tourResponse: TourResponse = {
      tourId,
      narration: combinedNarration,
      title,
      description,
      estimatedDuration,
      distance: '~1 km',
      sources: allCitations,
    };

    console.log(`✨ DUAL-QUERY tour complete: ${wordCount} words, ${allCitations.length} sources`);

    return new Response(
      JSON.stringify(tourResponse),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Perplexity dual-query research error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
