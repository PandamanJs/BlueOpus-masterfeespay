# Master-Fees Payment System

**A modern, mobile-friendly school fees payment application built with React and TypeScript.**

**Author:** Charley Louis Siwale

---

## What is Master-Fees?

Master-Fees is a touchscreen-friendly payment application designed for schools in Uganda. Parents can pay school fees, view payment history, and download receipts - all from their mobile device.

**Currently supports 6 institutions:**
- Twalumbu Educational Center
- Chimilute Academy  
- Julani Primary School
- Crested Crane International
- International Maarif School
- African Christian University (ACU)

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Demo Mode

**This app runs in DEMO/SIMULATION mode** - no real payments are processed. Perfect for:
- Testing the user experience
- Training staff
- Demonstrating to stakeholders
- Development purposes

All payments are simulated with a 2-second processing delay.

---

## Features

### Payment Processing
- Pay fees for multiple students at once
- Select multiple services (tuition, canteen, school bus, etc.)
- Real-time total calculation with 2% service fee
- Mobile Money and Bank Card options

### Mobile-First Design
- Touchscreen-optimized interface
- Smooth animations and transitions
- Apple-inspired glassmorphism effects
- Responsive on all devices

### Receipt Management
- Auto-generated PDF receipts
- QR codes for verification
- Payment history by student
- Download receipts anytime

### Beautiful UI
- Green color scheme (#95e36c and #003630)
- Animated wave effects
- Dynamic Island notifications (iOS style)
- Glassmorphism cards and shadows

### Security
- Multi-layer page protection
- No back button after payment
- 5-minute session timeouts
- Payment flow validation

### Smart Features
- Auto-fills last used phone number
- Pre-selects frequently chosen students
- Remembers preferred payment method
- Interactive tutorial for first-time users

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Tailwind CSS v4** | Styling |
| **Zustand** | State management |
| **Motion** (Framer Motion) | Animations |
| **Supabase** | Backend & database |
| **jsPDF** | Receipt generation |

---

## How to Use

### For Parents

1. **Select Your School** - Type and choose from the list
2. **Enter Your Info** - Name and phone number
3. **Pay Fees** - Select students and services
4. **Checkout** - Review your cart
5. **Pay** - Choose payment method (demo only)
6. **Get Receipt** - Download PDF receipt

### For Developers

```typescript
// All school data is in:
/data/schoolData.ts

// Add a new school:
export const SCHOOL_DATABASE = {
  "Your School Name": {
    name: "Your School Name",
    code: "YSN",
    type: "school",
    services: [...],
    parents: [...]
  }
}
```

---

## Project Structure

```
master-fees/
├── /components/          # All page components
│   ├── SearchPage.tsx
│   ├── DetailsPage.tsx
│   ├── ServicesPage.tsx
│   ├── PayFeesPage.tsx
│   └── ...
├── /data/               # School and student data
│   └── schoolData.ts
├── /stores/             # Zustand state management
│   └── useAppStore.ts
├── /utils/              # Helper functions
│   ├── validation.ts
│   ├── preferences.ts
│   └── haptics.ts
├── /supabase/           # Backend server
│   └── functions/
└── App.tsx              # Main app entry
```

---

## Demo Login

Use any of these phone numbers to test:

| School | Phone Number | Parent Name |
|--------|--------------|-------------|
| Twalumbu | 700123456 | Grace Banda |
| Chimilute | 700234567 | James Mwansa |
| Julani | 700345678 | Sarah Phiri |
| Crested Crane | 700456789 | David Zulu |
| International Maarif | 700567890 | Emma Daka |
| ACU | 700111222 | Michael Tembo |

---

## Configuration

### Environment Variables

The app uses Supabase for backend services. Required environment variables are:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

These are already configured in the deployment.

### Customization

**Change Colors:**
Edit `/styles/globals.css` - look for `#95e36c` (green) and `#003630` (dark green)

**Change Service Fee:**
Search for `0.02` in the codebase (currently 2%)

**Add Services:**
Edit the school's `services` array in `/data/schoolData.ts`

---

## Pages Overview

| Page | Purpose |
|------|---------|
| **Search** | Select your school |
| **Details** | Enter name and phone |
| **Services** | Main dashboard |
| **Pay Fees** | Choose students |
| **Add Services** | Select services to pay |
| **Checkout** | Review and confirm |
| **Payment** | Enter payment details |
| **Processing** | 2-second simulation |
| **Success** | Payment confirmation |
| **Download Receipt** | Get PDF receipt |
| **History** | View past payments |

---

## Deployment

The app is configured for Supabase Edge Functions:

```bash
# Deploy to Supabase
npm run deploy
```

Backend server runs at:
```
https://{projectId}.supabase.co/functions/v1/make-server-f6550ac6/
```

---

## Contributing

This is a demo application. For production use:

1. Replace demo data with real database
2. Integrate actual payment gateway (e.g., Flutterwave, Paystack)
3. Add email confirmation system
4. Implement real authentication
5. Add admin dashboard

---

## License

This project is for demonstration purposes. 

Built with care by **Charley Louis Siwale**

---

## Support

For questions or issues, contact the development team.

**Remember:** This is a DEMO application. No real payments are processed.

---

## Acknowledgments

Special thanks to:
- The React and TypeScript communities
- Tailwind CSS for the amazing styling framework
- Supabase for the backend infrastructure
- All the schools participating in the demo

---

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Demo/Simulation Mode Active
