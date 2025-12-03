import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Perplexity Research Function for TourBud - 5-QUERY APPROACH
 * 
 * Runs up to 5 focused, parallel searches:
 * 1. INTERESTS × AREA - User's interests applied to the area
 * 2. SELECTED PLACES - Research each place the user selected
 * 3. AREA GENERAL - General history, no specific places
 * 4. STREET SPECIFIC - Research the specific street
 * 5. NOTABLE PLACES - Research highly-reviewed places near the street
 * 
 * Then combines all results into one comprehensive tour.
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
  places: Place[];
  nearbyPlaces?: Place[];
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

// Simple, focused Perplexity search
async function perplexitySearch(query: string, maxTokens: number = 2000): Promise<PerplexityResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        {
          role: 'system',
          content: `You are a research assistant. Search the web and provide detailed, factual information. Include specific dates, names, and facts. Use citations [1], [2], etc. for sources. Never say "I couldn't find information" - just share what you do find.`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.5,
      return_citations: true,
      web_search_options: {
        search_context_size: 'high'
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Perplexity error: ${errorData.error?.message || response.status}`);
  }

  return await response.json();
}

// Format interests for search
function formatInterestsForSearch(interests: string[]): string {
  return interests.join(' ');
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

    const areaName = locationData.area || locationData.city;
    const streetName = locationData.streetName;
    const city = locationData.city;
    const country = locationData.country;
    const interestsText = formatInterestsForSearch(interests);

    console.log('🔍 Starting 5-QUERY research approach');
    console.log(`📍 Street: ${streetName}`);
    console.log(`📍 Area: ${areaName}, ${city}, ${country}`);
    console.log(`🎯 Interests: ${interests.join(', ')}`);
    console.log(`⭐ Selected places: ${places?.length || 0}`);

    const startTime = Date.now();

    // ========================================
    // BUILD THE 4 FOCUSED QUERIES
    // ========================================

    // Query 1: INTERESTS × AREA
    const query1 = `${interestsText} ${areaName} ${city} ${country}

Tell me about ${interestsText} in ${areaName}, ${city}. What ${interests.join(' and ')} history, events, or significance does this area have? Include specific dates, names, and facts.`;

    // Query 2: SELECTED PLACES (if any)
    const selectedPlacesNames = places?.map(p => p.name) || [];
    const query2 = selectedPlacesNames.length > 0
      ? `Research these places in ${areaName}, ${city}, ${country}:

${selectedPlacesNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

For each place, find: What is it? When was it established? What's it known for? Any interesting history or stories? Be specific with facts and dates.`
      : null;

    // Query 3: AREA GENERAL (history only, no specific places)
    const query3 = `${areaName} ${city} ${country} history origin development

Tell me about the history of ${areaName} in ${city}, ${country}. Include:
- When was this area established? By whom?
- How did it develop over time?
- What is this neighborhood/suburb known for?
- What's the character of this area?
- Any interesting historical facts or events?

Focus on GENERAL HISTORY, not specific places or landmarks. Be comprehensive with dates and facts.`;

    // Query 4: STREET SPECIFIC (include nearby places for context)
    // Get notable places that are actually on/near the street
    const streetPlacesList = nearbyPlaces && nearbyPlaces.length > 0
      ? nearbyPlaces.slice(0, 6).map(p => p.name).join(', ')
      : '';
    
    const streetPlacesContext = streetPlacesList 
      ? `\n\nNotable places on or near this street include: ${streetPlacesList}. If you find information about any of these, include it.`
      : '';

    const query4 = `${streetName} ${areaName} ${city} ${country}

What can you tell me about ${streetName} in ${areaName}, ${city}? Include:
- Origin of the street name (if known)
- When was it established?
- Notable buildings or landmarks ON this street
- Any historical events or famous people connected to this street
- What is the character of this street?${streetPlacesContext}

Share whatever you can find about this specific street.`;

    // Query 5: NOTABLE PLACES (high review count = important/popular)
    // Filter nearbyPlaces to only highly-reviewed ones (100+ reviews)
    // Exclude user-selected places (they're covered in Query 2)
    const selectedPlaceIds = new Set(places?.map(p => p.placeId) || []);
    const notablePlaces = nearbyPlaces
      ?.filter(p => !selectedPlaceIds.has(p.placeId)) // Not already selected
      .filter(p => p.userRatingsTotal && p.userRatingsTotal >= 100) // High review count
      .sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0)) // Most reviewed first
      .slice(0, 5) || []; // Top 5 notable places

    const notablePlacesNames = notablePlaces.map(p => p.name);
    const query5 = notablePlacesNames.length > 0
      ? `Research these notable places near ${streetName} in ${areaName}, ${city}, ${country}:

${notablePlacesNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

For each place, tell me:
- What is it and what's it known for?
- When was it established?
- Any interesting history, stories, or facts?
- Why is it significant to this area?

Be specific with dates, names, and facts.`
      : null;

    console.log(`🏛️ Notable places (100+ reviews): ${notablePlacesNames.length > 0 ? notablePlacesNames.join(', ') : 'none found'}`);

    // ========================================
    // RUN ALL QUERIES IN PARALLEL
    // ========================================
    console.log('🚀 Running parallel searches...');

    const queries = [
      { name: 'Interests × Area', query: query1, tokens: 2500 },
      query2 ? { name: 'Selected Places', query: query2, tokens: 3000 } : null,
      { name: 'Area General', query: query3, tokens: 2500 },
      { name: 'Street Specific', query: query4, tokens: 2000 },
      query5 ? { name: 'Notable Places', query: query5, tokens: 3000 } : null
    ].filter(Boolean) as { name: string; query: string; tokens: number }[];

    const results = await Promise.all(
      queries.map(async (q) => {
        try {
          console.log(`  🔎 Searching: ${q.name}`);
          const result = await perplexitySearch(q.query, q.tokens);
          console.log(`  ✅ ${q.name} complete`);
          return {
            name: q.name,
            content: result.choices[0]?.message?.content || '',
            citations: result.citations || []
          };
        } catch (error) {
          console.error(`  ❌ ${q.name} failed:`, error.message);
          return { name: q.name, content: '', citations: [] };
        }
      })
    );

    const queryTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ All queries completed in ${queryTime}s`);

    // ========================================
    // COMBINE RESULTS INTO TOUR
    // ========================================
    
    // Find each result
    const interestsResult = results.find(r => r.name === 'Interests × Area');
    const placesResult = results.find(r => r.name === 'Selected Places');
    const areaResult = results.find(r => r.name === 'Area General');
    const streetResult = results.find(r => r.name === 'Street Specific');
    const notableResult = results.find(r => r.name === 'Notable Places');

    // Collect all citations
    const allCitations = [...new Set([
      ...(interestsResult?.citations || []),
      ...(placesResult?.citations || []),
      ...(areaResult?.citations || []),
      ...(streetResult?.citations || []),
      ...(notableResult?.citations || [])
    ])];

    // Build the combined tour narrative
    let combinedNarration = `## About ${areaName}

${areaResult?.content || `${areaName} is a neighborhood in ${city}, ${country}.`}

---

## ${interests.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' & ')} in ${areaName}

${interestsResult?.content || `Information about ${interests.join(' and ')} in this area.`}`;

    // Add street section FIRST (before selected places)
    combinedNarration += `

---

## ${streetName}

${streetResult?.content || `${streetName} is a street in ${areaName}, ${city}.`}`;

    // Add selected places section AFTER street (these are places ON the street)
    if (placesResult?.content) {
      combinedNarration += `

---

## Your Selected Places

${placesResult.content}`;
    }

    // Add notable places section (highly-reviewed places near the street)
    if (notableResult?.content) {
      combinedNarration += `

---

## Notable Places Nearby

${notableResult.content}`;
    }

    // Add "While You're Here" section for remaining places (not selected, not notable)
    const notablePlaceIds = new Set(notablePlaces.map(p => p.placeId));
    const remainingPlaces = nearbyPlaces
      ?.filter(p => !selectedPlaceIds.has(p.placeId)) // Not selected
      .filter(p => !notablePlaceIds.has(p.placeId)) // Not already in notable section
      .slice(0, 6) || [];

    if (remainingPlaces.length > 0) {
      const nearbyList = remainingPlaces.map(p => {
        const typeStr = p.type.filter(t => !t.includes('establishment') && !t.includes('point_of_interest')).slice(0, 2).join(', ');
        return `- **${p.name}**${typeStr ? ` (${typeStr})` : ''}`;
      }).join('\n');

      combinedNarration += `

---

## While You're Here...

Other places nearby you might want to explore:

${nearbyList}`;
    }

    // Generate tour metadata
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const wordCount = combinedNarration.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount / 150);
    
    // Format interests with proper title case
    const formatInterest = (interest: string) => {
      return interest.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };
    const formattedInterests = interests.map(formatInterest).join(' & ');

    // Random creative title templates
    const titleTemplates = [
      `${streetName} Uncovered`,
      `Discovering ${streetName}`,
      `The Story of ${streetName}`,
      `${streetName}: A Journey`,
      `Walking ${streetName}`,
      `${streetName} Revealed`,
      `Secrets of ${streetName}`,
      `${streetName}: Past & Present`,
      `Exploring ${streetName}`,
      `${streetName} Chronicles`,
      `Tales from ${streetName}`,
      `${streetName}: Hidden History`,
      `Journey Through ${streetName}`,
      `${streetName} Explored`,
      `Legends of ${streetName}`,
      `${streetName}: Untold Stories`,
      `Inside ${streetName}`,
      `${streetName}: A Discovery`,
      `Mysteries of ${streetName}`,
      `${streetName}: Then & Now`
    ];
    const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
    const description = `A ${formattedInterests}-focused tour of ${streetName} in ${areaName}.`;
    
    console.log(`📝 Tour generated: ${wordCount} words, ${estimatedDuration} min, ${allCitations.length} sources`);

    // Save to database
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('deep_research_jobs').insert({
          research_id: tourId,
          openai_response_id: `perplexity_5query_${Date.now()}`,
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
        console.log('💾 Saved to database');
      } catch (dbError) {
        console.warn('⚠️ Database save failed:', dbError.message);
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

    console.log(`✨ 5-QUERY tour complete!`);

    return new Response(
      JSON.stringify(tourResponse),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Research error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
