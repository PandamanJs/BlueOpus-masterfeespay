/**
 * User State Slice
 * Manages user information and school selection
 */

import type { StateCreator } from 'zustand';

/**
 * User state interface
 */
export interface UserSlice {
  // State
  selectedSchool: string | null;
  userName: string;
  userPhone: string;

  // Actions
  setSelectedSchool: (school: string | null) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setUserInfo: (name: string, phone: string) => void;
  clearUserInfo: () => void;
}

/**
 * Create user slice
 */
export const createUserSlice: StateCreator<
  UserSlice,
  [],
  [],
  UserSlice
> = (set) => ({
  // Initial state
  selectedSchool: null,
  userName: '',
  userPhone: '',

  // Actions
  setSelectedSchool: (school) => {
    set({ selectedSchool: school });
  },

  setUserName: (name) => {
    set({ userName: name });
  },

  setUserPhone: (phone) => {
    set({ userPhone: phone });
  },

  setUserInfo: (name, phone) => {
    set({ userName: name, userPhone: phone });
  },

  clearUserInfo: () => {
    set({ 
      userName: '', 
      userPhone: '',
      selectedSchool: null,
    });
  },
});
