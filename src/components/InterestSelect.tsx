import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
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
import StatusBar from './StatusBar';
import { Interest } from '../types';

const InterestSelect: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const interests: Interest[] = [
    { id: 'fiction', name: 'Fiction', icon: '📚' },
    { id: 'skills', name: 'Skills and abilities', icon: '🎯' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'mind', name: 'Mind', icon: '🧠' },
    { id: 'history', name: 'History', icon: '🏛️' },
    { id: 'health', name: 'Health and beauty', icon: '💪' },
    { id: 'comics', name: 'Comics', icon: '🦸' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'psychology', name: 'Psychology', icon: '🧩' },
    { id: 'outlook', name: 'Outlook', icon: '😊' },
    { id: 'children', name: 'For Children', icon: '🧸' },
    { id: 'travel', name: 'Travel and tourism', icon: '✈️' },
    { id: 'scifi', name: 'Sci-fi', icon: '🚀' },
    { id: 'drama', name: 'Drama', icon: '🎭' },
    { id: 'parenting', name: 'Parenting', icon: '👨‍👩‍👧' },
    { id: 'mystery', name: 'Mystery', icon: '🔍' },
    { id: 'biography', name: 'Biography', icon: '📖' },
    { id: 'fantasy', name: 'Fantasy', icon: '🦄' },
    { id: 'food', name: 'Food, drink and nutrition', icon: '🍽️' }
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
      <StatusBar />
      <div className="header">
        <button className="btn-ghost" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="header-title">Select Interests</h2>
        <div style={{ width: '48px' }}></div>
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
                className={`chip ${selectedInterests.includes(interest.id) ? 'selected' : ''}`}
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
        backgroundColor: 'var(--background)',
        borderTop: '1px solid var(--border-color)'
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
        <button 
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginTop: '12px' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default InterestSelect; 