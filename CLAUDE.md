# PrimeWear - Claude Code Guidelines

## Project Overview
Admin-controlled multi-vendor e-commerce platform with escrow payments (PayHere), built for Sri Lanka market.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache**: Redis (Upstash)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT + Email OTP (Resend)
- **Payments**: PayHere (Sri Lanka)
- **Real-time**: Socket.io
- **Storage**: Cloudinary

## User Roles
1. **Admin** - System owner, full control
2. **Vendor** - Sellers (created by Admin)
3. **Customer** - Buyers (passwordless OTP login)

## Key Business Rules

### Payments & Wallet
- All payments go to platform first (escrow)
- Platform deducts commission (default 10%, configurable per vendor)
- Funds released to vendor wallet ONLY after customer confirms delivery
- Weekly payouts (manual admin approval initially)

### Order Flow
```
Order Placed → Payment (PayHere) → Processing → Shipped → Customer Confirms Delivery → Closed
```
- Vendor can set: Processing, Shipped
- Customer can set: Delivered (final confirmation)
- Vendor CANNOT mark order as delivered

### Cancel/Return Policy
- Cancel: Within 24 hours of order placement
- Return: Within 24 hours of delivery confirmation
- Return shipping paid by customer

### Chat System
- Available ONLY after order is placed
- Contact details (phone, email, social) are BLOCKED/FILTERED
- Admin can view all chat histories

## Project Structure
```
src/
├── app/
│   ├── (auth)/          # Login pages
│   ├── (storefront)/    # Customer-facing pages
│   ├── admin/           # Admin dashboard
│   ├── vendor/          # Vendor dashboard
│   └── api/             # API routes
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── common/          # Shared components
│   └── [feature]/       # Feature-specific components
├── lib/                 # Utilities (prisma, auth, payhere, etc.)
├── services/            # Business logic
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
└── types/               # TypeScript types
```

## Coding Standards

### File Naming
- Components: PascalCase (`ProductCard.tsx`)
- Utilities/hooks: camelCase (`useAuth.ts`)
- API routes: kebab-case folders (`/api/auth/otp-send/route.ts`)

### Component Structure
```tsx
// 1. Imports
// 2. Types/Interfaces
// 3. Component
// 4. Export
```

### API Route Pattern
```typescript
// Always validate input with Zod
// Always check authentication/authorization
// Always return consistent response format
{
  success: boolean;
  data?: any;
  error?: string;
}
```

### Database Operations
- Always use Prisma transactions for multi-table operations
- Always use `Decimal` for money fields
- Always snapshot product data in orders (don't rely on current product data)

### Security Rules
- NEVER expose merchant secret to client
- ALWAYS verify PayHere webhook signatures
- ALWAYS sanitize chat messages for contact info
- ALWAYS use parameterized queries (Prisma handles this)
- NEVER store plain passwords (use bcrypt, cost 12+)

## Environment Variables
Required in `.env`:
```
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_REFRESH_SECRET
PAYHERE_MERCHANT_ID
PAYHERE_MERCHANT_SECRET
PAYHERE_MODE=sandbox
RESEND_API_KEY
EMAIL_FROM
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_APP_URL
```

## Common Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Testing Approach
- Unit tests for services (Jest)
- Integration tests for API routes
- E2E tests for critical flows (Playwright)
- PayHere sandbox testing with test cards

## PayHere Integration Notes
- Sandbox URL: `sandbox.payhere.lk`
- Production URL: `www.payhere.lk`
- Test Visa: `4916217501611292`
- Test Mastercard: `5307732125531191`
- Hash formula: `MD5(merchant_id + order_id + amount + currency + MD5(merchant_secret).toUpperCase()).toUpperCase()`

## Critical Warnings
1. **NEVER** release funds before delivery confirmation
2. **NEVER** allow vendor to mark order as delivered
3. **NEVER** skip webhook signature verification
4. **NEVER** store card data (PayHere handles this)
5. **ALWAYS** filter contact info in chat messages
6. **ALWAYS** use transactions for wallet operations

---

## Implementation Phases

### Phase 1: Project Setup & Configuration
- Initialize Next.js 14 + TypeScript + Tailwind + shadcn/ui
- Set up Prisma with complete database schema
- Configure Supabase PostgreSQL + Upstash Redis
- Create environment configuration

### Phase 2: Authentication System
- JWT token management (access + refresh)
- Admin login (email + password)
- Vendor login (forced password change on first login)
- Customer login (Email OTP via Resend)
- Route protection middleware

### Phase 3: Dashboard Layouts
- Storefront layout (header, footer, nav)
- Admin dashboard with sidebar
- Vendor dashboard with sidebar
- Mobile-responsive design

### Phase 4: Vendor Management (Admin)
- Admin creates vendors (auto-generate credentials)
- Enable/disable vendors
- Set commission rate per vendor
- Auto-create wallet on vendor creation

### Phase 5: Category & Product Management
- Category CRUD (Admin)
- Product CRUD with image upload (Vendor)
- Product variants support
- Admin can disable products

### Phase 6: Storefront & Product Browsing
- Product listing with filters/search
- Product detail page
- Category pages
- Vendor storefront pages

### Phase 7: Cart System
- Add/remove/update cart items
- Persistent cart for logged-in users
- Guest cart with merge on login

### Phase 8: Checkout & Address Management
- Address CRUD for customers
- Coupon validation and application
- Order creation (PENDING_PAYMENT status)

### Phase 9: PayHere Payment Integration
- Hash generation for payment security
- PayHere redirect checkout
- Webhook handler with signature verification
- Order status update on payment
- Credit vendor wallet (pending balance)

### Phase 10: Order Management
- Customer: View orders, cancel (24h), confirm delivery, request return
- Vendor: Update status (Processing/Shipped), add tracking
- Admin: View all orders, override if needed

### Phase 11: Wallet & Payout System
- Pending/Available/Paid balance tracking
- Commission deduction on payment
- Release funds on delivery confirmation
- Weekly payout processing (Admin)

### Phase 12: Coupon System
- Platform-wide and vendor-specific coupons
- Flat/percentage discounts
- Usage limits, expiry, min order rules

### Phase 13: Chat System
- Socket.io real-time messaging
- Chat room per order
- Contact info filtering (block phone, email, social)
- Admin can view all chats

### Phase 14: Dispute System
- Customer opens dispute with evidence
- Admin reviews and resolves
- Refund handling on resolution

### Phase 15: Notification System
- In-app notifications
- Email notifications (Resend)
- Real-time via Socket.io

### Phase 16-17: Admin & Vendor Reports
- Dashboard stats and charts
- Sales reports, commission reports
- Export functionality

### Phase 18: Testing & QA
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- PayHere sandbox testing

### Phase 19: Deployment & Launch
- Vercel deployment
- Railway for Socket.io
- PayHere production credentials
- Monitoring (Sentry, Analytics)

---

## Current Phase
**Phase 1: Project Setup & Configuration** - Starting fresh
