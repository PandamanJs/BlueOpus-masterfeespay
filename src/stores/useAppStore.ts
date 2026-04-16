/**
 * ========================================
 * MASTER-FEES APPLICATION STORE
 * ========================================
 * 
 * This is our central state management using Zustand.
 * Think of it as a single source of truth for the entire app.
 * 
 * Why Zustand over Redux?
 * - Much simpler API (no reducers, actions, etc.)
 * - Built-in persistence with localStorage
 * - Better performance (only re-renders components that use changed data)
 * - TypeScript support is fantastic
 * 
 * We're persisting some user data so they don't have to re-enter their info
 * every time they open the app. See the 'partialize' config at the bottom.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaymentData } from '../components/HistoryPage';

/**
 * All possible pages in our 11-page payment flow
 * Used for type-safe navigation throughout the app
 */
export type PageType =
  | "search"
  | "details"
  | "services"
  | "history"
  | "receipts"
  | "pay-fees"
  | "add-services"
  | "checkout"
  | "payment"
  | "processing"
  | "failed"
  | "success"
  | "download-receipt"
  | "registration-portal"
  | "registration-form"
  | "registration-success"
  | "policies"
  | "account-profile";

/**
 * CheckoutService Interface
 * 
 * Represents a single line item in the checkout cart.
 * For example: "Tuition - John Doe - UGX 500,000"
 */
export interface CheckoutService {
  id: string;           // Unique cart ID (may be prefixed: inv-<uuid>, tx-<ref>, fallback-<studentId>)
  description: string;  // What's being purchased (e.g., "School Bus")
  amount: number;       // Cost in ZMW (Zambian Kwacha)
  invoiceNo: string;    // Human-readable invoice reference (format: INV-XXXXX)
  invoice_id?: string;  // Actual invoice UUID for DB linkage (transactions.invoice_id)
  pricing_id?: string;  // Original fee item ID (for new subscription invoice creation)
  studentName: string;  // Which student this service is for
  studentId?: string;   // Admission Number or UUID
  term?: number;        // Optional: The term this service is for
  academicYear?: number; // Optional: The academic year this service is for
  grade?: string;       // Optional: The grade of the student
  schoolId?: string;    // Optional: The UUID of the school
}


/**
 * ========================================
 * APPLICATION STATE INTERFACE
 * ========================================
 * 
 * This defines everything our app needs to remember.
 * We've organized it into logical sections for easier maintenance.
 */
interface AppState {
  // Navigation State
  currentPage: PageType;
  navigationDirection: 'forward' | 'back';

  // Persistence State
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;

  // User State
  selectedSchool: string | null;
  selectedSchoolId: string | null;
  selectedSchoolLogo: string | null;
  vatEnabled: boolean;
  userName: string;
  userPhone: string;
  userEmail: string;
  userId: string;

  // Student Selection State
  selectedStudentIds: string[];

  // Checkout State
  checkoutServices: CheckoutService[];
  paymentAmount: number;

  // Payment State
  paymentReference: string | null;

  // Receipt State
  receiptStudentName: string;
  receiptStudentId: string;
  receiptStudentGrade: string;
  receiptParentName: string;
  receiptPaymentData: Record<string, PaymentData[]>;

  // Tutorial State
  showTutorial: boolean;
  hasSeenTutorial: boolean;

  // Security State - Prevents users from navigating to success page without actually paying
  // We track timestamps to prevent bookmarking the success page and coming back later
  lastCompletedPaymentTimestamp: number | null;
  paymentInProgress: boolean;

  // Navigation Actions
  navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void;
  setNavigationDirection: (direction: 'forward' | 'back') => void;

  // User Actions
  setSelectedSchool: (school: string | null, logo?: string | null, schoolId?: string | null, vatEnabled?: boolean) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setUserEmail: (email: string) => void;
  setUserId: (id: string) => void;
  setUserInfo: (name: string, phone: string, email?: string, id?: string) => void;

  // Student Selection Actions
  setSelectedStudentIds: (ids: string[]) => void;
  addSelectedStudent: (id: string) => void;
  removeSelectedStudent: (id: string) => void;
  clearSelectedStudents: () => void;

