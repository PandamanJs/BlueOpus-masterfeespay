# Master-Fees

**Created by Charley Louis Siwale**

A modern, mobile-responsive web application for paying school fees seamlessly on any device. Built with React, TypeScript, Motion (Framer Motion), and Supabase.

[![Author](https://img.shields.io/badge/Author-Charley%20Louis%20Siwale-blue)](https://github.com/charleysiwale)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![Mobile First](https://img.shields.io/badge/Mobile-First-brightgreen)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

---

**Table of Contents**

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Key Components](#key-components)
- [Data Flow](#data-flow)
- [Payment Processing](#payment-processing)
- [Mobile Optimization](#mobile-optimization)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

---

**Overview**

Master-Fees is a comprehensive school fee payment platform designed to simplify the payment process for parents and educational institutions. The application provides an intuitive interface for selecting students, managing services, processing payments, and generating receipts.

**Key Highlights**

- **Mobile-First Design** - Fully responsive from 320px to 1024px+
- **Smooth Animations** - Motion-powered transitions and feedback
- **Secure Payments** - Integration with payment gateway API
- **Real-Time Updates** - Transaction status tracking
- **PDF Receipts** - Professional receipt generation
- **Tutorial System** - First-time user onboarding
- **Browser History** - Seamless navigation with back/forward support

---

**Features**

**User Experience**
- **School Search** - Auto-suggest dropdown for finding schools
- **Phone Number Entry** - Country code selector with validation
- **Dynamic School Logos** - Displays school branding
- **Student Selection** - Multi-select interface for managing multiple children
- **Service Management** - Add/remove services with real-time price calculation
- **Payment History** - View all past transactions organized by month
- **Receipt Downloads** - Generate and save PDF receipts

**Visual Design**
- **Animated Backgrounds** - Wavy water-like effects on landing page
- **Floating Shapes** - SVG path animations with drawing effects
- **Smooth Transitions** - Direction-aware page animations
- **Interactive Tutorials** - 7-step guided onboarding
- **Brand Colors** - Consistent #003630 (primary) and #95e36c (accent)

**Technical Features**
- **TypeScript** - Full type safety across the codebase
- **Component Architecture** - Modular, reusable components
- **State Management** - React hooks for efficient state handling
- **Form Validation** - Real-time input validation with error messages
- **Error Handling** - Comprehensive error boundaries and fallbacks
- **Performance Optimized** - Lazy loading and code splitting ready

---

**Technology Stack**

**Frontend**
- **React 18+** - UI library
- **TypeScript** - Type safety and developer experience
- **Motion (Framer Motion)** - Animation library
- **Tailwind CSS v4** - Utility-first styling
- **Vite** - Build tool and dev server
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **jsPDF** - PDF generation

**Backend**
- **Supabase Edge Functions** - Serverless backend
- **Hono** - Lightweight web framework
- **Deno** - JavaScript/TypeScript runtime
- **PostgreSQL** - Database (via Supabase)

**Libraries & Tools**
- **ShadCN UI** - Pre-built accessible components
- **date-fns** - Date manipulation
- **Zod** - Schema validation
- **React Hook Form** - Form handling

---

**Project Structure**

```
master-fees/
├── App.tsx                          # Main application entry point
├── index.html                       # HTML entry with viewport config
├── components/                      # React components
│   ├── SchoolDetailsPage.tsx       # Phone number entry page
│   ├── ServicesPage.tsx            # Service selection dashboard
│   ├── PayForSchoolFees.tsx        # Student selection page
│   ├── AddServicesPage.tsx         # Service customization page
│   ├── CheckoutPage.tsx            # Payment summary and checkout
│   ├── PaymentPage.tsx             # Payment processing page
│   ├── ProcessingPage.tsx          # Transaction processing indicator
│   ├── PaymentSuccessPage.tsx      # Success confirmation
│   ├── PaymentFailedPage.tsx       # Error handling
│   ├── DownloadReceiptPage.tsx     # Receipt generation
│   ├── HistoryPage.tsx             # Payment history viewer
│   ├── AllReceipts.tsx             # Receipt list view
│   ├── Tutorial.tsx                # Onboarding tutorial
│   ├── ui/                         # ShadCN UI components
│   └── figma/                      # Figma-imported components
├── data/
│   └── students.ts                 # Mock student and parent data
├── utils/
│   ├── pdfGenerator.ts             # PDF receipt generator
│   └── supabase/
│       └── info.tsx                # Supabase configuration
├── imports/                        # Figma-imported SVGs and components
├── styles/
│   └── globals.css                 # Global styles and CSS reset
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx           # Hono server entry point
│           └── kv_store.tsx        # Key-value store utilities
├── database-schema.md              # Database structure documentation
└── README.md                       # This file
```

---

**Getting Started**

**Prerequisites**

- Node.js 18+ or Deno 1.37+
- npm, yarn, or pnpm
- Supabase account (for backend features)

**Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/master-fees.git
   cd master-fees
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PAYMENT_AUTH_ID=your_payment_gateway_auth_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

**Using Mock Data**

The app comes with pre-configured mock data for testing:

**Test Phone Numbers:**
- `977-123-456` - Mr Stephen Kapambwe (2 students)
- `966-987-654` - Mrs Alice Mwamba (2 students)

---

**Key Components**

**App.tsx**
Main application component that handles:
- Page routing and navigation
- Browser history management
- Direction-aware page transitions
- Tutorial state management

**SchoolDetailsPage.tsx**
Phone number entry page featuring:
- Country code selector (7 African countries)
- Phone number validation (9-digit format)
- Dynamic school logo display
- Animated decorative shapes

**ServicesPage.tsx**
Dashboard with service tiles:
- Pay School Fees (primary action)
- Payment History
- Animated background waves
- User greeting display

**PayForSchoolFees.tsx**
Student selection interface:
- Multiple student selection with checkboxes
- Outstanding balance indicators
- Disabled state for students without balances
- Responsive grid layout

**AddServicesPage.tsx**
Service management page:
- Add/remove services per student
- Custom service entry with popup
- Real-time price calculation
- Service counter badges

**CheckoutPage.tsx**
Payment summary:
- Service breakdown by student
- Service fee calculation (2%)
- Total amount display
- Edit mode for removing services

**PaymentPage.tsx**
Payment processing:
- Payment method selection (Mobile Money)
- Real-time form validation
- PIN entry for security
- Loading states during processing

**ProcessingPage.tsx**
Transaction status indicator:
- Animated checkmark drawing
- Server-side transaction verification
- Automatic success/failure routing
- Error handling with retry option

**DownloadReceiptPage.tsx**
Receipt generation:
- PDF creation with jsPDF
- Professional receipt layout
- Service breakdown table
- Print-ready formatting

**HistoryPage.tsx**
Payment history viewer:
- Transactions grouped by month
- Status indicators (Paid/Pending)
- Per-student transaction filtering
- View all receipts navigation

**Tutorial.tsx**
Onboarding experience:
- 7-step interactive guide
- Progress indicators
- Skip/dismiss functionality
- localStorage persistence

---

**Data Flow**

```
User Action → Component State → API Call → Backend Processing → Response → UI Update
```

**Example: Payment Flow**

1. **User selects students** → `PayForSchoolFees.tsx`
2. **User adds services** → `AddServicesPage.tsx`
3. **User reviews checkout** → `CheckoutPage.tsx`
4. **User enters payment details** → `PaymentPage.tsx`
5. **Backend processes transaction** → `supabase/functions/server/`
6. **User sees processing indicator** → `ProcessingPage.tsx`
7. **User receives confirmation** → `PaymentSuccessPage.tsx`
8. **User downloads receipt** → `DownloadReceiptPage.tsx`

---

**Payment Processing**

**Architecture**

```
Frontend (React) → Edge Function (Hono) → Payment Gateway API → Database (PostgreSQL)
```

**Payment Gateway Integration**

The app integrates with a payment gateway API for secure transaction processing:

1. **Transaction Initiation**
   - Collect payment details from user
   - Generate unique transaction ID
   - Send request to backend

2. **Backend Processing**
   - Validate request data
   - Call payment gateway API
   - Store transaction record

3. **Status Verification**
   - Poll transaction status
   - Update UI with real-time status
   - Handle success/failure scenarios

4. **Receipt Generation**
   - Generate PDF receipt
   - Store transaction history
   - Send confirmation (future: email/SMS)

**Service Fee Calculation**

All payments include a 2% service fee:
```typescript
serviceFee = totalAmount * 0.02;
totalPayable = totalAmount + serviceFee;
```

---

**Mobile Optimization**

**Responsive Breakpoints**

The app is optimized for all modern devices:

| Device | Width | Breakpoint |
|--------|-------|------------|
| iPhone SE | 320px | `xs` |
| iPhone 12 mini | 375px | `sm` |
| iPhone 12/13/14 | 390px | `md` |
| iPhone 14 Pro Max | 428px | `lg` |
| iPad Mini | 768px | `tablet` |
| iPad Pro | 1024px+ | `desktop` |

**Key Mobile Features**

- **16px input font size** - Prevents iOS zoom on focus
- **Touch-optimized targets** - 48px minimum for tap areas
- **Smooth scrolling** - Momentum scrolling on iOS
- **Viewport configuration** - Proper scaling and safe areas
- **Thin scrollbars** - Custom scrollbar styling
- **Gesture support** - Browser back/forward navigation

---

**Database Schema**

The application uses a Supabase PostgreSQL database with the following structure:

**Tables**

1. **transactions**
   - id, user_id, student_id, amount, status, timestamp
   - Stores all payment transactions

2. **students**
   - id, name, parent_id, grade, school_id
   - Student enrollment data

3. **parents**
   - id, name, phone, email
   - Parent/guardian information

4. **services**
   - id, name, price, category, school_id
   - Available services per school

5. **invoices**
   - id, student_id, service_id, amount, due_date, status
   - Outstanding invoices

For full schema details, see `database-schema.md`

---

**API Documentation**

**Health Check**
```
GET /make-server-f6550ac6/health
Response: { "status": "ok" }
```

**Process Payment (Planned)**
```
POST /make-server-f6550ac6/payment/process
Body: {
  amount: number,
  phone: string,
  services: CheckoutService[]
}
Response: {
  success: boolean,
  transactionId: string,
  referenceNumber: string
}
```

**Get Transaction Status (Planned)**
```
GET /make-server-f6550ac6/payment/status/:transactionId
Response: {
  status: "pending" | "completed" | "failed",
  details: {...}
}
```

---

**Future Enhancements**

**Phase 1 - Core Features**
- [ ] Real payment gateway integration
- [ ] Email/SMS receipt delivery
- [ ] Multi-school support
- [ ] Admin dashboard

**Phase 2 - Enhanced UX**
- [ ] Push notifications
- [ ] Recurring payments
- [ ] Payment reminders
- [ ] Installment plans

**Phase 3 - Advanced Features**
- [ ] Mobile app (React Native)
- [ ] Biometric authentication
- [ ] QR code payments
- [ ] Multi-currency support

**Phase 4 - Analytics**
- [ ] Payment analytics dashboard
- [ ] Revenue reports
- [ ] User behavior tracking
- [ ] A/B testing framework

---

**Contributing**

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Code Style Guidelines**

- Use TypeScript for all new files
- Follow existing component structure
- Add JSDoc comments for functions
- Write responsive, mobile-first code
- Test on multiple devices before submitting

---

**License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Author**

**Charley Louis Siwale**

A passionate software developer focused on creating intuitive, accessible web applications that solve real-world problems in the education sector.

**Connect**

- GitHub: [@charleysiwale](https://github.com/charleysiwale)
- Email: charleysiwale@example.com
- LinkedIn: [Charley Louis Siwale](https://linkedin.com/in/charleysiwale)

---

**Acknowledgments**

- **Figma** - For the design-to-code workflow
- **Supabase** - For the backend infrastructure
- **Tailwind CSS** - For the styling framework
- **Motion** - For beautiful animations
- **ShadCN UI** - For accessible component primitives

---

**Notes**

**Development**

- The app uses mock data by default. Connect to Supabase for production data.
- Tutorial shows on first launch. Clear `localStorage` to reset.
- All animations respect `prefers-reduced-motion` preference.

**Production Deployment**

1. Update environment variables
2. Enable Supabase Row Level Security
3. Configure CORS for production domain
4. Set up payment gateway webhooks
5. Enable SSL/HTTPS
6. Configure CDN for static assets

---

**Built with care by Charley Louis Siwale**

*Making school fee payments easier, one transaction at a time.*

---

Last Updated: November 15, 2025
Version: 2.0.0
