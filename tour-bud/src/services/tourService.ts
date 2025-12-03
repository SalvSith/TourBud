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
  audioUrl?: string;
  audioDuration?: number;
  audioFileSize?: number;
  audioStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  locationData?: any;
  createdAt?: string;
}

interface AudioGenerationResponse {
  success: boolean;
  audioUrl?: string;
  audioDuration?: number;
  audioFileSize?: number;
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

  // ============================================
  // TOUR RETRIEVAL
  // ============================================

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

  async listTours(limit: number = 20, offset: number = 0, userId?: string): Promise<{ tours: any[], total: number }> {
    try {
      let url = `${this.baseUrl}${SUPABASE_CONFIG.endpoints.listTours}?limit=${limit}&offset=${offset}`;
      if (userId) {
        url += `&userId=${userId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`List tours failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('List tours error:', error);
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
  // AUDIO GENERATION
  // ============================================

  /**
   * Manually trigger audio generation for a tour.
   * Usually audio is generated automatically when the tour is created,
   * but this can be used to retry if it failed.
   */
  async generateAudio(tourId: string): Promise<AudioGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${SUPABASE_CONFIG.endpoints.generateAudio}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ tourId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Audio generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Audio generation error:', error);
      throw error;
    }
  }

  /**
   * Poll for audio status until it's ready or fails.
   * Returns when audio is completed or after timeout.
   */
  async waitForAudio(
    tourId: string, 
    options: { 
      pollInterval?: number; 
      maxAttempts?: number;
      onStatusChange?: (status: string) => void;
    } = {}
  ): Promise<TourResponse> {
    const { 
      pollInterval = 3000, 
      maxAttempts = 60, // 3 minutes max with 3s interval
      onStatusChange 
    } = options;

    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const tour = await this.getTour(tourId);
      
      if (onStatusChange) {
        onStatusChange(tour.audioStatus || 'pending');
      }
      
      if (tour.audioStatus === 'completed') {
        return tour;
      }
      
      if (tour.audioStatus === 'failed') {
        throw new Error('Audio generation failed');
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('Audio generation timed out');
  }
}

export default new TourService(); 