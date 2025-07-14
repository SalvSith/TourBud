// Tour Service - Handles all API calls to Supabase Edge Functions
import { SUPABASE_CONFIG } from '../config/supabase';

interface GeocodeResponse {
  streetName: string;
  plusCode: string;
  area: string;
  city: string;
  country: string;
  formattedAddress: string;
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

interface TourResponse {
  tourId: string;
  narration: string;
  title: string;
  description: string;
  estimatedDuration: number;
  distance: string;
}

class TourService {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    this.baseUrl = SUPABASE_CONFIG.url;
    this.headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
    };
  }

  async geocodeLocation(latitude: number, longitude: number): Promise<GeocodeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.geocode}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ latitude, longitude })
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  async getPlacesOnStreet(streetName: string, latitude: number, longitude: number): Promise<{ places: Place[], total: number, debug?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.getPlaces}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ streetName, latitude, longitude })
      });

      if (!response.ok) {
        throw new Error(`Get places failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get places error:', error);
      throw error;
    }
  }

  async generateTour(
    locationData: GeocodeResponse & { latitude: number; longitude: number },
    places: Place[],
    interests: string[]
  ): Promise<TourResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.generateTour}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ locationData, places, interests })
      });

      if (!response.ok) {
        throw new Error(`Generate tour failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Generate tour error:', error);
      throw error;
    }
  }

  async getTour(tourId: string): Promise<TourResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.getTour}?tourId=${tourId}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Get tour failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get tour error:', error);
      throw error;
    }
  }

  // Full tour generation flow
  async generateFullTour(latitude: number, longitude: number, interests: string[]): Promise<TourResponse> {
    try {
      // Step 1: Geocode location
      const geocodeData = await this.geocodeLocation(latitude, longitude);
      
      // Step 2: Get places on the street
      const { places } = await this.getPlacesOnStreet(geocodeData.streetName, latitude, longitude);
      
      // Step 3: Generate tour with OpenAI
      const tourData = await this.generateTour(
        { ...geocodeData, latitude, longitude },
        places,
        interests
      );

      return tourData;
    } catch (error) {
      console.error('Full tour generation error:', error);
      throw error;
    }
  }
}

export default new TourService(); 