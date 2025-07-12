import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';

const LocationConfirm: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user's current location on component mount
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLocation('45 Smith Street, New York, NY 10001'); // Default location
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address from coordinates
          // For now, we'll use a mock address based on coordinates
          const mockAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(`Location: ${mockAddress}`);
          
          // In a real app, you would use Google Maps Geocoding API here:
          // const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`);
          // const data = await response.json();
          // if (data.results && data.results[0]) {
          //   setLocation(data.results[0].formatted_address);
          // }
          
        } catch (err) {
          setError('Failed to get location details');
          setLocation('45 Smith Street, New York, NY 10001'); // Default location
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLocation('45 Smith Street, New York, NY 10001'); // Default location
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleConfirm = () => {
    if (location.trim()) {
      navigate('/interests', { state: { location } });
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
          <div className="text-center mb-4">
            <h2>Set Your Tour Area</h2>
            <p>Where do you want your tour to focus on?</p>
          </div>

          {/* Google Maps Placeholder */}
          <div style={{
            width: '100%',
            height: '200px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: 'var(--border-radius)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MapPin size={32} style={{ marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Google Maps will be integrated here</p>
              <p style={{ margin: 0, fontSize: '12px', marginTop: '4px' }}>
                Interactive map for location selection
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
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
            
            <textarea
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '16px',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                resize: 'vertical',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter your location or allow location access..."
            />
            
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                backgroundColor: 'transparent',
                border: '1px solid var(--primary-color)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--primary-color)',
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? <Loader size={16} className="spinner" /> : <Navigation size={16} />}
              {isLoading ? 'Getting location...' : 'Use my current location'}
            </button>
          </div>

          <div style={{ marginTop: '40px' }}>
            <button 
              className="btn btn-primary"
              onClick={handleConfirm}
              disabled={!location.trim()}
              style={{
                opacity: !location.trim() ? 0.5 : 1,
                cursor: !location.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <MapPin size={20} />
              Confirm & Continue
            </button>
          </div>

          <p style={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            marginTop: '32px'
          }}>
            Your location is only used to generate relevant tour content and is not stored or shared.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LocationConfirm; 