import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

// Comprehensive sports keywords for identifying sports facilities
const COMPREHENSIVE_SPORTS_KEYWORDS = [
  'club', 'gym', 'sport', 'sporting', 'fitness', 'complex', 'padel', 'golf', 'tennis', 'field', 'court', 
  'recreation', 'athletic', 'soccer', 'football', 'cricket', 'rugby', 'hockey', 'basketball', 'volleyball',
  'swimming', 'pool', 'stadium', 'arena', 'training', 'academy', 'centre', 'center', 'league'
];

interface GetPlacesRequest {
  streetName: string;
  latitude: number;
  longitude: number;
  radius?: number; // Default 5000m (5km) - INCREASED for better coverage
}

interface Place {
  name: string;
  type: string[];
  address: string;
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  travelDistance?: number; // Travel distance in meters
  travelDuration?: number; // Travel time in seconds
}

// Helper function to fetch all pages of nearby search results
async function fetchAllNearbyPlaces(latitude: number, longitude: number, radius: number): Promise<any[]> {
  const allPlaces: any[] = [];
  let nextPageToken: string | null = null;
  let pageCount = 0;
  const maxPages = 3; // Limit to 3 pages (up to 60 results)

  do {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;
    
    if (nextPageToken) {
      url += `&pagetoken=${nextPageToken}`;
      // Wait 2 seconds before using page token (Google requirement)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      console.log(`Page ${pageCount + 1}: Found ${data.results.length} places`);
      allPlaces.push(...data.results);
      nextPageToken = data.next_page_token || null;
      pageCount++;
    } else {
      console.log(`Page ${pageCount + 1}: No results or error - ${data.status}`);
      break;
    }
  } while (nextPageToken && pageCount < maxPages);

  console.log(`Total raw places found across ${pageCount} pages: ${allPlaces.length}`);
  return allPlaces;
}

// Comprehensive search using multiple strategies to catch all businesses
async function getPlacesWithin1km(latitude: number, longitude: number): Promise<any[]> {
  const allPlaces: any[] = [];
  const seenPlaceIds = new Set<string>();
  const radius = 1000; // 1km in meters - FIXED RADIUS

  // Simple nearby search with pagination
  let nextPageToken: string | null = null;
  let pageCount = 0;

  do {
    pageCount++;
    
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;
    
    if (nextPageToken) {
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_MAPS_API_KEY}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        data.results.forEach((place: any) => {
          if (!seenPlaceIds.has(place.place_id)) {
            allPlaces.push(place);
            seenPlaceIds.add(place.place_id);
          }
        });
        
        nextPageToken = data.next_page_token || null;
        
        // Required delay between pagination requests
        if (nextPageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        nextPageToken = null;
      }
    } catch (error) {
      nextPageToken = null;
    }
    
    // Safety limit - Google typically returns max 3 pages (60 results)
    if (pageCount >= 3) {
      break;
    }
    
  } while (nextPageToken);
  return allPlaces;
}

// Function to add travel distances using Google Distance Matrix API
async function addTravelDistances(places: Place[], userLat: number, userLng: number): Promise<Place[]> {
  console.log(`=== CALCULATING TRAVEL DISTANCES ===`);
  
  if (places.length === 0) return places;
  
  const placesWithDistances = [...places];
  const batchSize = 25; // Google Distance Matrix API limit
  
  // Process places in batches
  for (let i = 0; i < placesWithDistances.length; i += batchSize) {
    const batch = placesWithDistances.slice(i, i + batchSize);
    
    // Create destinations string for this batch
    const destinations = batch.map(place => {
      // Use place coordinates if available, otherwise use address
      return encodeURIComponent(place.address);
    }).join('|');
    
    const origin = `${userLat},${userLng}`;
    const distanceUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destinations}&mode=walking&units=metric&key=${GOOGLE_MAPS_API_KEY}`;
    
    try {
      console.log(`Getting travel distances for batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(placesWithDistances.length/batchSize)}...`);
      
      const response = await fetch(distanceUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows && data.rows[0]) {
        const elements = data.rows[0].elements;
        
        elements.forEach((element: any, index: number) => {
          const placeIndex = i + index;
          if (placeIndex < placesWithDistances.length) {
            if (element.status === 'OK') {
              placesWithDistances[placeIndex].travelDistance = element.distance?.value || null;
              placesWithDistances[placeIndex].travelDuration = element.duration?.value || null;
            } else {
              console.log(`Distance calculation failed for: ${placesWithDistances[placeIndex].name} - ${element.status}`);
            }
          }
        });
      } else {
        console.log(`Distance Matrix API error for batch ${Math.floor(i/batchSize) + 1}: ${data.status}`);
      }
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < placesWithDistances.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      console.error(`Error calculating distances for batch ${Math.floor(i/batchSize) + 1}:`, error);
    }
  }
  
  const placesWithValidDistances = placesWithDistances.filter(p => p.travelDistance).length;
  console.log(`Successfully calculated distances for ${placesWithValidDistances}/${placesWithDistances.length} places`);
  
  return placesWithDistances;
}

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

    const { streetName, latitude, longitude } = await req.json() as GetPlacesRequest;

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Missing latitude or longitude' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Log the received streetName for debugging
    console.log('Received streetName:', streetName);
    console.log('Received coordinates:', latitude, longitude);

    const places: Place[] = [];
    
          // Get all places within 1km using simple radius search
      const allNearbyPlaces = await getPlacesWithin1km(latitude, longitude);
      
      // Process all nearby places - include everything within 1km
    for (const place of allNearbyPlaces) {
      places.push({
        name: place.name,
        type: place.types || [],
        address: place.vicinity || place.formatted_address || 'Address not available',
        placeId: place.place_id,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total
      });
    }

    // Sort by rating only - simple and reliable
    places.sort((a, b) => {
      // Places with ratings first
      if (a.rating && !b.rating) return -1;
      if (!a.rating && b.rating) return 1;
      // Then by highest rating
      if (a.rating && b.rating) return b.rating - a.rating;
      // Equal treatment for places without ratings
      return 0;
    });
    
    return new Response(
      JSON.stringify({ 
        places: places.slice(0, 200),
        total: places.length
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Get places error:', error);
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