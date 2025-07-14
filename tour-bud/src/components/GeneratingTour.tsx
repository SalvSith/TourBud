import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, Mic, CheckCircle, Check, AlertCircle } from 'lucide-react';
import tourService from '../services/tourService';

interface LoadingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number;
}

const GeneratingTour: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get location, interests, and selected places from navigation state
  const { coordinates, interests, geocodeData, selectedPlaces } = location.state || {};

  const steps: LoadingStep[] = [
    {
      id: 1,
      title: "Preparing Location Data",
      description: "Processing your confirmed location and street information",
      icon: <Search size={24} />,
      duration: 2000
    },
    {
      id: 2,
      title: "Organizing Selected Places",
      description: "Preparing your chosen places for detailed research",
      icon: <FileText size={24} />,
      duration: 3000
    },
    {
      id: 3,
      title: "Researching Street History",
      description: "Web searching for historical context about your street and selected places",
      icon: <Search size={24} />,
      duration: 15000
    },
    {
      id: 4,
      title: "Exploring Your Places",
      description: "Deep research on your selected places: reviews, stories, and significance",
      icon: <Search size={24} />,
      duration: 15000
    },
    {
      id: 5,
      title: "Creating Your Personalized Tour",
      description: "Crafting a walking tour focused on your chosen places and interests",
      icon: <Mic size={24} />,
      duration: 20000
    },
    {
      id: 6,
      title: "Finalizing Experience",
      description: "Optimizing your route and preparing the personalized tour",
      icon: <CheckCircle size={24} />,
      duration: 2000
    }
  ];

  useEffect(() => {
    if (!coordinates || !interests || !geocodeData || !selectedPlaces) {
      setError('Missing location, interests, or selected places data');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    generateTour();
  }, [coordinates, interests, geocodeData, selectedPlaces]);

  const generateTour = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Step 1: Already have geocode data, just show progress
      setCurrentStep(0);
      let progressTimer = startStepProgress(0);
      await new Promise(resolve => setTimeout(resolve, 2000));
      completeStep(0, progressTimer);
      
      // Step 2: Already have selected places, just show progress
      setCurrentStep(1);
      progressTimer = startStepProgress(1);
      await new Promise(resolve => setTimeout(resolve, 3000));
      completeStep(1, progressTimer);
      
      // Step 3-5: Generate tour with web research (this happens all at once but we show progress)
      setCurrentStep(2);
      progressTimer = startStepProgress(2);
      
      // Let historical research step complete
      setTimeout(() => {
        completeStep(2, progressTimer);
        
        // Step 4: Current culture research
        setCurrentStep(3);
        progressTimer = startStepProgress(3);
        
        setTimeout(() => {
          completeStep(3, progressTimer);
          
          // Step 5: Tour creation (the actual API call happens here)
          setCurrentStep(4);
          progressTimer = startStepProgress(4);
        }, 15000); // Match the step duration
      }, 15000); // Match the step duration
      
      const tourData = await tourService.generateTour(
        { ...geocodeData, latitude: coordinates.latitude, longitude: coordinates.longitude },
        selectedPlaces, // Use the selected places instead of all places
        interests
      );
      
      completeStep(4, progressTimer);
      
      // Step 6: Finalize
      setCurrentStep(5);
      progressTimer = startStepProgress(5);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      completeStep(5, progressTimer);
      
      // Navigate to tour page with the generated data
      setTimeout(() => {
        navigate('/tour', {
          state: {
            tourId: tourData.tourId,
            tourData: tourData,
            location: geocodeData.formattedAddress
          }
        });
      }, 500);
      
    } catch (err) {
      console.error('Tour generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate tour');
    }
  };

  const startStepProgress = (stepIndex: number): NodeJS.Timeout => {
    const step = steps[stepIndex];
    const progressIncrement = 100 / (step.duration / 50);
    
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressIncrement;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);
    
    return timer;
  };

  const completeStep = (stepIndex: number, progressTimer: NodeJS.Timeout) => {
    clearInterval(progressTimer);
    setProgress(100);
    setCompletedSteps(prev => [...prev, stepIndex]);
    
    setTimeout(() => {
      setProgress(0);
    }, 200);
  };

  const getStepState = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'upcoming';
  };

  const getStepStyles = (stepIndex: number) => {
    const state = getStepState(stepIndex);
    
    switch (state) {
      case 'completed':
        return {
          border: '2px solid var(--border-color)',
          opacity: 0.5,
          boxShadow: '0 8px 32px transparent'
        };
      case 'active':
        return {
          border: '2px solid var(--primary-color)',
          opacity: 1,
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)'
        };
      default: // upcoming
        return {
          border: '2px solid var(--border-color)',
          opacity: 0.6,
          boxShadow: '0 8px 32px transparent'
        };
    }
  };

  const getIconStyles = (stepIndex: number) => {
    const state = getStepState(stepIndex);
    
    switch (state) {
      case 'completed':
        return {
          backgroundColor: 'var(--border-color)',
          color: 'var(--text-secondary)'
        };
      case 'active':
        return {
          backgroundColor: 'var(--primary-color)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)'
        };
      default: // upcoming
        return {
          backgroundColor: 'var(--border-color)',
          color: 'var(--text-secondary)'
        };
    }
  };

  if (error) {
    return (
      <div className="app">
        <div className="container flex-center" style={{ height: '100vh', padding: '40px 20px' }}>
          <div className="text-center" style={{ maxWidth: '400px' }}>
            <AlertCircle size={48} color="var(--error-color)" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Generation Failed</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/')}
              style={{ marginTop: '24px' }}
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container flex-center" style={{ height: '100vh', padding: '40px 20px' }}>
        <div
          className="text-center"
          style={{ width: '100%', maxWidth: '480px' }}
        >
          {/* Main Title */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0'
            }}>
              Generating
            </h2>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '700',
              color: 'var(--primary-color)',
              margin: 0
            }}>
              Your Tour...
            </h2>
          </div>

          {/* Steps List */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  style={{
                    backgroundColor: 'var(--card-background)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'left',
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    // Apply state-specific styles based on step state
                    ...getStepStyles(index)
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    width: '100%'
                  }}>
                    {/* Step Icon */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      ...getIconStyles(index),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {completedSteps.includes(index) ? <Check size={24} /> : step.icon}
                    </div>

                    {/* Step Content */}
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        margin: '0 0 4px 0'
                      }}>
                        {step.title}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        margin: '0 0 12px 0',
                        lineHeight: '1.4'
                      }}>
                        {step.description}
                      </p>

                      {/* Progress Bar Container (always present for consistent sizing) */}
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: getStepState(index) === 'active' ? 'var(--border-color)' : 'transparent',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        {getStepState(index) === 'active' && (
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                            style={{
                              height: '100%',
                              backgroundColor: 'var(--primary-color)',
                              borderRadius: '2px'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Footer Message */}
          <p style={{ 
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Creating your perfect tour experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingTour;
