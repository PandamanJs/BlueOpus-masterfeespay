/**
 * Centralized Type Definitions
 * Single source of truth for all application types
 */

/**
 * Page navigation types
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
  | "download-receipt";

/**
 * Navigation direction for animations
 */
export type NavigationDirection = 'forward' | 'back';

/**
 * Student entity
 */
export interface Student {
  id: string;
  name: string;
  grade: string;
  schoolName: string;
  parentPhone?: string;
  parentName?: string;
}

/**
 * Service entity
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  amount: number;
  category?: string;
  isRecurring?: boolean;
}

/**
 * Checkout service item
 * Represents a service being purchased for a specific student
 */
export interface CheckoutService {
  id: string;
  description: string;
  amount: number;
  invoiceNo: string;
  studentName: string;
  studentId?: string;
}

/**
 * Payment data structure
 */
export interface PaymentData {
  id: string;
  date: string;
  amount: number;
  serviceFee: number;
  totalAmount: number;
  services: CheckoutService[];
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  receiptNumber: string;
  timestamp: number;
}

/**
 * Payment method types
 */
export type PaymentMethod =
  | 'airtel-money'
  | 'mtn-money'
  | 'zamtel-money'
  | 'visa'
  | 'mastercard';

/**
 * Payment status types
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

/**
 * Policy / Payment Plan entity
 */
export interface Policy {
  policy_id: string;
  name: string;
  description: string;
  plan_code: string;
  installments: number;
  frequency: string;
  total_amount: number;
  per_installment: number;
  effective_date: string;
  due_date: string;
  terms: string[];
  category: string;
  school_id: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Payment request payload
 */
export interface PaymentRequest {
  userPhone: string;
  userName: string;
  services: CheckoutService[];
  totalAmount: number;
  serviceFee: number;
  finalAmount: number;
  schoolName: string;
  paymentMethod: PaymentMethod;
}

/**
 * Payment response from server
 */
export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  receiptNumber?: string;
  error?: string;
  message?: string;
}

/**
 * School entity
 */
export interface School {
  id: number | string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  access_code?: string;
  lenco_public_key?: string; // Each school's unique Lenco API key
  uses_forms?: boolean;
  grade_pricing?: Array<{ name: string; label: string; value: string; price: number }>;
  other_services?: Array<{ id: string; name: string; price: number; category: string }>;
  bus_routes?: Array<{ id: string; name: string; price: number; description?: string }>;
  boarding_rooms?: Array<{ id: string; name: string; price: number; capacity?: number }>;
  canteen_plans?: Array<{ id: string; name: string; price: number; description?: string }>;
  category_names?: Record<string, string>;
}

/**
 * User preferences
 */
export interface UserPreferences {
  studentSelections: Record<string, number>;
  serviceSelections: Record<string, number>;
  lastUsedPaymentMethod?: PaymentMethod;
  theme?: 'light' | 'dark';
}

/**
 * API Error response
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Receipt data for PDF generation
 */
export interface ReceiptData {
  receiptNumber: string;
  date: string;
  studentName: string;
  studentId: string;
  schoolName: string;
  services: CheckoutService[];
  subtotal: number;
  serviceFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  parentName: string;
  parentPhone: string;
}

/**
 * Tutorial step
 */
export interface TutorialStep {
  title: string;
  description: string;
  position: "center" | "top" | "bottom";
}

/**
 * Form validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Transaction entity
 */
export interface Transaction {
  id: string;
  parent_id: string;
  student_id: string;
  school_id: string;
  amount: number;
  service_fee: number;
  total_amount: number;
  status: 'pending' | 'successful' | 'failed';
  payment_method: string;
  reference: string;
  meta_data?: Record<string, any>;
  initiated_at: string;
  completed_at?: string;
  created_at: string;
}