  // Checkout Actions
  setCheckoutServices: (services: CheckoutService[]) => void;
  addCheckoutService: (service: CheckoutService) => void;
  removeCheckoutService: (serviceId: string) => void;
  clearCheckoutServices: () => void;
  setPaymentAmount: (amount: number) => void;

  // Payment Actions
  setPaymentReference: (ref: string | null) => void;

  // Receipt Actions
  setReceiptStudent: (name: string, id: string, grade: string, parentName: string) => void;
  setReceiptPaymentData: (data: Record<string, PaymentData[]>) => void;

  // Tutorial Actions
  setShowTutorial: (show: boolean) => void;
  completeTutorial: () => void;

  // Security Actions
  markPaymentComplete: () => void;
  startPaymentProcess: () => void;
  clearPaymentSecurity: () => void;

  // Reset Actions
  resetCheckoutFlow: () => void;
  resetAll: () => void;
}

/**
 * ========================================
 * MAIN STORE CREATION
 * ========================================
 * 
 * This is where the magic happens!
 * 
 * The persist() wrapper automatically saves/loads from localStorage.
 * We're only persisting user info (name, phone, school) - not checkout data.
 * Why? Because we don't want half-completed payments hanging around.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial State
      currentPage: 'search',
      navigationDirection: 'forward',
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      selectedSchool: null,
      selectedSchoolId: null,
      selectedSchoolLogo: null,
      vatEnabled: false,
      userName: '',
      userPhone: '',
      userEmail: '',
      userId: '',
      selectedStudentIds: [],
      checkoutServices: [],
      paymentAmount: 0,
      paymentReference: null,
      receiptStudentName: '',
      receiptStudentId: '',
      receiptStudentGrade: '',
      receiptParentName: '',
      receiptPaymentData: {},
      showTutorial: false,
      hasSeenTutorial: false,
      lastCompletedPaymentTimestamp: null,
      paymentInProgress: false,

      // Navigation Actions
      navigateToPage: (page, direction = 'forward') => {
        set({
          currentPage: page,
          navigationDirection: direction
        });
      },

      setNavigationDirection: (direction) => set({ navigationDirection: direction }),

      // User Actions
      setSelectedSchool: (school, logo = null, schoolId = null, vatEnabled = false) => set({ 
        selectedSchool: school, 
        selectedSchoolLogo: logo,
        selectedSchoolId: schoolId,
        vatEnabled: vatEnabled
      }),

      setUserName: (name) => set({ userName: name }),

      setUserPhone: (phone) => set({ userPhone: phone }),

      setUserEmail: (email) => set({ userEmail: email }),

      setUserId: (id) => set({ userId: id }),

      setUserInfo: (name, phone, email = '', id = '') => set({ userName: name, userPhone: phone, userEmail: email, userId: id }),

      // Student Selection Actions
      setSelectedStudentIds: (ids) => set({ selectedStudentIds: ids }),

      addSelectedStudent: (id) => set((state) => ({
        selectedStudentIds: [...state.selectedStudentIds, id]
      })),

      removeSelectedStudent: (id) => set((state) => ({
        selectedStudentIds: state.selectedStudentIds.filter(studentId => studentId !== id)
      })),

      clearSelectedStudents: () => set({ selectedStudentIds: [] }),

      // Checkout Actions
      setCheckoutServices: (services) => set({ checkoutServices: services }),

      addCheckoutService: (service) => set((state) => ({
        checkoutServices: [...state.checkoutServices, service]
      })),

      removeCheckoutService: (serviceId) => set((state) => ({
        checkoutServices: state.checkoutServices.filter(s => s.id !== serviceId)
      })),

      clearCheckoutServices: () => set({ checkoutServices: [] }),

      setPaymentAmount: (amount) => set({ paymentAmount: amount }),

      // Payment Actions
      setPaymentReference: (ref) => set({ paymentReference: ref }),

      // Receipt Actions
      setReceiptStudent: (name, id, grade, parentName) => set({
        receiptStudentName: name,
        receiptStudentId: id,
        receiptStudentGrade: grade,
        receiptParentName: parentName
      }),

      setReceiptPaymentData: (data) => set({ receiptPaymentData: data }),

      // Tutorial Actions
      setShowTutorial: (show) => set({ showTutorial: show }),

      completeTutorial: () => set({
        showTutorial: false,
        hasSeenTutorial: true
      }),

      // Security Actions
      markPaymentComplete: () => set({
        lastCompletedPaymentTimestamp: Date.now(),
        paymentInProgress: false,
      }),

      startPaymentProcess: () => set({
        paymentInProgress: true
      }),

      clearPaymentSecurity: () => set({
        lastCompletedPaymentTimestamp: null,
        paymentInProgress: false,
      }),

      // Reset Actions
      resetCheckoutFlow: () => set({
        selectedStudentIds: [],
        checkoutServices: [],
        paymentAmount: 0,
        paymentInProgress: false,
      }),

      resetAll: () => set({
        currentPage: 'search',
        navigationDirection: 'forward',
        selectedSchool: null,
        userName: '',
        userPhone: '',
        userEmail: '',
        userId: '',
        selectedStudentIds: [],
        checkoutServices: [],
        paymentAmount: 0,
        receiptStudentName: '',
        receiptStudentId: '',
        receiptStudentGrade: '',
        receiptParentName: '',
        receiptPaymentData: {},
        lastCompletedPaymentTimestamp: null,
        paymentInProgress: false,
      }),
    }),
    {
      name: 'master-fees-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),

      // IMPORTANT: Only persist identity info, NOT navigation or checkout/payment data.
      // currentPage is intentionally excluded — on a fresh browser open the app should
      // always start at search or services, never mid-payment or mid-checkout.
      partialize: (state) => ({
        selectedSchool: state.selectedSchool,
        selectedSchoolId: state.selectedSchoolId,
        selectedSchoolLogo: state.selectedSchoolLogo,
        vatEnabled: state.vatEnabled,
        userName: state.userName,
        userPhone: state.userPhone,
        userEmail: state.userEmail,
        userId: state.userId,
        hasSeenTutorial: state.hasSeenTutorial,
        // NOTE: checkoutServices / selectedStudentIds / currentPage are NOT persisted
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // Sanitize: if somehow a payment-flow page snuck in, reset to a safe page.
          // This is a belt-and-suspenders guard in case older persisted data exists.
          const paymentFlowPages = ['payment', 'checkout', 'processing', 'add-services', 'pay-fees', 'success', 'download-receipt', 'failed'];
          if (paymentFlowPages.includes(state.currentPage as string)) {
            state.currentPage = state.userPhone ? 'services' : 'search';
          }
        }
      },
    }
  )
);

/**
 * ========================================
 * SELECTOR HOOKS
 * ========================================
 * 
 * These are performance optimizations!
 * 
 * Instead of doing: const { userName, userPhone } = useAppStore()
 * Which would re-render whenever ANY state changes...
 * 
 * Do this: const { userName, userPhone } = useUserInfo()
 * Which only re-renders when userName or userPhone changes
 * 
 * This is especially important for components that render frequently.
 */

// Navigation - for pages that need to know where we are
export const useCurrentPage = () => useAppStore((state) => state.currentPage);
export const useNavigationDirection = () => useAppStore((state) => state.navigationDirection);

// User Selectors
export const useUserInfo = () => useAppStore((state) => ({
  userName: state.userName,
  userPhone: state.userPhone,
  userEmail: state.userEmail,
  userId: state.userId,
  selectedSchool: state.selectedSchool,
  selectedSchoolId: state.selectedSchoolId,
  selectedSchoolLogo: state.selectedSchoolLogo,
  vatEnabled: state.vatEnabled,
}));

// Checkout Selectors
export const useCheckoutData = () => useAppStore((state) => ({
  checkoutServices: state.checkoutServices,
  paymentAmount: state.paymentAmount,
  selectedStudentIds: state.selectedStudentIds,
}));

// Tutorial Selectors
export const useTutorialState = () => useAppStore((state) => ({
  showTutorial: state.showTutorial,
  hasSeenTutorial: state.hasSeenTutorial,
}));
