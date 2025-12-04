import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Save, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import BurgerMenu from './BurgerMenu';
import BackButton from './BackButton';

// Dummy purchase history data
const dummyPurchases = [
  {
    id: 1,
    date: '2024-12-01',
    description: 'Premium Tour Credits (50 credits)',
    type: 'one-off',
    amount: '$24.99'
  },
  {
    id: 2,
    date: '2024-11-15',
    description: 'Monthly Pro Subscription',
    type: 'subscription',
    amount: '$9.99'
  },
  {
    id: 3,
    date: '2024-11-01',
    description: 'Monthly Pro Subscription',
    type: 'subscription',
    amount: '$9.99'
  },
  {
    id: 4,
    date: '2024-10-28',
    description: 'Tour Credits (20 credits)',
    type: 'one-off',
    amount: '$12.99'
  },
  {
    id: 5,
    date: '2024-10-15',
    description: 'Starter Pack (10 credits)',
    type: 'one-off',
    amount: '$4.99'
  }
];

const Account: React.FC = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('Peter');
  const [email] = useState('peter.smith@gmail.com'); // Read-only from Google
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    // Placeholder for saving user data

    setIsEditing(false);
    // In a real app, you'd make an API call here
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">My Account</h2>
        <BurgerMenu />
      </div>
      
      <div className="container">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Form Section */}
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)',
            marginBottom: '24px'
          }}>
            {/* First Name Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
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

          {/* Purchase History Section */}
          <div style={{
            backgroundColor: 'var(--card-background)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid var(--border-color)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Receipt size={20} />
              Purchase History
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dummyPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--background)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  className="purchase-item-hover"
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '3px'
                    }}>
                      {purchase.description}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      {new Date(purchase.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                      <span style={{
                        marginLeft: '6px',
                        padding: '2px 6px',
                        backgroundColor: purchase.type === 'subscription' 
                          ? 'rgba(99, 102, 241, 0.1)' 
                          : 'rgba(34, 197, 94, 0.1)',
                        color: purchase.type === 'subscription' 
                          ? '#6366F1' 
                          : '#22C55E',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500'
                      }}>
                        {purchase.type === 'subscription' ? 'Subscription' : 'One-off'}
                      </span>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    marginLeft: '12px'
                  }}>
                    {purchase.amount}
                  </div>
                </div>
              ))}
            </div>

            {dummyPurchases.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '32px',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                No purchase history yet
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account; 