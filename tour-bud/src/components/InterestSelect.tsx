import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import BurgerMenu from './BurgerMenu';
import BackButton from './BackButton';
import { Interest } from '../types';
import tourService from '../services/tourService';

const InterestSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['history']);
  
  // Get coordinates from navigation state
  const { coordinates } = location.state || {};

  const interests: Interest[] = [
    { id: 'history', name: 'History', icon: '🏛️' },
    { id: 'architecture', name: 'Architecture', icon: '🏗️' },
    { id: 'art', name: 'Art', icon: '🎨' },
    { id: 'culture', name: 'Culture', icon: '🎭' },
    { id: 'politics', name: 'Politics', icon: '🗳️' },
    { id: 'religion', name: 'Religion', icon: '⛪' },
    { id: 'crime', name: 'Crime', icon: '🔍' },
    { id: 'war', name: 'War', icon: '⚔️' },
    { id: 'economy', name: 'Economy', icon: '💰' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'innovation', name: 'Innovation', icon: '💡' },
    { id: 'nature', name: 'Nature', icon: '🌿' },
    { id: 'literature', name: 'Literature', icon: '📚' },
    { id: 'music', name: 'Music', icon: '🎵' },
    { id: 'film-tv', name: 'Film & TV', icon: '🎬' },
    { id: 'design', name: 'Design', icon: '✨' },
    { id: 'food', name: 'Food', icon: '🍽️' },
    { id: 'legends', name: 'Legends', icon: '🐉' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'fashion', name: 'Fashion', icon: '👗' }
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => {
      if (prev.includes(id)) {
        // Remove the interest if it's already selected
        return prev.filter(i => i !== id);
      } else if (prev.length < 3) {
        // Add the interest only if we haven't reached the limit of 3
        return [...prev, id];
      }
      // If we already have 3 interests selected, don't add more
      return prev;
    });
  };

  const handleGenerate = async () => {
    if (selectedInterests.length > 0 && coordinates) {
      try {
        // First, geocode the location to get street info
        const geocodeData = await tourService.geocodeLocation(
          coordinates.latitude,
          coordinates.longitude
        );
        
        navigate('/places', { 
          state: { 
            interests: selectedInterests,
            coordinates: coordinates,
            geocodeData: geocodeData
          } 
        });
      } catch (error) {
        console.error('Failed to geocode location:', error);
        // Fallback to direct generation
        navigate('/generating', { 
          state: { 
            interests: selectedInterests,
            coordinates: coordinates 
          } 
        });
      }
    }
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/location')} />
        <h2 className="header-title">Select Interests</h2>
        <BurgerMenu />
      </div>
      
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '80px'
          }}>
            {interests.map((interest, index) => {
              const isSelected = selectedInterests.includes(interest.id);
              const isDisabled = !isSelected && selectedInterests.length >= 3;
              
              return (
                <motion.button
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`chip-motion ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest.id)}
                  disabled={isDisabled}
                  style={{
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{interest.icon}</span>
                  <span>{interest.name}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '430px',
        padding: '12px 20px 66px 20px',
        backgroundColor: 'var(--background)',
        zIndex: 100
      }}>
        <button 
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={selectedInterests.length === 0}
          style={{
            opacity: selectedInterests.length === 0 ? 0.5 : 1,
            cursor: selectedInterests.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default InterestSelect; 