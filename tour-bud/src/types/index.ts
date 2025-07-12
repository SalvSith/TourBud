export interface User {
  name: string;
  credits: number;
}

export interface Interest {
  id: string;
  name: string;
  icon: string;
  category?: string;
}

export interface Tour {
  id: string;
  title: string;
  location: string;
  part?: number;
  duration: number; // in minutes
  content: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface AppState {
  user: User | null;
  selectedInterests: string[];
  currentTour: Tour | null;
  pastTours: Tour[];
  isGenerating: boolean;
} 