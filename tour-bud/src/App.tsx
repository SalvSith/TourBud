import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Home from './components/Home';
import LocationConfirm from './components/LocationConfirm';
import InterestSelect from './components/InterestSelect';
import MyInterests from './components/MyInterests';
import Account from './components/Account';
import GeneratingTour from './components/GeneratingTour';
import Tour from './components/Tour';
import PastTours from './components/PastTours';
import BuyCredits from './components/BuyCredits';
import Login from './components/Login';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // Mock user state
  const [user] = useState({
    name: 'Peter',
    credits: 65
  });

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home userName={user.name} credits={user.credits} />} />
          <Route path="/location" element={<LocationConfirm />} />
          <Route path="/interests" element={<InterestSelect />} />
          <Route path="/my-interests" element={<MyInterests />} />
          <Route path="/account" element={<Account />} />
          <Route path="/generating" element={<GeneratingTour />} />
          <Route path="/tour" element={<Tour />} />
          <Route path="/tour/:id" element={<Tour />} />
          <Route path="/past-tours" element={<PastTours />} />
          <Route path="/buy-credits" element={<BuyCredits />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
