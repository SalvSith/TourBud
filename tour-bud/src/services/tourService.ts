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
  sources?: string[];
}

// Deep research types
interface StartDeepResearchResponse {
  researchId: string;
  responseId: string;
  status: 'queued' | 'in_progress';
  estimatedMinutes: number;
  message: string;
}

interface CheckResearchStatusResponse {
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress?: string;
  tourData?: TourResponse;
  error?: string;
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

  // ============================================
  // PERPLEXITY RESEARCH (PRIMARY METHOD)
  // ============================================

  /**
   * Generate a comprehensive tour using Perplexity's Sonar API.
   * This is a synchronous call that returns the complete tour.
   * Typically takes 30-90 seconds for comprehensive research.
   * 
   * @param locationData - Location information
   * @param places - User-selected places to focus on
   * @param interests - User interests
   * @param nearbyPlaces - Other interesting places nearby (not selected but worth mentioning)
   * @param onProgress - Callback for progress updates
   */
  async generatePerplexityTour(
    locationData: GeocodeResponse & { latitude: number; longitude: number },
    places: Place[],
    interests: string[],
    nearbyPlaces: Place[] = [],
    onProgress?: (status: string, progress?: string) => void
  ): Promise<TourResponse> {
    try {
      onProgress?.('starting', 'Initiating Perplexity research...');
      
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.perplexityResearch}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ locationData, places, interests, nearbyPlaces })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Research failed: ${response.statusText}`);
      }

      onProgress?.('completed', 'Research complete! Your tour is ready.');
      return await response.json();
    } catch (error) {
      console.error('Perplexity research error:', error);
      throw error;
    }
  }

  // ============================================
  // LEGACY DEEP RESEARCH METHODS (OpenAI)
  // Kept for fallback purposes
  // ============================================

  async startDeepResearch(
    locationData: GeocodeResponse & { latitude: number; longitude: number },
    places: Place[],
    interests: string[],
    userId?: string
  ): Promise<StartDeepResearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.startDeepResearch}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ locationData, places, interests, userId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Start deep research failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Start deep research error:', error);
      throw error;
    }
  }

  async checkResearchStatus(
    responseId: string,
    researchId?: string
  ): Promise<CheckResearchStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.checkResearchStatus}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ responseId, researchId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Check research status failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Check research status error:', error);
      throw error;
    }
  }

  async generateDeepResearchTour(
    locationData: GeocodeResponse & { latitude: number; longitude: number },
    places: Place[],
    interests: string[],
    onProgress?: (status: string, progress?: string) => void,
    pollInterval: number = 10000,
    maxWaitTime: number = 900000
  ): Promise<TourResponse> {
    onProgress?.('starting', 'Initiating deep historical research...');
    const startResponse = await this.startDeepResearch(locationData, places, interests);
    
    const { responseId, researchId } = startResponse;
    onProgress?.('queued', startResponse.message);

    const startTime = Date.now();
    let lastStatus = '';

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await this.checkResearchStatus(responseId, researchId);
      
      if (statusResponse.status !== lastStatus) {
        lastStatus = statusResponse.status;
        onProgress?.(statusResponse.status, statusResponse.progress);
      }

      if (statusResponse.status === 'completed' && statusResponse.tourData) {
        onProgress?.('completed', 'Research complete! Your tour is ready.');
        return statusResponse.tourData;
      }

      if (statusResponse.status === 'failed' || statusResponse.status === 'cancelled') {
        throw new Error(statusResponse.error || 'Research failed');
      }
    }

    throw new Error('Research timed out. Please try again.');
  }
}

export default new TourService(); 