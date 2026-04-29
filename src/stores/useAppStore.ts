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
  | "account-profile"
  | "children-details"
  | "audit-disputes"
  | "student-manage"
  | "settings";

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
  isDebt?: boolean;     // Optional: Whether this item is considered debt (VAT excluded)
  categoryId?: string;  // Optional: The UUID of the fee category (used for category-specific discounts)
  paymentHistory?: Array<{
    date: string;
    method: string;
    amount: number;
    description?: string;
  }>;
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
  selectedSchoolLencoAccountId: string | null;
  vatEnabled: boolean;
  userName: string;
  userPhone: string;
  userEmail: string;
  userId: string;
  isStaff: boolean; // Flag to track if the current parent is a school staff member

  // Student Selection State
  selectedStudentIds: string[];
  students: any[]; // The list of students for the current user

  // Checkout State
  checkoutServices: CheckoutService[];
  studentServices: Record<string, any[]>; // Mapping of studentId -> Service[]
  inputAmounts: Record<string, number>;    // Mapping of serviceId -> partial amount
  excludedServiceIds: string[];            // List of service IDs to exclude from checkout
  paymentAmount: number;

  // Payment State
  paymentReference: string | null;

  // Receipt State
  receiptStudentName: string;
  receiptStudentId: string;
  receiptStudentGrade: string;
  receiptParentName: string;
  receiptPaymentData: Record<string, PaymentData[]>;



  // Security State - Prevents users from navigating to success page without actually paying
  // We track timestamps to prevent bookmarking the success page and coming back later
  lastCompletedPaymentTimestamp: number | null;
  paymentInProgress: boolean;

  // Navigation Actions
  navigateToPage: (page: PageType, direction?: 'forward' | 'back') => void;
  setNavigationDirection: (direction: 'forward' | 'back') => void;

  // User Actions
  setSelectedSchool: (school: string | null, logo?: string | null, schoolId?: string | null, vatEnabled?: boolean, lencoAccountId?: string | null) => void;
  setUserName: (name: string) => void;
  setUserPhone: (phone: string) => void;
  setUserEmail: (email: string) => void;
  setUserId: (id: string) => void;
  setUserInfo: (name: string, phone: string, email?: string, id?: string) => void;
  setIsStaff: (val: boolean) => void;
  setStudents: (students: any[]) => void;

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
  setStudentServices: (services: Record<string, any[]> | ((prev: Record<string, any[]>) => Record<string, any[]>)) => void;
  setInputAmounts: (amounts: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  setExcludedServiceIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  setPaymentAmount: (amount: number) => void;

  // Payment Actions
  setPaymentReference: (ref: string | null) => void;

  // Receipt Actions
  setReceiptStudent: (name: string, id: string, grade: string, parentName: string) => void;
  setReceiptPaymentData: (data: Record<string, PaymentData[]>) => void;



  // Security Actions
  markPaymentComplete: () => void;
  startPaymentProcess: () => void;
  clearPaymentSecurity: () => void;

  // Reset Actions
  resetCheckoutFlow: () => void;
  editingStudentId: string | null;
  setEditingStudentId: (id: string | null) => void;
  resetAll: () => void;

  // Sync State
  syncVersion: number;
  triggerSync: () => void;
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
      selectedSchoolLencoAccountId: null,
      vatEnabled: false,
      userName: '',
      userPhone: '',
      userEmail: '',
      userId: '',
      isStaff: false,
      selectedStudentIds: [],
      students: [],
      checkoutServices: [],
      studentServices: {},
      inputAmounts: {},
      excludedServiceIds: [],
      paymentAmount: 0,
      paymentReference: null,
      receiptStudentName: '',
      receiptStudentId: '',
      receiptStudentGrade: '',
      receiptParentName: '',
      receiptPaymentData: {},

      lastCompletedPaymentTimestamp: null,
      paymentInProgress: false,
      editingStudentId: null,
      syncVersion: 0,

      // Navigation Actions
      navigateToPage: (page, direction = 'forward') => {
        set({
          currentPage: page,
          navigationDirection: direction
        });
      },

      setNavigationDirection: (direction) => set({ navigationDirection: direction }),

      // User Actions
      setSelectedSchool: (school, logo = null, schoolId = null, vatEnabled = false, lencoAccountId = null) => set({ 
        selectedSchool: school, 
        selectedSchoolLogo: logo,
        selectedSchoolId: schoolId,
        selectedSchoolLencoAccountId: lencoAccountId,
        vatEnabled: vatEnabled
      }),

      setUserName: (name) => set({ userName: name }),

      setUserPhone: (phone) => set({ userPhone: phone }),

      setUserEmail: (email) => set({ userEmail: email }),

      setUserId: (id) => set({ userId: id }),

      setUserInfo: (name, phone, email = '', id = '') => set({ userName: name, userPhone: phone, userEmail: email, userId: id }),

      setIsStaff: (val) => set({ isStaff: val }),

      setStudents: (students) => set({ students }),

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

      removeCheckoutService: (serviceId) => set((state) => {
        const newStudentServices = { ...state.studentServices };
        Object.keys(newStudentServices).forEach(studentId => {
          newStudentServices[studentId] = (newStudentServices[studentId] || []).filter(s => s.id !== serviceId);
        });
        
        return {
          checkoutServices: state.checkoutServices.filter(s => s.id !== serviceId),
          studentServices: newStudentServices
        };
      }),

      clearCheckoutServices: () => set({ checkoutServices: [] }),

      setStudentServices: (services) => set((state) => ({ 
        studentServices: typeof services === 'function' ? services(state.studentServices) : services 
      })),

      setInputAmounts: (amounts) => set((state) => ({ 
        inputAmounts: typeof amounts === 'function' ? amounts(state.inputAmounts) : amounts 
      })),

      setExcludedServiceIds: (ids) => set((state) => ({ 
        excludedServiceIds: typeof ids === 'function' ? ids(state.excludedServiceIds) : ids 
      })),

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



      setEditingStudentId: (id) => set({ editingStudentId: id }),

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
        studentServices: {},
        inputAmounts: {},
        excludedServiceIds: [],
        paymentAmount: 0,
        paymentInProgress: false,
      }),

      resetAll: () => set({
        currentPage: 'search',
        navigationDirection: 'forward',
        selectedSchool: null,
        selectedSchoolId: null,
        selectedSchoolLogo: null,
        selectedSchoolLencoAccountId: null,
        vatEnabled: false,
        userName: '',
        userPhone: '',
        userEmail: '',
        userId: '',
        isStaff: false,
        selectedStudentIds: [],
        students: [],
        checkoutServices: [],
        studentServices: {},
        inputAmounts: {},
        excludedServiceIds: [],
        paymentAmount: 0,
        receiptStudentName: '',
        receiptStudentId: '',
        receiptStudentGrade: '',
        receiptParentName: '',
        receiptPaymentData: {},
        lastCompletedPaymentTimestamp: null,
        paymentInProgress: false,
        editingStudentId: null,
        syncVersion: 0,
      }),

      triggerSync: () => set((state) => ({ syncVersion: state.syncVersion + 1 })),
    }),
    {
      name: 'master-fees-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),

      // Persist identity info AND current progress (services/navigation)
      // This ensures that refreshing the page doesn't lose the cart or redirect to home.
      partialize: (state) => ({
        selectedSchool: state.selectedSchool,
        selectedSchoolId: state.selectedSchoolId,
        selectedSchoolLogo: state.selectedSchoolLogo,
        selectedSchoolLencoAccountId: state.selectedSchoolLencoAccountId,
        vatEnabled: state.vatEnabled,
        userName: state.userName,
        userPhone: state.userPhone,
        userEmail: state.userEmail,
        userId: state.userId,
        isStaff: state.isStaff,

        currentPage: state.currentPage,
        checkoutServices: state.checkoutServices,
        studentServices: state.studentServices,
        selectedStudentIds: state.selectedStudentIds,
        lastCompletedPaymentTimestamp: state.lastCompletedPaymentTimestamp,
        paymentInProgress: state.paymentInProgress,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
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
  selectedSchoolLencoAccountId: state.selectedSchoolLencoAccountId,
  vatEnabled: state.vatEnabled,
}));

// Checkout Selectors
export const useCheckoutData = () => useAppStore((state) => ({
  checkoutServices: state.checkoutServices,
  paymentAmount: state.paymentAmount,
  selectedStudentIds: state.selectedStudentIds,
}));


