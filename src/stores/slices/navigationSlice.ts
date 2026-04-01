/**
 * Navigation State Slice
 * Manages page navigation and history
 */

import type { StateCreator } from 'zustand';
import type { PageType, NavigationDirection } from '../../types';

/**
 * Navigation state interface
 */
export interface NavigationSlice {
  // State
  currentPage: PageType;
  navigationDirection: NavigationDirection;
  navigationHistory: PageType[];

  // Actions
  navigateToPage: (page: PageType, direction?: NavigationDirection) => void;
  setNavigationDirection: (direction: NavigationDirection) => void;
  goBack: () => void;
  clearHistory: () => void;
}

/**
 * Create navigation slice
 */
export const createNavigationSlice: StateCreator<
  NavigationSlice,
  [],
  [],
  NavigationSlice
> = (set, get) => ({
  // Initial state
  currentPage: 'search',
  navigationDirection: 'forward',
  navigationHistory: ['search'],

  // Actions
  navigateToPage: (page, direction = 'forward') => {
    const currentHistory = get().navigationHistory;
    
    set({ 
      currentPage: page, 
      navigationDirection: direction,
      navigationHistory: [...currentHistory, page],
    });
    
    // Update browser history
    const state = { page };
    window.history.pushState(state, '', `#${page}`);
  },

  setNavigationDirection: (direction) => {
    set({ navigationDirection: direction });
  },

  goBack: () => {
    const currentHistory = get().navigationHistory;
    
    if (currentHistory.length > 1) {
      const newHistory = currentHistory.slice(0, -1);
      const previousPage = newHistory[newHistory.length - 1];
      
      set({ 
        currentPage: previousPage,
        navigationDirection: 'back',
        navigationHistory: newHistory,
      });
    }
  },

  clearHistory: () => {
    set({ 
      navigationHistory: ['search'],
      currentPage: 'search',
    });
  },
});
