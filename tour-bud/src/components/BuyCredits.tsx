import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import BurgerMenu from './BurgerMenu';
import BackButton from './BackButton';

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  popular?: boolean;
}

const BuyCredits: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [purchaseType, setPurchaseType] = useState<'subscription' | 'once-off'>('once-off');
  
  const onceOffPackages: CreditPackage[] = [
    { id: '1', credits: 1, price: 2.99 },
    { id: '2', credits: 3, price: 7.99, popular: true },
    { id: '3', credits: 10, price: 19.99 }
  ];

  const subscriptionPackages: CreditPackage[] = [
    { id: 'sub1', credits: 2, price: 4.99 },
    { id: 'sub2', credits: 5, price: 9.99, popular: true },
    { id: 'sub3', credits: 15, price: 24.99 }
  ];

  const currentPackages = purchaseType === 'subscription' ? subscriptionPackages : onceOffPackages;

  const handlePurchase = () => {
    // In a real app, this would handle payment processing
    alert('Purchase functionality would be implemented here');
    navigate('/');
  };

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/')} />
        <h2 className="header-title">Buy Tours</h2>
        <BurgerMenu />
      </div>

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-4">
            <h3>Choose Your Package</h3>
            <p>{purchaseType === 'subscription' ? 'Monthly recurring credits, cancel anytime' : 'Tours never expire and can be used anytime'}</p>
          </div>

          {/* Segmented Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              display: 'flex',
              backgroundColor: 'var(--card-background)',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '24px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-color)'
            }}
          >
            <button
              onClick={() => {
                setPurchaseType('once-off');
                setSelectedPackage('');
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: purchaseType === 'once-off' ? 'var(--primary-color)' : 'transparent',
                color: purchaseType === 'once-off' ? 'white' : 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {purchaseType === 'once-off' && (
                <motion.div
                  layoutId="segmented-toggle"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: '8px',
                    zIndex: 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                Once off
              </span>
            </button>
            <button
              onClick={() => {
                setPurchaseType('subscription');
                setSelectedPackage('');
              }}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: purchaseType === 'subscription' ? 'var(--primary-color)' : 'transparent',
                color: purchaseType === 'subscription' ? 'white' : 'var(--text-primary)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {purchaseType === 'subscription' && (
                <motion.div
                  layoutId="segmented-toggle"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: '8px',
                    zIndex: 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                Subscription
              </span>
            </button>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '100px' }}>
            {currentPackages.map((pkg: CreditPackage, index: number) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`card-motion ${selectedPackage === pkg.id ? 'selected' : ''}`}
                onClick={() => setSelectedPackage(selectedPackage === pkg.id ? '' : pkg.id)}
                style={{
                  cursor: 'pointer',
                  border: selectedPackage === pkg.id ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  position: 'relative',
                  backgroundColor: selectedPackage === pkg.id ? 'var(--primary-color)' : 'var(--card-background)',
                  color: selectedPackage === pkg.id ? 'white' : 'var(--text-primary)',
                  borderRadius: 'var(--border-radius)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div className="flex-between">
                  <div>
                    <h3 style={{ 
                      fontSize: '24px', 
                      marginBottom: '4px',
                      color: selectedPackage === pkg.id ? 'white' : 'var(--text-primary)'
                    }}>
                      {pkg.credits} Tours{purchaseType === 'subscription' ? ' pm' : ''}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      marginBottom: 0,
                      color: selectedPackage === pkg.id ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'
                    }}>
                      ${(pkg.price / pkg.credits).toFixed(2)} per tour
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: 700,
                      color: selectedPackage === pkg.id ? 'white' : 'var(--primary-color)'
                    }}>
                      ${pkg.price}{purchaseType === 'subscription' ? ' pm' : ''}
                    </div>
                  </div>
                </div>
                
                {selectedPackage === pkg.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '3px solid var(--background)',
                      zIndex: 10
                    }}
                  >
                    <Check size={18} color="white" />
                  </motion.div>
                )}
              </motion.div>
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
        padding: '12px 20px 66px 20px',
        backgroundColor: 'var(--background)',
        zIndex: 100
      }}>
        <button 
          className="btn btn-primary"
          onClick={handlePurchase}
          disabled={!selectedPackage}
          style={{
            opacity: !selectedPackage ? 0.5 : 1,
            cursor: !selectedPackage ? 'not-allowed' : 'pointer'
          }}
        >
          <CreditCard size={20} />
          Continue to Payment
        </button>
      </div>
    </div>
  );
};

export default BuyCredits;
