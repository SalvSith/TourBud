import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, FileText, Mic, CheckCircle, Check } from 'lucide-react';

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

  const steps: LoadingStep[] = [
    {
      id: 1,
      title: "Conducting Deep Research",
      description: "Gathering fascinating stories, historical facts, and hidden gems about your destination",
      icon: <Search size={24} />,
      duration: 900
    },
    {
      id: 2,
      title: "Preparing Tour Content",
      description: "Crafting engaging narratives and curating the most interesting points of discovery",
      icon: <FileText size={24} />,
      duration: 900
    },
    {
      id: 3,
      title: "Setting Up Voice Guide",
      description: "Preparing your personal AI narrator with perfect timing and pronunciation",
      icon: <Mic size={24} />,
      duration: 800
    },
    {
      id: 4,
      title: "Adding Final Touches",
      description: "Optimizing your route and ensuring everything is perfectly tailored for you",
      icon: <CheckCircle size={24} />,
      duration: 700
    }
  ];

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;

    const startStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        // All steps completed, navigate to tour
        navigate('/tour', { 
          state: { 
            tourId: '1',
            location: '45 Smith Street',
            part: 1
          } 
        });
        return;
      }

      setCurrentStep(stepIndex);
      setProgress(0);

      const step = steps[stepIndex];
      const progressIncrement = 100 / (step.duration / 50); // Update every 50ms

      progressTimer = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + progressIncrement;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 50);

      stepTimer = setTimeout(() => {
        clearInterval(progressTimer);
        setProgress(100);
        
        // Mark current step as completed
        setCompletedSteps(prev => [...prev, stepIndex]);
        
        // Small delay before moving to next step
        setTimeout(() => {
          startStep(stepIndex + 1);
        }, 200);
      }, step.duration);
    };

    // Start immediately without any delays
    const initializeAndStart = () => {
      startStep(0); // Start from step 0 immediately
    };

    // Start immediately without delay
    initializeAndStart();

    return () => {
      clearTimeout(stepTimer);
      clearInterval(progressTimer);
    };
  }, [navigate]);

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
