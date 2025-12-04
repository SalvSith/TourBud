import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import BackButton from './BackButton';
import BurgerMenu from './BurgerMenu';
import tourService from '../services/tourService';
import FindingPlacesLoader from './FindingPlacesLoader';

interface Place {
  name: string;
  type: string[];
  address: string;
  placeId: string;
  rating?: number;
  userRatingsTotal?: number;
  travelDistance?: number; // Travel distance in meters
  travelDuration?: number; // Travel time in seconds
}

interface PlaceSelectionProps {}

const PlaceSelection: React.FC<PlaceSelectionProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAllCategories, setShowAllCategories] = useState(false);


  // Get data from navigation state
  const { coordinates, interests, geocodeData } = location.state || {};

  useEffect(() => {
    if (!coordinates || !interests || !geocodeData) {
      setError('Missing location or interests data');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    fetchPlaces();
  }, [coordinates, interests, geocodeData]);

  // Categories remain collapsed by default - users can expand manually

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      
      const response = await tourService.getPlacesOnStreet(
        geocodeData.streetName || "",
        coordinates.latitude,
        coordinates.longitude
      );
      
      const { places: foundPlaces } = response;
      
      setPlaces(foundPlaces);
      
    } catch (err) {
      console.error('Failed to fetch places:', err);
      setError('Failed to find places in this area');
    } finally {
      setLoading(false);
    }
  };

  const togglePlace = (placeId: string) => {
    setSelectedPlaces(prev => {
      if (prev.includes(placeId)) {
        return prev.filter(id => id !== placeId);
      } else {
        return [...prev, placeId];
      }
    });
  };

  // Categories that are interesting to mention (exclude boring services)
  const interestingCategories = [
    'Food & Drink',
    'Shopping', 
    'Education',
    'Health & Wellness',
    'Sports & Fitness',
    'Entertainment & Recreation',
    'Places of Worship',
    'Government',
    'Lodging'
  ];

  const handleContinue = () => {
    const selectedPlaceObjects = places.filter(p => selectedPlaces.includes(p.placeId));
    
    // Also get nearby places in interesting categories (not selected, but nearby)
    // These are places immediately around them that might be worth mentioning
    const nearbyInterestingPlaces = places
      .filter(p => !selectedPlaces.includes(p.placeId)) // Not already selected
      .filter(p => {
        const { mainCategory } = categorizePlace(p.type, p.name);
        return interestingCategories.includes(mainCategory);
      })
      .slice(0, 15); // Limit to 15 nearby places
    
    navigate('/generating', {
      state: {
        coordinates,
        interests,
        geocodeData,
        selectedPlaces: selectedPlaceObjects,
        nearbyPlaces: nearbyInterestingPlaces // Pass nearby interesting places too
      }
    });
  };

  const categorizePlace = (types: string[], placeName: string) => {
    // First try to get specific types (not generic ones)
    const specificTypes = types.filter(type => 
      !type.includes('establishment') && 
      !type.includes('point_of_interest') && 
      !type.includes('premise')
    );
    
    // If we have specific types, categorize them
    if (specificTypes.length > 0) {
      const primaryType = specificTypes[0];
      return getCategoryFromGoogleType(primaryType);
    }
    
    // If only generic types, try to infer from name
    const lowerName = placeName.toLowerCase();
    if (lowerName.includes('sport') || lowerName.includes('gym') || lowerName.includes('club') || 
        lowerName.includes('complex') || lowerName.includes('fitness') || lowerName.includes('athletic')) {
      return { mainCategory: 'Sports & Fitness', subCategory: 'Sports Facility' };
    }
    if (lowerName.includes('restaurant') || lowerName.includes('cafe') || lowerName.includes('coffee')) {
      return { mainCategory: 'Food & Drink', subCategory: 'Restaurant' };
    }
    if (lowerName.includes('shop') || lowerName.includes('store')) {
      return { mainCategory: 'Shopping', subCategory: 'Shop' };
    }
    
    // Default fallback
    return { mainCategory: 'Local Business', subCategory: 'General' };
  };

  const getCategoryFromGoogleType = (type: string) => {
    const typeToCategory: { [key: string]: { mainCategory: string, subCategory: string } } = {
      // Food & Drink
      'restaurant': { mainCategory: 'Food & Drink', subCategory: 'Restaurant' },
      'cafe': { mainCategory: 'Food & Drink', subCategory: 'Cafe' },
      'bar': { mainCategory: 'Food & Drink', subCategory: 'Bar' },
      'bakery': { mainCategory: 'Food & Drink', subCategory: 'Bakery' },
      'meal_delivery': { mainCategory: 'Food & Drink', subCategory: 'Meal Delivery' },
      'meal_takeaway': { mainCategory: 'Food & Drink', subCategory: 'Takeaway' },
      'fast_food_restaurant': { mainCategory: 'Food & Drink', subCategory: 'Fast Food' },
      'pizza_restaurant': { mainCategory: 'Food & Drink', subCategory: 'Pizza' },
      'ice_cream_shop': { mainCategory: 'Food & Drink', subCategory: 'Ice Cream' },
      'sandwich_shop': { mainCategory: 'Food & Drink', subCategory: 'Sandwich Shop' },
      
      // Shopping
      'store': { mainCategory: 'Shopping', subCategory: 'Store' },
      'supermarket': { mainCategory: 'Shopping', subCategory: 'Supermarket' },
      'clothing_store': { mainCategory: 'Shopping', subCategory: 'Clothing' },
      'electronics_store': { mainCategory: 'Shopping', subCategory: 'Electronics' },
      'book_store': { mainCategory: 'Shopping', subCategory: 'Books' },
      'convenience_store': { mainCategory: 'Shopping', subCategory: 'Convenience' },
      'department_store': { mainCategory: 'Shopping', subCategory: 'Department Store' },
      'shopping_mall': { mainCategory: 'Shopping', subCategory: 'Shopping Mall' },
      'pharmacy': { mainCategory: 'Shopping', subCategory: 'Pharmacy' },
      'grocery_store': { mainCategory: 'Shopping', subCategory: 'Grocery' },
      
      // Sports & Fitness
      'gym': { mainCategory: 'Sports & Fitness', subCategory: 'Gym' },
      'stadium': { mainCategory: 'Sports & Fitness', subCategory: 'Stadium' },
      'sports_complex': { mainCategory: 'Sports & Fitness', subCategory: 'Sports Complex' },
      'sports_club': { mainCategory: 'Sports & Fitness', subCategory: 'Sports Club' },
      'fitness_center': { mainCategory: 'Sports & Fitness', subCategory: 'Fitness Center' },
      'swimming_pool': { mainCategory: 'Sports & Fitness', subCategory: 'Swimming Pool' },
      'golf_course': { mainCategory: 'Sports & Fitness', subCategory: 'Golf Course' },
      'bowling_alley': { mainCategory: 'Sports & Fitness', subCategory: 'Bowling' },
      
      // Entertainment & Recreation
      'movie_theater': { mainCategory: 'Entertainment & Recreation', subCategory: 'Movie Theater' },
      'amusement_park': { mainCategory: 'Entertainment & Recreation', subCategory: 'Amusement Park' },
      'tourist_attraction': { mainCategory: 'Entertainment & Recreation', subCategory: 'Tourist Attraction' },
      'park': { mainCategory: 'Entertainment & Recreation', subCategory: 'Park' },
      'museum': { mainCategory: 'Entertainment & Recreation', subCategory: 'Museum' },
      'art_gallery': { mainCategory: 'Entertainment & Recreation', subCategory: 'Art Gallery' },
      'zoo': { mainCategory: 'Entertainment & Recreation', subCategory: 'Zoo' },
      'aquarium': { mainCategory: 'Entertainment & Recreation', subCategory: 'Aquarium' },
      'casino': { mainCategory: 'Entertainment & Recreation', subCategory: 'Casino' },
      'night_club': { mainCategory: 'Entertainment & Recreation', subCategory: 'Night Club' },
      
      // Health & Wellness
      'hospital': { mainCategory: 'Health & Wellness', subCategory: 'Hospital' },
      'doctor': { mainCategory: 'Health & Wellness', subCategory: 'Doctor' },
      'dentist': { mainCategory: 'Health & Wellness', subCategory: 'Dentist' },
      'spa': { mainCategory: 'Health & Wellness', subCategory: 'Spa' },
      'beauty_salon': { mainCategory: 'Health & Wellness', subCategory: 'Beauty Salon' },
      'hair_care': { mainCategory: 'Health & Wellness', subCategory: 'Hair Care' },
      'physiotherapist': { mainCategory: 'Health & Wellness', subCategory: 'Physiotherapist' },
      
      // Services
      'bank': { mainCategory: 'Services', subCategory: 'Bank' },
      'atm': { mainCategory: 'Services', subCategory: 'ATM' },
      'real_estate_agency': { mainCategory: 'Services', subCategory: 'Real Estate' },
      'insurance_agency': { mainCategory: 'Services', subCategory: 'Insurance' },
      'lawyer': { mainCategory: 'Services', subCategory: 'Legal' },
      'veterinary_care': { mainCategory: 'Services', subCategory: 'Veterinary' },
      'travel_agency': { mainCategory: 'Services', subCategory: 'Travel' },
      'moving_company': { mainCategory: 'Services', subCategory: 'Moving' },
      'storage': { mainCategory: 'Services', subCategory: 'Storage' },
      'post_office': { mainCategory: 'Services', subCategory: 'Postal' },
      
      // Transportation
      'gas_station': { mainCategory: 'Transportation', subCategory: 'Gas Station' },
      'parking': { mainCategory: 'Transportation', subCategory: 'Parking' },
      'subway_station': { mainCategory: 'Transportation', subCategory: 'Subway' },
      'train_station': { mainCategory: 'Transportation', subCategory: 'Train' },
      'bus_station': { mainCategory: 'Transportation', subCategory: 'Bus' },
      'taxi_stand': { mainCategory: 'Transportation', subCategory: 'Taxi' },
      'airport': { mainCategory: 'Transportation', subCategory: 'Airport' },
      
      // Automotive
      'car_dealer': { mainCategory: 'Automotive', subCategory: 'Car Dealer' },
      'car_rental': { mainCategory: 'Automotive', subCategory: 'Car Rental' },
      'car_repair': { mainCategory: 'Automotive', subCategory: 'Car Repair' },
      'car_wash': { mainCategory: 'Automotive', subCategory: 'Car Wash' },
      
      // Education
      'school': { mainCategory: 'Education', subCategory: 'School' },
      'university': { mainCategory: 'Education', subCategory: 'University' },
      'library': { mainCategory: 'Education', subCategory: 'Library' },
      'primary_school': { mainCategory: 'Education', subCategory: 'Primary School' },
      'secondary_school': { mainCategory: 'Education', subCategory: 'Secondary School' },
      
      // Places of Worship
      'church': { mainCategory: 'Places of Worship', subCategory: 'Church' },
      'mosque': { mainCategory: 'Places of Worship', subCategory: 'Mosque' },
      'synagogue': { mainCategory: 'Places of Worship', subCategory: 'Synagogue' },
      'hindu_temple': { mainCategory: 'Places of Worship', subCategory: 'Hindu Temple' },
      
      // Government
      'city_hall': { mainCategory: 'Government', subCategory: 'City Hall' },
      'courthouse': { mainCategory: 'Government', subCategory: 'Courthouse' },
      'police': { mainCategory: 'Government', subCategory: 'Police' },
      'fire_station': { mainCategory: 'Government', subCategory: 'Fire Station' },
      'embassy': { mainCategory: 'Government', subCategory: 'Embassy' },
      'local_government_office': { mainCategory: 'Government', subCategory: 'Government Office' },
      
      // Lodging
      'lodging': { mainCategory: 'Lodging', subCategory: 'Hotel' },
      'rv_park': { mainCategory: 'Lodging', subCategory: 'RV Park' },
      'campground': { mainCategory: 'Lodging', subCategory: 'Campground' }
    };

    const formatted = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return typeToCategory[type] || { mainCategory: 'Local Business', subCategory: formatted };
  };

  const formatTravelInfo = (place: Place) => {
    if (!place.travelDistance) return null;
    
    const distanceKm = (place.travelDistance / 1000).toFixed(1);
    const walkingTime = place.travelDuration ? Math.round(place.travelDuration / 60) : null;
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        color: 'var(--primary-color)',
        fontSize: '12px',
        fontWeight: '500'
      }}>
        🚶‍♀️ {distanceKm}km {walkingTime && `• ${walkingTime}min walk`}
      </div>
    );
  };

  const groupPlacesByCategory = () => {
    const grouped: { [mainCategory: string]: { [subCategory: string]: Place[] } } = {};
    
    places.forEach(place => {
      const { mainCategory, subCategory } = categorizePlace(place.type, place.name);
      
      if (!grouped[mainCategory]) {
        grouped[mainCategory] = {};
      }
      if (!grouped[mainCategory][subCategory]) {
        grouped[mainCategory][subCategory] = [];
      }
      grouped[mainCategory][subCategory].push(place);
    });

    // Define tour-focused category priority order
    const categoryPriority = [
      'Entertainment & Recreation',
      'Places of Worship', 
      'Food & Drink',
      'Shopping',
      'Education',
      'Health & Wellness',
      'Sports & Fitness',
      'Government',
      'Transportation',
      'Services',
      'Automotive',
      'Lodging',
      'Local Business' // Always at the bottom
    ];

    // Sort main categories by tour relevance priority
    return Object.entries(grouped)
      .sort(([categoryA], [categoryB]) => {
        const priorityA = categoryPriority.indexOf(categoryA);
        const priorityB = categoryPriority.indexOf(categoryB);
        
        // If category not in priority list, put it before Local Business but after defined ones
        const indexA = priorityA === -1 ? categoryPriority.length - 1 : priorityA;
        const indexB = priorityB === -1 ? categoryPriority.length - 1 : priorityB;
        
        return indexA - indexB;
      })
      .reduce((acc, [mainCategory, subCategories]) => {
        // Sort subcategories by number of places (descending)
        acc[mainCategory] = Object.entries(subCategories)
          .sort(([, a], [, second]) => second.length - a.length)
          .reduce((subAcc, [subCategory, places]) => {
            subAcc[subCategory] = places;
            return subAcc;
          }, {} as { [subCategory: string]: Place[] });
        return acc;
      }, {} as { [mainCategory: string]: { [subCategory: string]: Place[] } });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/interests')} />
          <h2 className="header-title">Finding Places</h2>
          <BurgerMenu />
        </div>
        
        <FindingPlacesLoader 
          streetName={geocodeData?.streetName || geocodeData?.formattedAddress || 'your location'}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="header">
          <BackButton onClick={() => navigate('/interests')} />
          <h2 className="header-title">Places</h2>
          <BurgerMenu />
        </div>
        
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button onClick={() => navigate('/interests')} className="retry-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <BackButton onClick={() => navigate('/interests')} />
        <h2 className="header-title">Select Places</h2>
        <BurgerMenu />
      </div>

      <div style={{ padding: '0 20px 20px 20px' }}>
        <div style={{ 
          marginBottom: '20px', 
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          Found {places.length} places near {geocodeData?.streetName || geocodeData?.formattedAddress || 'your location'}
          <br />
          Select places you'd like to learn about in your tour, or skip to explore the street itself
        </div>



        <div className="categories-container" style={{ marginBottom: '120px' }}>
          {Object.entries(groupPlacesByCategory())
            .slice(0, showAllCategories ? undefined : 4)
            .map(([mainCategory, subCategories], categoryIndex) => {
            const isExpanded = expandedCategories.has(mainCategory);
            const totalPlaces = Object.values(subCategories).reduce((sum, places) => sum + places.length, 0);
            const selectedInMainCategory = Object.values(subCategories)
              .flat()
              .filter(place => selectedPlaces.includes(place.placeId)).length;
            
            return (
              <motion.div
                key={mainCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="category-section"
              >
                <div 
                  className="category-header"
                  onClick={() => toggleCategory(mainCategory)}
                >
                  <div className="category-info">
                    <h3 className="category-title">{mainCategory}</h3>
                    <span className="category-count">
                      {totalPlaces} place{totalPlaces !== 1 ? 's' : ''}
                      {selectedInMainCategory > 0 && (
                        <span className="selected-badge"> • {selectedInMainCategory} selected</span>
                      )}
                    </span>
                  </div>
                  <div className="category-toggle">
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="category-places"
                  >
                    {Object.entries(subCategories).map(([subCategory, places]) => (
                      <div key={subCategory} className="subcategory-section">
                        <h4 className="subcategory-title">{subCategory}</h4>
                        <div className="subcategory-places">
                          {places.map((place, index) => (
                            <motion.div
                              key={place.placeId}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`place-card ${selectedPlaces.includes(place.placeId) ? 'selected' : ''}`}
                              onClick={() => togglePlace(place.placeId)}
                            >
                              <div className="place-card-header">
                                <div className="place-selection-icon">
                                  {selectedPlaces.includes(place.placeId) ? (
                                    <CheckCircle size={20} color="var(--primary-color)" />
                                  ) : (
                                    <Circle size={20} color="var(--text-secondary)" />
                                  )}
                                </div>
                                <h3 className="place-name">{place.name}</h3>
                              </div>

                              <div className="place-address">
                                <MapPin size={14} />
                                <span>{place.address}</span>
                              </div>

                              {formatTravelInfo(place)}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          
          {!showAllCategories && Object.entries(groupPlacesByCategory()).length > 4 && (
            <button
              onClick={() => setShowAllCategories(true)}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--card-background)',
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                color: 'var(--primary-color)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <ChevronDown size={20} />
              Show {Object.entries(groupPlacesByCategory()).length - 4} More Categories
            </button>
          )}
        </div>
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
          onClick={handleContinue}
        >
          Generate Tour
        </button>
      </div>

      <style>{`
        .error-container {
          padding: 40px 20px;
          text-align: center;
        }

        .error-text {
          color: var(--error-color);
          margin-bottom: 20px;
        }

        .retry-button {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
        }

        .categories-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-section {
          background: var(--card-background);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          cursor: pointer;
          background: var(--secondary-color);
          border-bottom: 1px solid var(--border-color);
          transition: all 0.3s ease;
        }

        .category-header:hover {
          background: rgba(79, 70, 229, 0.1);
        }

        .category-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .category-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .category-count {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .selected-badge {
          color: var(--primary-color);
          font-weight: 600;
        }

        .category-toggle {
          color: var(--text-secondary);
          transition: transform 0.3s ease;
        }

        .category-places {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--background);
        }

        .subcategory-section {
          background: var(--card-background);
          border-radius: 12px;
          padding: 16px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        .subcategory-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-color);
          margin: 0 0 12px 0;
          padding: 6px 12px;
          background: rgba(79, 70, 229, 0.1);
          border-radius: 8px;
          display: inline-block;
        }

        .subcategory-places {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .place-card {
          background: var(--background);
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }

        .place-card:hover {
          border-color: var(--primary-color);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .place-card.selected {
          border-color: var(--primary-color);
          background: rgba(79, 70, 229, 0.1);
          box-shadow: var(--shadow-md);
        }

        .place-card-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 8px;
        }

        .place-selection-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .place-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.3;
        }

        .place-address {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .place-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 8px;
        }

        .place-types {
          color: var(--text-secondary);
          font-size: 12px;
          background: var(--secondary-color);
          padding: 4px 8px;
          border-radius: 6px;
          display: inline-block;
        }


      `}</style>
    </div>
  );
};

export default PlaceSelection; 