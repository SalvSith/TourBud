import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { SUPABASE_CONFIG } from '../config/supabase';

interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const LocationConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);
  const [showLocationButton, setShowLocationButton] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Store last coordinates - we'll get these from selected address
  const [lastCoordinates, setLastCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  // Store the original current location to revert to when clicking outside
  const [currentLocation, setCurrentLocation] = useState('');

  // Add spinner animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // Check if geolocation is available and try to get location automatically
    // But only for desktop browsers, not mobile
    const isDesktop = !(/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    if (isDesktop) {
      // For desktop, try to get location automatically
      getCurrentLocation(false);
    } else {
      // For mobile, show the location request button
      setShowLocationButton(true);
      // Show default map but leave input empty for manual entry
      fetchMapUrl('New York, NY');
    }
  }, []);

  // Handle clicks outside the input/suggestions to close dropdown and reset to current location
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSuggestions([]);
        setSelectedSuggestionIndex(-1);
        
        // If there's a current location and user hasn't confirmed a selection, revert
        if (currentLocation && location !== currentLocation) {
          setLocation(currentLocation);
          fetchMapUrl(currentLocation);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentLocation, location]);

  // Function to get user's current location
  const getCurrentLocation = (isManualRequest: boolean = true) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      setError('Geolocation is not supported by this browser');
      setShowLocationButton(false);
      // Show default map but leave input empty for manual entry
      fetchMapUrl('New York, NY');
      return;
    }

    if (isManualRequest) {
      setIsRequestingLocation(true);
      setHasRequestedLocation(true);
      setError('');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Store coordinates for later use
          setLastCoordinates({ latitude, longitude });
          
          // Use the geocode function to get proper address
          try {
            const geocodeResponse = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.geocode}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                'apikey': SUPABASE_CONFIG.anonKey
              },
              body: JSON.stringify({ latitude, longitude })
            });

            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              if (geocodeData.formattedAddress) {
                setLocation(geocodeData.formattedAddress);
                setCurrentLocation(geocodeData.formattedAddress); // Store as current location
                fetchMapUrl(geocodeData.formattedAddress);
              } else {
                // Fallback to coordinates if no formatted address
                fetchMapUrl(`${latitude},${longitude}`);
              }
            } else {
              // Fallback to coordinates if geocoding fails
              fetchMapUrl(`${latitude},${longitude}`);
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed, using coordinates:', geocodeError);
            // Fallback to coordinates if geocoding fails
            fetchMapUrl(`${latitude},${longitude}`);
          }
          
          setShowLocationButton(false);
          setError('');
        } catch (err) {
          console.error('Failed to process location:', err);
          setError('Failed to process location. Please try again or enter manually.');
          // Show default map but leave input empty for manual entry
          fetchMapUrl('New York, NY');
        }
      },
      (error) => {
        console.warn('Unable to retrieve location:', error);
        
        // Provide specific error messages for different error types
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions or enter your address manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please enter your address manually.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again or enter your address manually.');
            break;
          default:
            setError('Unable to retrieve location. Please enter your address manually.');
            break;
        }
        
        setShowLocationButton(true);
        // Show default map but leave input empty for manual entry
        fetchMapUrl('New York, NY');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 60000
      }
    );
    
    if (isManualRequest) {
      setIsRequestingLocation(false);
    }
  };

  // Function to fetch map URL from server
  const fetchMapUrl = async (address: string) => {
    try {
      setMapLoading(true);
      setMapError(null);

      const response = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.getMapUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'apikey': SUPABASE_CONFIG.anonKey
        },
        body: JSON.stringify({ 
          address,
          size: '400x200',  // Larger size for location selection
          zoom: 15 // Slightly zoomed out for area selection
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch map URL: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Test if the returned map URL actually works
      const mapImageTest = new Image();
      mapImageTest.onload = () => {
        setMapUrl(data.mapUrl);
      };
      mapImageTest.onerror = () => {
        console.error('Map image failed to load - likely API permissions issue');
        setMapError('Map image unavailable - check Google Maps API permissions');
      };
      mapImageTest.src = data.mapUrl;
      
    } catch (error) {
      console.error('Error fetching map URL:', error);
      setMapError(error instanceof Error ? error.message : 'Failed to load map');
    } finally {
      setMapLoading(false);
    }
  };

  // Function to fetch autocomplete suggestions
  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      
      const response = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.placesAutocomplete}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'apikey': SUPABASE_CONFIG.anonKey
        },
        body: JSON.stringify({ input })
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.predictions || []);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.warn('Autocomplete failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounced input handler
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    
    // Debounce autocomplete requests
    const timeoutId = setTimeout(() => {
      fetchSuggestions(newLocation);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setLocation(suggestion.description);
    setCurrentLocation(suggestion.description); // Update current location to the selected one
    setSuggestions([]);
    setShowSuggestions(false);
    fetchMapUrl(suggestion.description);
    
    // Properly geocode the selected address to get accurate coordinates
    try {
      // Use the geocode endpoint to get proper coordinates for the selected address
      const geocodeResponse = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.geocode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'apikey': SUPABASE_CONFIG.anonKey
        },
        body: JSON.stringify({ address: suggestion.description })
      });

      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.latitude && geocodeData.longitude) {
          setLastCoordinates({ 
            latitude: geocodeData.latitude, 
            longitude: geocodeData.longitude 
          });
          console.log('Geocoded coordinates for:', suggestion.description, geocodeData.latitude, geocodeData.longitude);
        } else {
          console.warn('No coordinates returned from geocoding');
          // Keep lastCoordinates as null to prevent using wrong coordinates
          setLastCoordinates(null);
        }
      } else {
        console.error('Geocoding failed:', geocodeResponse.status);
        // Keep lastCoordinates as null to prevent using wrong coordinates
        setLastCoordinates(null);
      }
    } catch (error) {
      console.error('Error geocoding selected address:', error);
      // Keep lastCoordinates as null to prevent using wrong coordinates
      setLastCoordinates(null);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleConfirm = () => {
    if (location.trim()) {
      navigate('/interests', { 
        state: { 
          location,
          coordinates: lastCoordinates 
        } 
      });
    }
  };

  // Handle manual location request button click
  const handleRequestLocation = () => {
    getCurrentLocation(true);
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">Tour Location</h2>
        <ThemeToggle />
      </div>
      
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-4">
            <h2>Set Your Tour Area</h2>
            <p>Where do you want your tour to focus on?</p>
          </div>

          {/* Google Maps Preview */}
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: 'var(--border-radius)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            backgroundImage: mapUrl ? `url("${mapUrl}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}>
            {mapLoading ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  border: '2px solid var(--border-color)',
                  borderTop: '2px solid var(--primary-color)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 8px auto'
                }} />
                <div>Loading map preview...</div>
              </div>
            ) : mapError ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={24} style={{ marginBottom: '8px' }} />
                <div>Map preview unavailable</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Location will still work
                </div>
              </div>
            ) : !mapUrl ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={24} style={{ marginBottom: '8px' }} />
                <div>Enter an address to see map</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Search for streets, neighborhoods, landmarks
                </div>
              </div>
            ) : null}
          </div>

          {/* Address Input with Autocomplete */}
          <div 
            className="card" 
            style={{ 
              marginBottom: '32px', 
              position: 'relative',
              transition: 'all 0.3s ease',
              overflow: 'hidden'
            }}
          >
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--error-color)',
                color: 'white',
                borderRadius: 'var(--border-radius)',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}
            
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <MapPin 
                  size={18} 
                  onClick={() => getCurrentLocation(true)}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    color: 'var(--text-secondary)',
                    zIndex: 1,
                    cursor: 'pointer',
                    transition: 'color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary-color)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={location}
                  onChange={handleLocationChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => location.length >= 2 && setShowSuggestions(suggestions.length > 0)}
                  style={{
                    width: '100%',
                    padding: '16px 48px 16px 48px',
                    border: `2px solid ${showSuggestions ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: showSuggestions ? '12px 12px 0 0' : '12px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: showSuggestions ? '0 4px 20px rgba(99, 102, 241, 0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
                  }}
                  placeholder="Search for your address, neighborhood, or landmark..."
                />
                
                {isLoadingSuggestions && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    zIndex: 1
                  }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid var(--border-color)',
                      borderTop: '2px solid var(--primary-color)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                )}
              </div>

              {/* Autocomplete Suggestions - Now contained within the card */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '2px solid var(--primary-color)',
                    borderTop: 'none',
                    borderRadius: '0 0 12px 12px',
                    maxHeight: '210px',
                    overflowY: 'auto',
                    boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.05)'
                  }}
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        backgroundColor: index === selectedSuggestionIndex ? 'var(--primary-color)' : 'transparent',
                        color: index === selectedSuggestionIndex ? 'white' : 'var(--text-primary)',
                        borderBottom: index < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      onMouseLeave={() => setSelectedSuggestionIndex(-1)}
                    >
                      <MapPin 
                        size={16} 
                        style={{ 
                          marginTop: '2px',
                          color: index === selectedSuggestionIndex ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                          flexShrink: 0
                        }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: '500', 
                          fontSize: '15px',
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {suggestion.structured_formatting.main_text}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: index === selectedSuggestionIndex ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {suggestion.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showLocationButton && (
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button 
                className="btn btn-secondary"
                onClick={handleRequestLocation}
                disabled={isRequestingLocation}
                style={{
                  opacity: isRequestingLocation ? 0.5 : 1,
                  cursor: isRequestingLocation ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
              >
                {isRequestingLocation ? (
                  <div style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid var(--border-color)',
                    borderTop: '2px solid var(--primary-color)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                ) : (
                  <MapPin size={18} />
                )}
                <span>{isRequestingLocation ? 'Requesting Location...' : 'Use My Current Location'}</span>
              </button>
            </div>
          )}

          <p style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            marginTop: '32px',
            marginBottom: '80px'
          }}>
            Locations are used to generate tours and are never stored or shared.
          </p>
        </motion.div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        padding: '20px',
        backgroundColor: 'var(--background)'
      }}>
        <button 
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!location.trim()}
          style={{
            opacity: !location.trim() ? 0.5 : 1,
            cursor: !location.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LocationConfirm; 