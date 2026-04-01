/**
 * Checkout State Slice
 * Manages shopping cart and checkout flow
 */

import type { StateCreator } from 'zustand';
import type { CheckoutService } from '../../types';

/**
 * Checkout state interface
 */
export interface CheckoutSlice {
  // State
  selectedStudentIds: string[];
  checkoutServices: CheckoutService[];
  paymentAmount: number;

  // Actions
  setSelectedStudentIds: (ids: string[]) => void;
  addSelectedStudent: (id: string) => void;
  removeSelectedStudent: (id: string) => void;
  clearSelectedStudents: () => void;
  
  setCheckoutServices: (services: CheckoutService[]) => void;
  addCheckoutService: (service: CheckoutService) => void;
  removeCheckoutService: (serviceId: string) => void;
  updateCheckoutService: (serviceId: string, updates: Partial<CheckoutService>) => void;
  clearCheckoutServices: () => void;
  
  setPaymentAmount: (amount: number) => void;
  calculateTotal: () => number;
  resetCheckoutFlow: () => void;
}

/**
 * Create checkout slice
 */
export const createCheckoutSlice: StateCreator<
  CheckoutSlice,
  [],
  [],
  CheckoutSlice
> = (set, get) => ({
  // Initial state
  selectedStudentIds: [],
  checkoutServices: [],
  paymentAmount: 0,

  // Student selection actions
  setSelectedStudentIds: (ids) => {
    set({ selectedStudentIds: ids });
  },

  addSelectedStudent: (id) => {
    const current = get().selectedStudentIds;
    if (!current.includes(id)) {
      set({ selectedStudentIds: [...current, id] });
    }
  },

  removeSelectedStudent: (id) => {
    const current = get().selectedStudentIds;
    set({ selectedStudentIds: current.filter(studentId => studentId !== id) });
  },

  clearSelectedStudents: () => {
    set({ selectedStudentIds: [] });
  },

  // Checkout services actions
  setCheckoutServices: (services) => {
    set({ checkoutServices: services });
    // Auto-calculate total
    const total = services.reduce((sum, service) => sum + service.amount, 0);
    set({ paymentAmount: total });
  },

  addCheckoutService: (service) => {
    const current = get().checkoutServices;
    const newServices = [...current, service];
    set({ checkoutServices: newServices });
    // Auto-calculate total
    const total = newServices.reduce((sum, s) => sum + s.amount, 0);
    set({ paymentAmount: total });
  },

  removeCheckoutService: (serviceId) => {
    const current = get().checkoutServices;
    const newServices = current.filter(s => s.id !== serviceId);
    set({ checkoutServices: newServices });
    // Auto-calculate total
    const total = newServices.reduce((sum, s) => sum + s.amount, 0);
    set({ paymentAmount: total });
  },

  updateCheckoutService: (serviceId, updates) => {
    const current = get().checkoutServices;
    const newServices = current.map(s => 
      s.id === serviceId ? { ...s, ...updates } : s
    );
    set({ checkoutServices: newServices });
    // Auto-calculate total
    const total = newServices.reduce((sum, s) => sum + s.amount, 0);
    set({ paymentAmount: total });
  },

  clearCheckoutServices: () => {
    set({ checkoutServices: [], paymentAmount: 0 });
  },

  // Payment actions
  setPaymentAmount: (amount) => {
    set({ paymentAmount: amount });
  },

  calculateTotal: () => {
    const services = get().checkoutServices;
    return services.reduce((sum, service) => sum + service.amount, 0);
  },

  // Reset actions
  resetCheckoutFlow: () => {
    set({
      selectedStudentIds: [],
      checkoutServices: [],
      paymentAmount: 0,
    });
  },
});
