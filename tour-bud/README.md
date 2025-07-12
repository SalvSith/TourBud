# TourBud 🗺️

A beautiful, mobile-first React web application that generates personalized audio tours based on user location and interests.

## Features

- **Home Screen**: Welcome interface with user credits and navigation
- **Interest Selection**: Choose from various categories to personalize your tour
- **Tour Generation**: AI-powered tour content generation with loading animation
- **Active Tours**: Display current tour content with audio controls
- **Past Tours**: History of completed tours
- **Buy Credits**: Credit purchasing system with multiple packages
- **Tours Near Me**: Discover nearby available tours

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Framer Motion** for smooth animations
- **Lucide React** for beautiful icons
- **CSS Custom Properties** for consistent theming
- **Mobile-first responsive design**

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Project Structure

```
src/
├── components/           # React components
│   ├── Home.tsx         # Home screen
│   ├── InterestSelect.tsx # Interest selection
│   ├── GeneratingTour.tsx # Loading screen
│   ├── Tour.tsx         # Active tour display
│   ├── PastTours.tsx    # Tour history
│   ├── BuyCredits.tsx   # Credit purchase
│   ├── ToursNearMe.tsx  # Nearby tours
│   └── StatusBar.tsx    # Mobile status bar
├── types/               # TypeScript interfaces
├── App.tsx              # Main app with routing
├── App.css              # Global styles
└── index.tsx            # App entry point
```

## Design Philosophy

- **Mobile-first**: Designed for mobile devices with a max-width of 430px
- **Beautiful UI**: Modern design with smooth animations and micro-interactions
- **Accessibility**: Semantic HTML and proper ARIA labels
- **Performance**: Optimized with lazy loading and efficient state management

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Removes the build tool and configuration choices

## Future Enhancements

- Real geolocation integration
- Audio playback functionality
- Push notifications for tour updates
- Social sharing features
- Offline tour caching
- Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
