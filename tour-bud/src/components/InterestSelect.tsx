import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Book, 
  Briefcase, 
  Brain, 
  Heart, 
  Palette, 
  Microscope, 
  Globe, 
  Baby, 
  Plane, 
  Rocket, 
  Drama, 
  Users, 
  BookOpen, 
  Coffee,
  Sparkles,
  History,
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';
import { Interest } from '../types';

const InterestSelect: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['history']);

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
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleGenerate = () => {
    if (selectedInterests.length > 0) {
      navigate('/generating', { state: { interests: selectedInterests } });
    }
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/location')} />
        <h2 className="header-title">Select Interests</h2>
        <ThemeToggle />
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
            {interests.map((interest, index) => (
              <motion.button
                key={interest.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`chip-motion ${selectedInterests.includes(interest.id) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest.id)}
              >
                <span style={{ fontSize: '16px' }}>{interest.icon}</span>
                <span>{interest.name}</span>
              </motion.button>
            ))}
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
        padding: '20px',
        backgroundColor: 'var(--background)'
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
          Generate Tour
        </button>
      </div>
    </div>
  );
};

export default InterestSelect; 