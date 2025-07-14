import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');

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
  estimatedDuration: number; // in minutes
  distance: string;
}

// Helper function to search the web using Serper API
async function searchWeb(query: string, location?: string): Promise<string> {
  if (!SERPER_API_KEY) {
    console.log('⚠️ No SERPER_API_KEY found, skipping web search');
    return '';
  }

  try {
    console.log('🔍 Searching web for:', query);
    
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        gl: location ? getCountryCode(location) : 'us',
        num: 5,
      }),
    });

    if (!response.ok) {
      console.error('Web search failed:', response.status);
      return '';
    }

    const data = await response.json();
    
    if (data.organic && data.organic.length > 0) {
      const results = data.organic.slice(0, 5).map((result: any) => 
        `**${result.title}**\n${result.snippet}\nSource: ${result.link}\n`
      ).join('\n');
      
      console.log('✅ Web search successful, found', data.organic.length, 'results');
      return `\n\n**RECENT WEB SEARCH RESULTS:**\n${results}`;
    }
    
    return '';
  } catch (error) {
    console.error('Web search error:', error);
    return '';
  }
}

// Helper function to make OpenAI API calls
async function callOpenAIWithSearch(
  systemPrompt: string, 
  userPrompt: string, 
  locationData: any,
  model: string = 'gpt-4o',
  maxTokens: number = 2000
) {
  const requestBody = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt + `\n\nIMPORTANT: Use any web search results provided above for current, accurate information about ${locationData.streetName} in ${locationData.city}, ${locationData.country}.` }
    ],
    max_tokens: maxTokens,
  };

  console.log('🔍 Making OpenAI API call with web search...');
  console.log('Model:', model);
  console.log('Location for search:', {
    country: getCountryCode(locationData.country),
    city: locationData.city,
    region: locationData.area || locationData.city,
  });

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    console.error('❌ OpenAI API Error:', {
      status: response.status,
      error: errorData,
      model: model,
      hasApiKey: !!OPENAI_API_KEY
    });
    throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('✅ OpenAI API Success');
  console.log('Response usage:', data.usage);
  console.log('Has web search results:', data.choices[0]?.message?.web_search_results ? 'Yes' : 'No');
  
  if (data.choices[0]?.message?.web_search_results) {
    console.log('Number of web search results:', data.choices[0].message.web_search_results.length);
  }

  return data.choices[0]?.message?.content || '';
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
    'Belarus': 'BY',
    'Moldova': 'MD',
    'Georgia': 'GE',
    'Armenia': 'AM',
    'Azerbaijan': 'AZ',
    'Kazakhstan': 'KZ',
    'Uzbekistan': 'UZ',
    'Kyrgyzstan': 'KG',
    'Tajikistan': 'TJ',
    'Turkmenistan': 'TM',
    'Mongolia': 'MN',
    'South Korea': 'KR',
    'North Korea': 'KP',
    'Taiwan': 'TW',
    'Hong Kong': 'HK',
    'Macau': 'MO',
    'Singapore': 'SG',
    'Malaysia': 'MY',
    'Thailand': 'TH',
    'Vietnam': 'VN',
    'Philippines': 'PH',
    'Indonesia': 'ID',
    'Brunei': 'BN',
    'Cambodia': 'KH',
    'Laos': 'LA',
    'Myanmar': 'MM',
    'Bangladesh': 'BD',
    'Bhutan': 'BT',
    'Nepal': 'NP',
    'Sri Lanka': 'LK',
    'Maldives': 'MV',
    'Pakistan': 'PK',
    'Afghanistan': 'AF',
    'Iran': 'IR',
    'Iraq': 'IQ',
    'Syria': 'SY',
    'Lebanon': 'LB',
    'Jordan': 'JO',
    'Israel': 'IL',
    'Palestine': 'PS',
    'Saudi Arabia': 'SA',
    'United Arab Emirates': 'AE',
    'Qatar': 'QA',
    'Kuwait': 'KW',
    'Bahrain': 'BH',
    'Oman': 'OM',
    'Yemen': 'YE',
    'Egypt': 'EG',
    'Libya': 'LY',
    'Tunisia': 'TN',
    'Algeria': 'DZ',
    'Morocco': 'MA',
    'Sudan': 'SD',
    'South Sudan': 'SS',
    'Ethiopia': 'ET',
    'Eritrea': 'ER',
    'Djibouti': 'DJ',
    'Somalia': 'SO',
    'Kenya': 'KE',
    'Uganda': 'UG',
    'Tanzania': 'TZ',
    'Rwanda': 'RW',
    'Burundi': 'BI',
    'Democratic Republic of the Congo': 'CD',
    'Republic of the Congo': 'CG',
    'Central African Republic': 'CF',
    'Chad': 'TD',
    'Cameroon': 'CM',
    'Nigeria': 'NG',
    'Niger': 'NE',
    'Mali': 'ML',
    'Burkina Faso': 'BF',
    'Ivory Coast': 'CI',
    'Ghana': 'GH',
    'Togo': 'TG',
    'Benin': 'BJ',
    'Guinea': 'GN',
    'Guinea-Bissau': 'GW',
    'Sierra Leone': 'SL',
    'Liberia': 'LR',
    'Senegal': 'SN',
    'Gambia': 'GM',
    'Cape Verde': 'CV',
    'Mauritania': 'MR',
    'Western Sahara': 'EH',
    'South Africa': 'ZA',
    'Lesotho': 'LS',
    'Swaziland': 'SZ',
    'Botswana': 'BW',
    'Namibia': 'NA',
    'Zambia': 'ZM',
    'Zimbabwe': 'ZW',
    'Mozambique': 'MZ',
    'Madagascar': 'MG',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
    'Comoros': 'KM',
    'Mayotte': 'YT',
    'Réunion': 'RE',
    'Argentina': 'AR',
    'Chile': 'CL',
    'Uruguay': 'UY',
    'Paraguay': 'PY',
    'Bolivia': 'BO',
    'Peru': 'PE',
    'Ecuador': 'EC',
    'Colombia': 'CO',
    'Venezuela': 'VE',
    'Guyana': 'GY',
    'Suriname': 'SR',
    'French Guiana': 'GF',
    'Guatemala': 'GT',
    'Belize': 'BZ',
    'El Salvador': 'SV',
    'Honduras': 'HN',
    'Nicaragua': 'NI',
    'Costa Rica': 'CR',
    'Panama': 'PA',
    'Cuba': 'CU',
    'Jamaica': 'JM',
    'Haiti': 'HT',
    'Dominican Republic': 'DO',
    'Puerto Rico': 'PR',
    'Trinidad and Tobago': 'TT',
    'Barbados': 'BB',
    'Saint Lucia': 'LC',
    'Grenada': 'GD',
    'Saint Vincent and the Grenadines': 'VC',
    'Antigua and Barbuda': 'AG',
    'Dominica': 'DM',
    'Saint Kitts and Nevis': 'KN',
    'Bahamas': 'BS',
    'New Zealand': 'NZ',
    'Fiji': 'FJ',
    'Papua New Guinea': 'PG',
    'Solomon Islands': 'SB',
    'New Caledonia': 'NC',
    'French Polynesia': 'PF',
    'Vanuatu': 'VU',
    'Samoa': 'WS',
    'Kiribati': 'KI',
    'Tonga': 'TO',
    'Micronesia': 'FM',
    'Palau': 'PW',
    'Marshall Islands': 'MH',
    'Nauru': 'NR',
    'Tuvalu': 'TV'
  };
  
  return countryMap[country] || 'US'; // Default to US if country not found
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

    // Format places list for the prompts
    const placesListFormatted = places && places.length > 0 
      ? places.map(p => {
          const rating = p.rating ? ` (${p.rating}★` + (p.userRatingsTotal ? `, ${p.userRatingsTotal} reviews)` : ')') : '';
          return `- ${p.name} at ${p.address}${rating}
   Types: ${p.type.join(', ')}`;
        }).join('\n')
      : 'No specific places selected - focusing on street exploration';

    const baseLocationInfo = `
**LOCATION**: ${locationData.streetName}, ${locationData.area || ''} ${locationData.city}, ${locationData.country}
**COORDINATES**: ${locationData.latitude}, ${locationData.longitude}
**PLACES FOCUS**:
${placesListFormatted}
**USER INTERESTS**: ${interests.join(', ')}`;

    const historyUserPrompt = `Research the history and development of ${locationData.streetName} in ${locationData.city}, ${locationData.country}. 

${baseLocationInfo}

Find information about:
1. The origins and naming of ${locationData.streetName}
2. Historical development and significant periods of change
3. Notable historical events that occurred on or near this street
4. Historical figures associated with this street
5. How the street's character and purpose evolved over time
6. Architectural periods and building styles historically present
7. Economic and social history of the area

Please provide detailed, factual information with specific dates, names, and events. Focus on verified historical facts that would interest someone walking this street today.`;

    const currentUserPrompt = places && places.length > 0 
      ? `Research detailed information about these SPECIFIC PLACES that the user wants to learn about on ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

${baseLocationInfo}

**PRIORITY**: Focus your research on these exact places the user selected:
${placesListFormatted}

For each of the places listed above, find:
1. **Detailed business information**: Current hours, services, specialties, what they're known for
2. **History and significance**: When they opened, notable events, famous visitors
3. **Current reviews and reputation**: What people say about them, why they're worth visiting
4. **Unique features**: What makes each place special or different
5. **Cultural role**: How they contribute to the street's character and community
6. **Recent news or changes**: Any recent renovations, awards, or developments
7. **Visitor experience**: What someone can see, do, or experience at each location

Also research:
- Current cultural significance of this street in the city
- Local community events or festivals associated with this area
- Food culture and specialties available on this street
- Transportation and accessibility for visitors

Focus 80% of your research on the specific selected places listed above, and 20% on general street context.`
      : `Research comprehensive information about ${locationData.streetName} in ${locationData.city}, ${locationData.country} for a street-focused walking tour.

${baseLocationInfo}

Since the user wants to explore the street itself rather than specific places, focus your research on:

**STREET CHARACTER & ATMOSPHERE**:
1. **Current street life**: What makes this street unique, daily rhythms, street culture
2. **Notable buildings and architecture**: Interesting buildings, architectural styles, design elements
3. **Street layout and urban design**: How the street is designed, pedestrian areas, interesting intersections
4. **Local businesses and establishments**: What types of businesses line the street, local favorites
5. **Community gathering spots**: Where locals meet, public spaces, street furniture
6. **Seasonal changes**: How the street changes throughout the year

**CULTURAL & SOCIAL ASPECTS**:
7. **Local community**: Who lives and works here, neighborhood character
8. **Street art and public installations**: Murals, sculptures, interesting signage
9. **Events and activities**: Street festivals, markets, regular community events
10. **Walking experience**: What visitors can see, hear, and experience while walking

**PRACTICAL VISITOR INFORMATION**:
11. **Best walking routes**: Interesting paths along the street
12. **Photo opportunities**: Notable views, interesting architectural details
13. **Accessibility**: Pedestrian-friendly areas, seating, public facilities
14. **Local tips**: Best times to visit, hidden details to look for

Focus on creating a rich portrait of the street itself as a living, breathing place with its own character and stories.`;

    const tourSystemPrompt = `You are a world-class tour guide specializing in creating engaging, street-focused walking tours. You excel at weaving historical research and current information into compelling narratives that make visitors feel like they're walking with a knowledgeable local friend.`;

    // Execute comprehensive multi-stage research with PARALLEL processing
    console.log('Starting comprehensive tour research with parallel processing...');
    
    // Define all research stages upfront
    const historySystemPrompt = `You are a professional historical researcher specializing in urban history and street development. Use web search to find accurate, detailed historical information about specific streets and neighborhoods.`;
    
    const currentSystemPrompt = `You are a local area specialist and cultural researcher. Use web search to find current, accurate information about specific businesses and places. Focus heavily on the exact places provided and their current status, reviews, and significance.`;
    
    const culturalSystemPrompt = `You are a cultural anthropologist and social historian specializing in urban culture. Research the cultural significance, social dynamics, and community aspects of specific streets and neighborhoods.`;
    
    const architectureSystemPrompt = `You are an architectural historian and urban planning expert. Research the architectural styles, building history, and urban design elements of specific streets.`;
    
    const secretsSystemPrompt = `You are a local insider and urban explorer who knows all the hidden gems, local secrets, and lesser-known stories about city streets. Focus on unique, surprising, and insider information.`;
    
    const practicalSystemPrompt = `You are a travel advisor specializing in practical, up-to-date information for visitors. Focus on current logistics, accessibility, and visitor tips.`;

    const culturalUserPrompt = `Research the cultural and social significance of ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

${baseLocationInfo}

Find information about:
1. **Cultural movements and artistic significance** - Any cultural movements that started or flourished here
2. **Famous residents and visitors** - Notable people who lived, worked, or spent time on this street
3. **Cultural institutions** - Museums, galleries, theaters, cultural centers
4. **Local traditions and festivals** - Annual events, parades, celebrations unique to this area
5. **Street art and public installations** - Murals, sculptures, monuments
6. **Music and performance history** - Concerts, street performers, music venues
7. **Literary connections** - Books set here, authors who wrote about this street
8. **Film and TV locations** - Movies or shows filmed on this street
9. **Local community dynamics** - How locals use and perceive this street
10. **Subcultural significance** - Any subcultures or movements associated with the area`;

    const architectureUserPrompt = `Research the architecture and urban design of ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

${baseLocationInfo}

Find information about:
1. **Architectural styles and periods** - Dominant architectural movements represented
2. **Notable buildings and structures** - Significant buildings, their architects, and construction dates
3. **Urban planning history** - How the street layout and design evolved
4. **Building materials and techniques** - Common construction methods and materials used
5. **Preservation and renovations** - Historic preservation efforts, major renovations
6. **Skyline and streetscape changes** - How the visual appearance has changed over time
7. **Public spaces and urban furniture** - Parks, plazas, benches, lighting
8. **Transportation infrastructure** - How transit has shaped the street
9. **Future development plans** - Upcoming construction or urban planning initiatives`;

    const secretsUserPrompt = `Research hidden gems, local secrets, and lesser-known facts about ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

${baseLocationInfo}

Find information about:
1. **Hidden courtyards and passages** - Secret alleys, hidden gardens, unmarked entrances
2. **Local legends and urban myths** - Stories locals tell, urban legends specific to this street
3. **Best-kept secret businesses** - Hidden speakeasies, unmarked restaurants, secret shops
4. **Unusual historical facts** - Bizarre or surprising historical events that occurred here
5. **Local tips and tricks** - Where locals go, best times to visit, insider knowledge
6. **Underground history** - Tunnels, prohibition-era secrets, underground movements
7. **Ghost stories and mysteries** - Unexplained events, haunted locations, mysteries
8. **Street quirks and oddities** - Unusual features, strange laws, weird traditions
9. **Celebrity secrets** - Where famous people secretly hang out or hidden celebrity connections
10. **Instagram-worthy secret spots** - Hidden photo opportunities locals know about`;

    const practicalUserPrompt = `Research practical visitor information for ${locationData.streetName} in ${locationData.city}, ${locationData.country}.

${baseLocationInfo}

Find current information about:
1. **Transportation and parking** - How to get there, parking options, public transit
2. **Best times to visit** - Seasonal considerations, crowd patterns, optimal visiting hours
3. **Safety and accessibility** - Safety tips, wheelchair accessibility, family-friendly areas
4. **Nearby amenities** - Restrooms, ATMs, tourist information centers
5. **Cost considerations** - Free activities vs paid, typical costs, money-saving tips
6. **Weather considerations** - How weather affects the experience, seasonal changes
7. **Photography rules** - Where photos are allowed, best photo spots, drone policies
8. **COVID or health updates** - Any current health guidelines or restrictions
9. **Wi-Fi and connectivity** - Free Wi-Fi spots, cell coverage
10. **Emergency information** - Nearest hospitals, police stations, emergency contacts`;

    // Execute optimized research with strategic web searches
    console.log('Executing optimized 6-stage research...');
    
    // STAGE 1: Web search (with timeout protection)
    console.log('Stage 1: Web search with timeout protection...');
    let combinedWebResults = '';
    
    try {
      const masterSearchQuery = `${locationData.streetName} ${locationData.city} comprehensive guide history culture architecture hidden gems current attractions visitor information 2025`;
      const placesSearchQuery = `${placesListFormatted.replace(/\n/g, ' ')} ${locationData.streetName} ${locationData.city} current hours reviews what to see`;
      
      // Use Promise.race with timeout to prevent hanging
      const searchPromises = Promise.all([
        searchWeb(masterSearchQuery, locationData.country),
        searchWeb(placesSearchQuery, locationData.country)
      ]);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Web search timeout')), 15000)
      );
      
      const [masterWebResults, placesWebResults] = await Promise.race([
        searchPromises,
        timeoutPromise
      ]) as [string, string];
      
      combinedWebResults = masterWebResults + '\n\n' + placesWebResults;
      console.log('✅ Web search completed successfully');
    } catch (error) {
      console.log('⚠️ Web search failed or timed out, proceeding without web data:', error.message);
      combinedWebResults = '\n\n**Note: Web search unavailable, using AI knowledge base only.**\n\n';
    }
    
    // STAGES 3-8: Execute all AI research in parallel using the same web data
    console.log('Stages 3-8: Executing all AI research in parallel...');
    
    const [
      historicalContext,
      currentContext,
      culturalContext,
      architectureContext,
      secretsContext,
      practicalContext
    ] = await Promise.all([
      // Historical Research - using faster model
      callOpenAIWithSearch(
        historySystemPrompt, 
        historyUserPrompt + combinedWebResults, 
        locationData,
        'gpt-4o-mini',
        1500
      ),
      
      // Current Business Research - using faster model
      callOpenAIWithSearch(
        currentSystemPrompt, 
        currentUserPrompt + combinedWebResults, 
        locationData,
        'gpt-4o-mini', 
        1500
      ),
      
      // Cultural Research - using faster model
      callOpenAIWithSearch(
        culturalSystemPrompt,
        culturalUserPrompt + combinedWebResults,
        locationData,
        'gpt-4o-mini',
        1200
      ),
      
      // Architecture Research - using faster model
      callOpenAIWithSearch(
        architectureSystemPrompt,
        architectureUserPrompt + combinedWebResults,
        locationData,
        'gpt-4o-mini',
        1200
      ),
      
      // Hidden Gems Research - using faster model
      callOpenAIWithSearch(
        secretsSystemPrompt,
        secretsUserPrompt + combinedWebResults,
        locationData,
        'gpt-4o-mini',
        1200
      ),
      
      // Practical Information - using faster model
      callOpenAIWithSearch(
        practicalSystemPrompt,
        practicalUserPrompt + combinedWebResults,
        locationData,
        'gpt-4o-mini',
        1200
      )
    ]);

    console.log('🎉 All 6 research stages completed!');

    // FINAL STAGE: Comprehensive Tour Synthesis
    console.log('Final Stage: Creating comprehensive tour narrative...');
    
    const hasSelectedPlaces = places && places.length > 0;
    
    const tourUserPrompt = hasSelectedPlaces 
      ? `Create a comprehensive, engaging walking tour (20-25 minutes of spoken content) for ${locationData.streetName} in ${locationData.city}. Synthesize ALL the research provided to craft a rich, detailed, factual narrative that brings the street to life.

**LOCATION DETAILS**:
${baseLocationInfo}

**COMPREHENSIVE RESEARCH GATHERED**:

**1. HISTORICAL CONTEXT**:
${historicalContext}

**2. CURRENT BUSINESSES & PLACES**:
${currentContext}

**3. CULTURAL & SOCIAL SIGNIFICANCE**:
${culturalContext}

**4. ARCHITECTURE & URBAN DESIGN**:
${architectureContext}

**5. HIDDEN GEMS & LOCAL SECRETS**:
${secretsContext}

**6. PRACTICAL VISITOR INFORMATION**:
${practicalContext}

**CRITICAL**: The user specifically wants to learn about these places:
${placesListFormatted}

**TOUR REQUIREMENTS**:
Create a comprehensive tour that:
1. **Opens with a captivating introduction** that sets the scene using multiple layers of context
2. **Creates detailed stops** for each user-selected place, enriched with ALL relevant research
3. **Weaves together ALL research types** - historical, cultural, architectural, and secrets
4. **Includes specific facts, dates, and stories** from the research to add credibility
5. **Connects to user interests** (${interests.join(', ')}) throughout the narrative
6. **Incorporates practical tips** naturally into the tour flow
7. **Reveals surprising secrets and hidden gems** to delight and surprise
8. **Uses architectural and cultural details** to help visitors truly see the street
9. **Builds a narrative arc** that connects past, present, and future
10. **Concludes powerfully** with personalized recommendations and a call to explore

**ENHANCED STRUCTURE**:
- **Grand Introduction** (3-4 minutes) – Set the scene with historical grandeur, cultural significance, and a preview of secrets to come
- **Stop 1: [First selected place]** (3-4 minutes) – Deep dive using ALL research angles
- **Transition & Street Context** (2-3 minutes) – Architecture, urban design, cultural notes while walking
- **Stop 2: [Second selected place]** (3-4 minutes) – Comprehensive exploration with surprises
- **Hidden Gems Interlude** (2-3 minutes) – Share secrets and lesser-known spots
- **Stop 3: [Third selected place]** (3-4 minutes) – Full treatment with all research integrated
- [Continue pattern for all selected places...]
- **Grand Finale** (3-4 minutes) – Synthesis, practical tips, and inspiring send-off

**TONE**: Rich and multilayered – combine the authority of a historian, the insight of a cultural critic, the knowledge of an architect, the intimacy of a local friend, and the flair of a master storyteller.

**LENGTH**: Aim for a substantial narrative of 20-25 minutes of spoken content (approximately 3,000–3,750 words) to ensure comprehensive coverage.

**FOCUS**: Create a 360-degree portrait of the street where:
- 40% focuses on the overall street context (history, culture, architecture, atmosphere)
- 30% deep-dives into the user's selected places
- 20% reveals hidden gems and local secrets
- 10% provides practical tips woven throughout

**QUALITY REQUIREMENTS**:
- Every claim must be supported by the research provided
- Include specific dates, names, and verifiable facts
- Balance grand historical narratives with intimate local details
- Create "aha!" moments with surprising connections and revelations
- Make visitors feel like insiders with exclusive knowledge

Create a tour that visitors will remember for years – one that transforms a simple walk into an unforgettable journey through time, culture, and human stories.`
      : `Create a comprehensive, engaging street-focused walking tour (20-25 minutes of spoken content) for ${locationData.streetName} in ${locationData.city}. Since the user chose to explore the street itself rather than specific places, synthesize ALL the research provided to craft a rich, detailed, factual narrative that brings the street to life as a living, breathing place.

**LOCATION DETAILS**:
${baseLocationInfo}

**COMPREHENSIVE RESEARCH GATHERED**:

**1. HISTORICAL CONTEXT**:
${historicalContext}

**2. STREET CHARACTER & CURRENT LIFE**:
${currentContext}

**3. CULTURAL & SOCIAL SIGNIFICANCE**:
${culturalContext}

**4. ARCHITECTURE & URBAN DESIGN**:
${architectureContext}

**5. HIDDEN GEMS & LOCAL SECRETS**:
${secretsContext}

**6. PRACTICAL VISITOR INFORMATION**:
${practicalContext}

**STREET-FOCUSED TOUR REQUIREMENTS**:
Create a comprehensive tour that:
1. **Opens with a captivating introduction** that establishes the street's unique character and significance
2. **Tells the street's story** through historical development, architectural evolution, and cultural transformation
3. **Guides visitors' attention** to notice details they would otherwise miss - architectural features, urban design elements, cultural markers
4. **Weaves together ALL research types** - historical, cultural, architectural, and secrets - into a cohesive street narrative
5. **Includes specific facts, dates, and stories** from the research to add credibility and depth
6. **Connects to user interests** (${interests.join(', ')}) throughout the narrative
7. **Reveals hidden details and secrets** that make visitors see the street with new eyes
8. **Creates a sense of place** that helps visitors understand what makes this street special
9. **Builds a narrative arc** that moves visitors along the street while connecting past, present, and future
10. **Concludes powerfully** with insights about the street's ongoing evolution and future

**STREET-FOCUSED STRUCTURE**:
- **Grand Introduction** (4-5 minutes) – Establish the street's character, preview its stories, and set expectations for discovery
- **Historical Foundation** (4-5 minutes) – The street's origins, development, and how it became what it is today
- **Architectural Journey** (4-5 minutes) – Guide attention to buildings, design elements, and urban planning that tells the street's story
- **Cultural & Social Life** (4-5 minutes) – How people use this street, community dynamics, local traditions, and cultural significance
- **Hidden Secrets & Local Insights** (4-5 minutes) – Reveal lesser-known aspects, local stories, and details only insiders know
- **Contemporary Character** (2-3 minutes) – What the street is today, current businesses, community life, and ongoing changes
- **Grand Finale** (2-3 minutes) – Synthesis of the street's essence, practical exploration tips, and inspiring send-off

**TONE**: Rich and immersive – combine the authority of a historian, the eye of an urban planner, the insight of a cultural anthropologist, the intimacy of a local resident, and the storytelling flair of a master guide.

**LENGTH**: Aim for a substantial narrative of 20-25 minutes of spoken content (approximately 3,000–3,750 words) to ensure comprehensive street exploration.

**FOCUS**: Create a complete portrait of the street where:
- 50% focuses on the street's character, atmosphere, and what makes it unique
- 25% explores historical development and architectural features
- 15% reveals hidden gems, local secrets, and insider knowledge
- 10% provides practical tips for deeper exploration

**QUALITY REQUIREMENTS**:
- Every claim must be supported by the research provided
- Include specific dates, names, and verifiable facts about the street
- Help visitors notice details they would otherwise overlook
- Create "aha!" moments with surprising connections and revelations
- Make visitors feel like they understand the street's soul and significance
- Guide their eyes to see architectural details, urban design choices, and cultural markers

Create a tour that transforms a simple street into a fascinating world – one that makes visitors feel they've discovered a hidden gem and understand a place in a completely new way.`;

    const finalNarration = await callOpenAIWithSearch(
      tourSystemPrompt,
      tourUserPrompt,
      locationData,
      'gpt-4o',
      4000  // Increased token limit for longer tour
    );

    // Generate a unique tour ID
    const tourId = `tour_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract a title and description from the narration
    const lines = finalNarration.split('\n').filter(line => line.trim().length > 0);
    const title = `${locationData.streetName} Walking Tour`;
    const description = lines[0].substring(0, 150) + '...';

    const response: TourResponse = {
      tourId,
      narration: finalNarration,
      title,
      description,
      estimatedDuration: 25, // 20-25 minute comprehensive tour
      distance: '0.8 mi' // Default distance
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );

  } catch (error) {
    console.error('Generate tour error:', error);
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