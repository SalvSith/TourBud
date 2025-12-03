import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Calendar, Loader2, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import tourService from '../services/tourService';

interface TourSummary {
  tourId: string;
  title: string;
  description: string;
  streetName: string;
  city: string;
  country: string;
  estimatedDuration: number;
  distance: string;
  audioStatus: string;
  createdAt: string;
  viewCount: number;
}

const PastTours: React.FC = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        setError(null);
        // For now, fetch all tours. Later when auth is added, pass userId
        const response = await tourService.listTours(20, 0);
        setTours(response.tours || []);
      } catch (err) {
        console.error('Failed to fetch tours:', err);
        setError('Failed to load tours. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit' 
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const formatLocation = (tour: TourSummary) => {
    const parts = [tour.streetName, tour.city].filter(Boolean);
    return parts.join(', ') || 'Unknown location';
  };

  // Loading state
  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/')} />
          <h2 className="header-title">My Tour Collection</h2>
          <ThemeToggle />
        </div>
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            color: 'var(--text-secondary)'
          }}>
            <Loader2 size={40} className="spinning" style={{ marginBottom: '16px' }} />
            <p>Loading your tours...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/')} />
          <h2 className="header-title">My Tour Collection</h2>
          <ThemeToggle />
        </div>
        <div className="container">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="button button-primary"
              style={{ padding: '12px 24px' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (tours.length === 0) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/')} />
          <h2 className="header-title">My Tour Collection</h2>
          <ThemeToggle />
        </div>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'var(--card-background)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <FolderOpen size={36} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
              No tours yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '280px' }}>
              Start exploring your surroundings and create your first audio tour!
            </p>
            <button
              onClick={() => navigate('/')}
              className="button button-primary"
              style={{ padding: '14px 28px' }}
            >
              Create Your First Tour
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">My Tour Collection</h2>
        <ThemeToggle />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {tours.map((tour, index) => (
            <motion.div
              key={tour.tourId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => navigate(`/tour/${tour.tourId}`)}
              style={{
                padding: '16px',
                backgroundColor: 'var(--card-background)',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: index === tours.length - 1 ? '0' : '16px'
              }}
              className="tour-list-item-motion"
            >
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{tour.title}</h3>
              </div>
              
              <p style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                lineHeight: '1.4'
              }}>
                {formatLocation(tour)}
              </p>
              
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                {tour.distance && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '14px' }}>{tour.distance}</span>
                  </div>
                )}
                {tour.estimatedDuration && (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '14px' }}>{formatDuration(tour.estimatedDuration)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Calendar size={16} />
                  <span style={{ fontSize: '14px' }}>{formatDate(tour.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PastTours;
