import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Store last coordinates - we'll get these from selected address
  const [lastCoordinates, setLastCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  // Store the original current location to revert to when clicking outside
  const [currentLocation, setCurrentLocation] = useState('');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

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
    // Show default map but don't auto-request location (required for mobile Safari)
    fetchMapUrl('New York, NY');
  }, []);

  // Handle closing the expanded input
  const handleCloseExpandedInput = () => {
    setIsInputExpanded(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // If there's a current location and user hasn't confirmed a selection, revert
    if (currentLocation && location !== currentLocation) {
      setLocation(currentLocation);
      fetchMapUrl(currentLocation);
    }
  };

  // Handle clicks outside the input/suggestions to close dropdown and reset to current location
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        suggestionsRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        handleCloseExpandedInput();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentLocation, location]);

  // Function to get user's current location
  // CRITICAL FOR SAFARI: getCurrentPosition MUST be called IMMEDIATELY and SYNCHRONOUSLY
  // in the exact same call stack as the user gesture (button click).
  // Calling setState or any other function before it can break Safari's permission prompt.
  const getCurrentLocation = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      setError('Geolocation is not supported by this browser');
      return;
    }

    // Check if we're on HTTPS (required for Safari on iOS)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      console.error('Geolocation blocked: not HTTPS', window.location.protocol, window.location.hostname);
      setError('Location access requires a secure connection (HTTPS).');
      return;
    }

    console.log('Calling getCurrentPosition IMMEDIATELY (Safari-compatible)');
    
    // SAFARI FIX: Call getCurrentPosition FIRST, BEFORE any setState
    // This must be the very first thing after the user clicks
    // Set loading state AFTER initiating the request (not before)
    setTimeout(() => {
      setIsRequestingLocation(true);
      setError('');
    }, 0);
    
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
                setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                fetchMapUrl(`${latitude},${longitude}`);
              }
            } else {
              // Fallback to coordinates if geocoding fails
              setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              fetchMapUrl(`${latitude},${longitude}`);
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed, using coordinates:', geocodeError);
            // Fallback to coordinates if geocoding fails
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            setCurrentLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            fetchMapUrl(`${latitude},${longitude}`);
          }
          
        } catch (err) {
          console.error('Failed to process location:', err);
          setError('Failed to process location');
        } finally {
          setIsRequestingLocation(false);
        }
      },
      (error) => {
        console.warn('Unable to retrieve location:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        setIsRequestingLocation(false);
        
        // More specific error messages for Safari
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.log('Browser geolocation denied, trying IP-based fallback...');
            // Try IP-based geolocation as fallback
            tryIpGeolocation();
            return; // Don't show error yet, wait for IP fallback
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please enter your location manually.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An error occurred while retrieving your location. Please enter it manually.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout for mobile
        maximumAge: 60000
      }
    );
  };

  // IP-based geolocation fallback when browser geolocation fails
  const tryIpGeolocation = async () => {
    console.log('Attempting IP-based geolocation...');
    
    try {
      const response = await fetch(`${SUPABASE_CONFIG.url}${SUPABASE_CONFIG.endpoints.getIpLocation}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
          'apikey': SUPABASE_CONFIG.anonKey
        }
      });

      if (!response.ok) {
        throw new Error(`IP geolocation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('IP geolocation result:', data);

      if (data.error || !data.latitude || !data.longitude) {
        throw new Error(data.error || 'No location data returned');
      }

      // Success! Use the IP-based location
      const { latitude, longitude, city, country } = data;
      
      setLastCoordinates({ latitude, longitude });
      
      // Create a display location from IP data
      const displayLocation = city && country ? `${city}, ${country}` : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setLocation(displayLocation);
      setCurrentLocation(displayLocation);
      fetchMapUrl(displayLocation);
      
      // Show a note that this is approximate
      setError('📍 Using approximate location based on your IP. For precise location, enable location access in your browser settings.');
      
      setIsRequestingLocation(false);
      
    } catch (err) {
      console.error('IP geolocation failed:', err);
      setIsRequestingLocation(false);
      
      // Show the original Safari error message
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isIOSSafari) {
        setError('Location unavailable. Please enter your location manually, or enable location in Settings → Privacy & Security → Location Services → Safari Websites.');
      } else if (isSafari) {
        setError('Location unavailable. Please enter your location manually, or enable Safari in System Settings → Privacy & Security → Location Services.');
      } else {
        setError('Location access denied. Please enter your location manually or allow location access in your browser settings.');
      }
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
  const handleLocationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    
    // Auto-resize textarea
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
    
    // Debounce autocomplete requests
    const timeoutId = setTimeout(() => {
      fetchSuggestions(newLocation);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle input focus - expand to full screen
  const handleInputFocus = () => {
    setIsInputExpanded(true);
    if (location.length >= 2) {
      setShowSuggestions(suggestions.length > 0);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: PlaceSuggestion) => {
    setLocation(suggestion.description);
    setCurrentLocation(suggestion.description); // Update current location to the selected one
    setSuggestions([]);
    setShowSuggestions(false);
    setIsInputExpanded(false); // Close expanded view after selection
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
    if (e.key === 'Escape') {
      handleCloseExpandedInput();
      inputRef.current?.blur();
      return;
    }
    
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
          <div className="text-center">
            <h2>Set Your Tour Area</h2>
            <p style={{ marginBottom: '0px' }}>Where do you want your tour to focus on?</p>
          </div>

          {/* Use My Location Button */}
          <div style={{ marginBottom: '20px', marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={getCurrentLocation}
              disabled={isRequestingLocation}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: isRequestingLocation ? 'var(--secondary-color)' : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isRequestingLocation ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}
            >
              {isRequestingLocation ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Getting location...
                </>
              ) : (
                <>
                  <MapPin size={16} />
                  Use My Location
                </>
              )}
            </button>
            
            {/* Debug info for troubleshooting */}
            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              marginTop: '24px',
              marginBottom: '0'
            }}>
              <div>Or enter your location manually in the search box below</div>
              <div style={{ marginTop: '4px' }}>
                {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                  <span style={{ color: 'var(--error-color)' }}>⚠️ HTTPS required for location • </span>
                )}
                {!navigator.geolocation && (
                  <span style={{ color: 'var(--error-color)' }}>❌ Geolocation not supported • </span>
                )}
              </div>
            </div>
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
                <div>Click "Use My Location" or enter an address</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Search for streets, neighborhoods, landmarks
                </div>
              </div>
            ) : null}
          </div>

          {/* Address Input Preview Card - Clicking opens fullscreen */}
          <div 
            className="card" 
            onClick={() => setIsInputExpanded(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setIsInputExpanded(true)}
            aria-label="Enter your location"
            style={{ 
              marginBottom: '70px', 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {error && (
              <div style={{
                padding: '16px',
                backgroundColor: 'var(--error-color)',
                color: 'white',
                borderRadius: 'var(--border-radius)',
                fontSize: '14px',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  {error}
                </div>
                {error.includes('Location blocked') && (
                  <div style={{
                    fontSize: '12px',
                    opacity: '0.9',
                    marginTop: '8px'
                  }}>
                    <strong>Quick fix:</strong> Tap the "aA" icon in Safari's address bar → Website Settings → Location → Allow
                  </div>
                )}
                {error.includes('HTTPS') && (
                  <div style={{
                    fontSize: '12px',
                    opacity: '0.9',
                    marginTop: '8px'
                  }}>
                    <strong>Current URL:</strong> {window.location.href}
                  </div>
                )}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              border: '2px solid var(--border-color)',
              borderRadius: '12px',
              backgroundColor: 'var(--background)',
              transition: 'all 0.2s ease',
            }}>
              <MapPin 
                size={18} 
                style={{
                  color: 'var(--primary-color)',
                  marginRight: '12px',
                  flexShrink: 0
                }}
              />
              <span style={{
                color: location ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: '16px',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {location || 'Enter an address to tour'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Input Overlay */}
      <AnimatePresence>
        {isInputExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'var(--background)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div style={{
              width: '100%',
              maxWidth: '430px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--background)'
            }}>
            {/* Header - matches main screen style */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="header"
              style={{ position: 'relative' }}
            >
              <BackButton onClick={handleCloseExpandedInput} />
              <h2 className="header-title">Search Location</h2>
              {/* Empty spacer to balance the header */}
              <div style={{ width: '36px', height: '36px' }} />
            </motion.div>

            {/* Input Area */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              style={{
                padding: '16px 20px'
              }}
            >
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start'
              }}>
                <div
                  onClick={!isRequestingLocation ? getCurrentLocation : undefined}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    cursor: isRequestingLocation ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px'
                  }}
                >
                  {isRequestingLocation ? (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid var(--border-color)',
                      borderTop: '2px solid var(--primary-color)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <MapPin 
                      size={18} 
                      style={{
                        color: 'var(--primary-color)',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                      }}
                    />
                  )}
                </div>
                <textarea
                  ref={inputRef}
                  value={location}
                  onChange={handleLocationChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputFocus}
                  autoFocus
                  rows={1}
                  style={{
                    width: '100%',
                    padding: '16px 48px 16px 48px',
                    border: '2px solid var(--primary-color)',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    resize: 'none',
                    overflow: 'hidden',
                    minHeight: '54px',
                    maxHeight: '120px',
                    lineHeight: '1.4',
                    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.15)'
                  }}
                  placeholder="Enter an address to tour"
                />
                
                {isLoadingSuggestions && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
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
            </motion.div>

            {/* Suggestions List - Full remaining space */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              ref={suggestionsRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: 'var(--background)'
              }}
            >
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.place_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    style={{
                      padding: '16px 20px',
                      cursor: 'pointer',
                      backgroundColor: index === selectedSuggestionIndex ? 'var(--primary-color)' : 'transparent',
                      color: index === selectedSuggestionIndex ? 'white' : 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    onMouseLeave={() => setSelectedSuggestionIndex(-1)}
                  >
                    <MapPin 
                      size={18} 
                      style={{ 
                        marginTop: '2px',
                        color: index === selectedSuggestionIndex ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                        flexShrink: 0
                      }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: '500', 
                        fontSize: '16px',
                        marginBottom: '4px'
                      }}>
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: index === selectedSuggestionIndex ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                      }}>
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : location.length > 0 && !isLoadingSuggestions ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <MapPin size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px' }}>
                      {location.length < 2 ? 'Type at least 2 characters to search' : 'No suggestions found'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <MapPin size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                    <div style={{ fontSize: '15px', marginBottom: '8px' }}>
                      Start typing to search for a location
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                      Streets, neighborhoods, landmarks, cities...
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        padding: '12px 20px 32px 20px',
        backgroundColor: 'var(--background)',
        zIndex: isInputExpanded ? 0 : 100
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