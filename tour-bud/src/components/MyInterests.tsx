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

const MyInterests: React.FC = () => {
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

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">Interests</h2>
        <ThemeToggle />
      </div>
      
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ 
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '16px', 
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Select your interests to personalize your tour recommendations
            </p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            marginBottom: '40px'
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
          
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid var(--border-color)',
            textAlign: 'center',
            marginTop: '32px'
          }}>
            <div style={{
              fontSize: '24px',
              marginBottom: '8px'
            }}>
              ✨
            </div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0'
            }}>
              {selectedInterests.length} Interest{selectedInterests.length !== 1 ? 's' : ''} Selected
            </h3>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Your preferences will be saved and used for future tour recommendations
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MyInterests; 