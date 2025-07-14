import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, User, Mail, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import BackButton from './BackButton';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('Peter Smith');
  const [email] = useState('peter.smith@gmail.com'); // Read-only from Google
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Placeholder for saving user data

    setIsEditing(false);
    // In a real app, you'd make an API call here
  };

  const handleProfilePictureChange = () => {
    // Placeholder for profile picture change

    // In a real app, you'd open a file picker or camera
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">My Account</h2>
        <ThemeToggle />
      </div>
      
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Picture Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '40px'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: 'var(--secondary-color)',
                backgroundImage: `url("https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366F1&color=fff&size=100")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '4px solid var(--border-color)'
              }} />
              
              <button
                onClick={handleProfilePictureChange}
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-color)',
                  border: '2px solid var(--background)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="profile-picture-button-hover"
              >
                <Camera size={16} color="white" />
              </button>
            </div>
          </div>

          {/* Form Section */}
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            {/* Full Name Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={!isEditing}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  backgroundColor: isEditing ? 'var(--background)' : 'var(--secondary-color)',
                  color: 'var(--text-primary)',
                  cursor: isEditing ? 'text' : 'not-allowed',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled={true}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  backgroundColor: 'var(--secondary-color)',
                  color: 'var(--text-secondary)',
                  cursor: 'not-allowed'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: 'var(--text-light)',
                margin: '8px 0 0 0',
                lineHeight: '1.4'
              }}>
                🔒 Email provided by Google, cannot be changed.
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      // Reset to original value if needed
                    }}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: 'var(--primary-color)',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account; 