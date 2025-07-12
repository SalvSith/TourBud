import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

const Login: React.FC = () => {
  const { isDarkMode } = useTheme();

  const handleGoogleLogin = () => {
    // Placeholder for Google login functionality
    console.log('Google login clicked');
  };

  return (
    <div className="app">
      <div className="header">
        <div></div> {/* Empty div for spacing */}
        <div className="header-title"></div>
        <ThemeToggle />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            textAlign: 'center'
          }}
        >
          {/* Logo/Brand Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              marginBottom: '48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
            }}>
              <span style={{ fontSize: '36px' }}>🗺️</span>
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '8px',
              margin: 0
            }}>
              Welcome to TourBud
            </h1>
            <p style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Discover amazing tours tailored just for you
            </p>
          </motion.div>

          {/* Login Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              width: '100%',
              maxWidth: '320px'
            }}
          >
            <button
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: '#FFFFFF',
                border: '2px solid var(--border-color)',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#1F2937',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '24px'
              }}
              className="login-button-hover"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              padding: '16px',
              backgroundColor: 'var(--card-background)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: '1.5'
              }}>
                🔒 Your account is secured with Google's trusted authentication
              </p>
            </div>

            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: 'var(--text-light)',
              lineHeight: '1.5'
            }}>
              By signing in, you agree to our{' '}
              <a href="#" style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" style={{
                color: 'var(--primary-color)',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Privacy Policy
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 