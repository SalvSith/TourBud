import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Perplexity Research Function for TourBud
 * 
 * Uses Perplexity's Sonar API for comprehensive historical research.
 * Perplexity is specifically designed for web-grounded research with citations.
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
  };
  places: Place[];  // User-selected places to focus on
  nearbyPlaces?: Place[];  // Other interesting places nearby (not selected but worth mentioning)
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

// Helper to get country code for regional search
function getCountryCode(country: string): string {
  const countryMap: { [key: string]: string } = {
    'United States': 'US', 'United Kingdom': 'GB', 'Canada': 'CA',
    'Australia': 'AU', 'Germany': 'DE', 'France': 'FR', 'Italy': 'IT',
    'Spain': 'ES', 'Japan': 'JP', 'China': 'CN', 'India': 'IN',
    'Brazil': 'BR', 'Mexico': 'MX', 'Netherlands': 'NL', 'Sweden': 'SE',
    'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Switzerland': 'CH',
    'Austria': 'AT', 'Belgium': 'BE', 'Ireland': 'IE', 'Portugal': 'PT',
    'Greece': 'GR', 'Poland': 'PL', 'South Korea': 'KR', 'Singapore': 'SG',
    'New Zealand': 'NZ', 'South Africa': 'ZA', 'Argentina': 'AR',
    'Israel': 'IL', 'United Arab Emirates': 'AE',
  };
  return countryMap[country] || 'US';
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

    const countryCode = getCountryCode(locationData.country);
    
    // Combine selected places and nearby places into one list
    // Selected places come first (user prioritized these)
    const allPlaces: Place[] = [];
    const seenPlaceIds = new Set<string>();
    
    // Add selected places first (these are prioritized)
    if (places && places.length > 0) {
      for (const place of places) {
        if (!seenPlaceIds.has(place.placeId)) {
          allPlaces.push(place);
          seenPlaceIds.add(place.placeId);
        }
      }
    }
    
    // Add nearby places (if not already in selected)
    if (nearbyPlaces && nearbyPlaces.length > 0) {
      for (const place of nearbyPlaces) {
        if (!seenPlaceIds.has(place.placeId)) {
          allPlaces.push(place);
          seenPlaceIds.add(place.placeId);
        }
      }
    }
    
    const hasPlaces = allPlaces.length > 0;
    const selectedCount = places?.length || 0;

    console.log('🔍 Starting Perplexity research for:', locationData.streetName, locationData.city);
    console.log(`📍 Total places to research: ${allPlaces.length} (${selectedCount} selected, ${allPlaces.length - selectedCount} nearby)`);

    // Build combined places list for the prompt
    const allPlacesListForPrompt = hasPlaces
      ? allPlaces.map((p, i) => {
          const isSelected = places?.some(sp => sp.placeId === p.placeId);
          const priority = isSelected ? '⭐' : ''; // Mark selected places
          return `${i + 1}. ${priority}**${p.name}** (${p.type.slice(0, 2).join(', ')}) - ${p.address}`;
        }).join('\n')
      : 'No places found nearby';

    // Build research prompt - ALWAYS provide value, never give up
    const systemPrompt = `You are a researcher helping someone learn about a location they're visiting. Your job is to find and share interesting, relevant information.

IMPORTANT RULES:
1. ALWAYS PROVIDE VALUE - Never say "I couldn't find information" and leave it at that
2. RESEARCH CREATIVELY - If you can't find info on the exact street, research the neighborhood, area, city district, or nearby landmarks
3. RESEARCH THE PLACES - Search for each place by name. Most businesses have some online presence, reviews, or mentions
4. EXPAND CONTEXT - If a street is obscure, tell them about the broader area they're in
5. BE USEFUL - The user is there RIGHT NOW. Give them something interesting to know
6. NO CLICHÉS - This is text to read, not an audio tour. No "look here" or "notice that"

NEVER:
- Say "I don't have information" without providing alternatives
- Give up on researching the listed places
- Return a mostly empty response
- Be overly cautious - share what you find`;

    const userPrompt = `Research this location and the places listed. Provide useful, interesting information.

**LOCATION:**
- Street: ${locationData.streetName}
- Area: ${locationData.area || 'Not specified'}  
- City: ${locationData.city}
- Country: ${locationData.country}
- Coordinates: ${locationData.latitude}, ${locationData.longitude}

${hasPlaces ? `**PLACES TO RESEARCH:**
${allPlacesListForPrompt}

${selectedCount > 0 ? `(⭐ = places the user specifically selected - give these extra detail)` : ''}

For each place, search and find:
- What type of place is it? What do they offer?
- Any reviews, mentions, or articles about it?
- When was it established (if findable)?
- What's it known for?
- Any interesting facts or history?` : ''}

**User interests:** ${interests.join(', ')}

---

**WRITE ABOUT:**

1. **This Location** - Brief intro: What is ${locationData.streetName} in ${locationData.area || locationData.city}? Set the scene.

2. **Places Here** - ${hasPlaces ? `Research and write about each place listed above. Give more detail to ⭐ starred places (user selected these). For each place include what it is, any history, what people say about it.` : 'What notable places exist in this area?'}

3. **About ${locationData.area || 'the Area'}** - History and character of this neighborhood/district. What's it known for? How has it developed?

4. **Local Tips** - What should someone visiting know? Local culture, recommendations, things the area is famous for.

---

**FORMAT:** 
- Write 2,000-4,000 words of useful, readable content
- Use clear ## headers for sections
- Use **bold** for place names and key facts
- Be informative and engaging
- ${selectedCount > 0 ? 'Give extra detail to starred (⭐) places the user selected' : 'Cover all places with reasonable detail'}

If you can't find specific info on something, research related topics that would still be useful. ALWAYS provide value.`;

    // Make the Perplexity API call using Sonar Pro for deep research
    // Using sonar-pro model which is optimized for comprehensive research
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Best model for research - searches the web and synthesizes
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 8000, // Allow comprehensive output
        temperature: 0.7, // Balanced creativity and accuracy
        search_recency_filter: 'month', // Include recent information
        return_citations: true, // Get source citations
        return_related_questions: false,
        search_domain_filter: [], // No domain restrictions for comprehensive research
        // Regional context for better local results
        web_search_options: {
          search_context_size: 'high' // Maximum context for thorough research
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Perplexity API Error:', errorData);
      throw new Error(`Perplexity API error (${response.status}): ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Perplexity research completed successfully!');

    // Extract the narration and citations
    const narration = data.choices[0]?.message?.content || '';
    const citations = data.citations || [];

    // Generate a unique tour ID
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate estimated duration based on word count (average 150 words per minute for narration)
    const wordCount = narration.split(/\s+/).length;
    const estimatedDuration = Math.round(wordCount / 150);

    // Create tour title and description
    const title = `${locationData.streetName}, ${locationData.area || locationData.city}`;
    
    const description = `A ${estimatedDuration}-minute walking tour of ${locationData.streetName} in ${locationData.area || locationData.city}. Discover the history of exactly what's in front of you.`;

    // Save to database if available
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        
        await supabase.from('deep_research_jobs').insert({
          research_id: tourId,
          openai_response_id: `perplexity_${data.id || Date.now()}`,
          status: 'completed',
          location_data: locationData,
          places: places || [],
          interests: interests,
          user_id: userId || null,
          tour_id: tourId,
          narration: narration,
          sources: citations,
          word_count: wordCount,
          created_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        });
        
        console.log('📝 Research saved to database');
      } catch (dbError) {
        console.warn('⚠️ Could not save to database:', dbError.message);
      }
    }

    const tourResponse: TourResponse = {
      tourId,
      narration,
      title,
      description,
      estimatedDuration,
      distance: '~1 km', // Approximate walking distance
      sources: citations,
    };

    console.log(`✨ Tour generated: ${wordCount} words, ${estimatedDuration} min, ${citations.length} sources`);

    return new Response(
      JSON.stringify(tourResponse),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('❌ Perplexity research error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});

