import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, ChevronRight, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { SUPABASE_CONFIG } from '../config/supabase';

const Tour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [timeRemaining, setTimeRemaining] = useState(45); // minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get tour data from navigation state
  const { tourData, location: tourLocation } = location.state || {};

  // Use actual tour data or fallback to defaults
  const tourInfo = tourData ? {
    name: tourData.title,
    description: tourData.description,
    distance: tourData.distance,
    duration: tourData.estimatedDuration,
    plays: Math.floor(Math.random() * 2000) + 500 // Random play count for demo
  } : {
    name: 'Historical Downtown Walk',
    description: 'Explore the city\'s founding stories and colonial architecture',
    distance: '0.8 mi',
    duration: 45,
    plays: 1247
  };

  const currentLocation = tourLocation || '45 Smith Street, New York, NY';

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
        body: JSON.stringify({ address })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch map URL: ${response.status}`);
      }

      const data = await response.json();
      setMapUrl(data.mapUrl);
    } catch (error) {
      console.error('Error fetching map URL:', error);
      setMapError(error instanceof Error ? error.message : 'Failed to load map');
    } finally {
      setMapLoading(false);
    }
  };

  const tourContent = tourData?.narration || `Welcome to your walking tour! We're sorry, but it seems the tour content didn't load properly. This might be because you're viewing this page directly without going through the tour generation process.

To experience a full tour:
1. Go back to the home page
2. Click "Craft New Tour"
3. Allow location access or enter your location
4. Select your interests
5. Wait for the tour to generate

Your personalized tour will include fascinating historical stories, architectural insights, and local legends tailored to your interests and location.`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          navigate('/past-tours');
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [navigate]);

  // Fetch map URL when component mounts or location changes
  useEffect(() => {
    if (currentLocation) {
      fetchMapUrl(currentLocation);
    }
  }, [currentLocation]);

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h3 className="header-title">
          {currentLocation}
        </h3>
        <ThemeToggle />
      </div>

      <div className="container">
        {/* Tour Information Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            padding: '16px',
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '24px'
          }}
        >
          {/* Google Maps Screenshot */}
          <div style={{ 
            width: '100%',
            height: '120px',
            backgroundColor: 'var(--secondary-color)',
            borderRadius: '12px',
            marginBottom: '16px',
            backgroundImage: mapUrl ? `url("${mapUrl}")` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {mapLoading ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>Loading map...</div>
              </div>
            ) : mapError ? (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>{currentLocation}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Map unavailable
                </div>
              </div>
            ) : mapUrl ? (
              // Overlay with location info when map is loaded
              <div style={{
                position: 'absolute',
                bottom: '8px',
                left: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#333',
                backdropFilter: 'blur(4px)'
              }}>
                <MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} />
                {currentLocation.length > 30 ? `${currentLocation.substring(0, 30)}...` : currentLocation}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--background)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                <MapPin size={20} style={{ marginBottom: '4px' }} />
                <div>{currentLocation}</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  No map available
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: 0 }}>{tourInfo.name}</h3>
          </div>
          
          <p style={{ 
            fontSize: '14px', 
            color: 'var(--text-secondary)',
            marginBottom: '12px',
            lineHeight: '1.4'
          }}>
            {tourInfo.description}
          </p>
          
          <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <MapPin size={16} />
              <span style={{ fontSize: '14px' }}>{tourInfo.distance}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Clock size={16} />
              <span style={{ fontSize: '14px' }}>{tourInfo.duration} min</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Play size={16} />
              <span style={{ fontSize: '14px' }}>{tourInfo.plays.toLocaleString()}</span>
            </div>
          </div>
        </motion.div>

        <motion.button 
          className="btn btn-primary"
          onClick={() => setIsPlaying(!isPlaying)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            marginBottom: '24px',
            backgroundColor: isPlaying ? 'var(--success-color)' : 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          {isPlaying ? 'Pause Tour' : 'Start Tour'}
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: 'var(--border-radius)',
            padding: '24px',
            marginBottom: '80px'
          }}>
            <p style={{ 
              fontSize: '16px', 
              lineHeight: '1.8',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {tourContent}
            </p>
          </div>
        </motion.div>
      </div>


    </div>
  );
};

export default Tour;
