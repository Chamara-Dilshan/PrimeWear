# PrimeWear: Admin-Controlled Multi-Vendor E-Commerce Platform

## Overview
A secure multi-vendor marketplace where Admin controls vendors, payments flow through platform escrow, and funds release after delivery confirmation.

---

## Current Progress

### Phase 1: Project Setup & Configuration ✅ COMPLETED
- [x] Initialize Next.js 14 with App Router, TypeScript, Tailwind
- [x] Install dependencies: prisma, @prisma/client, bcryptjs, jsonwebtoken, zod, resend, ioredis
- [x] Install shadcn/ui and configure components (18 components)
- [x] Create complete Prisma schema (all models, enums, relations)
- [x] Create `.env` and `.env.example` with all required variables
- [x] Create Prisma client singleton
- [x] Create database seed script with admin user
- [ ] Set up Supabase PostgreSQL and connect (requires your credentials)
- [ ] Set up Upstash Redis (requires your credentials)
- [ ] Run initial migration and seed

### Next Steps Required:
1. Create Supabase project → Get `DATABASE_URL`
2. Create Upstash Redis → Get `REDIS_URL`
3. Update `.env` with credentials
4. Run `npm run db:migrate`
5. Run `npm run db:seed`

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14+ (App Router) | Full-stack with SSR/SSG |
| Language | TypeScript | Type safety |
| Database | PostgreSQL | ACID compliance for financials |
| ORM | Prisma | Type-safe queries, migrations |
| Cache | Redis (Upstash) | OTP storage, sessions, rate limiting |
| Styling | Tailwind CSS + shadcn/ui | Rapid UI development |
| Real-time | Socket.io | Chat, notifications |
| Payments | PayHere | Sri Lanka payment gateway (need to set up sandbox) |
| Email | Resend | OTP, notifications |
| SMS | Email first | Start with email OTP, add SMS later |
| Storage | Cloudinary | Product images |
| Database Host | Supabase | PostgreSQL with free tier |
| Deployment | Vercel + Railway | Frontend + Socket server |

---

## Database Schema (Key Models)

```
User (id, email, phone, passwordHash, role[ADMIN|VENDOR|CUSTOMER], mustChangePassword)
├── Vendor (businessName, commissionRate, isApproved)
│   ├── Products
│   ├── Wallet (pendingBalance, availableBalance, totalEarnings)
│   └── Coupons
└── Customer
    ├── ShippingAddresses
    ├── Orders
    └── Cart

Product (name, price, stock, images, variants, isActive, isDisabledByAdmin)
Order (orderNumber, status, subtotal, discountAmount, totalAmount)
├── OrderItems (productSnapshot, quantity, unitPrice, vendorId)
├── Payment (payherePaymentId, status, amount)
└── Disputes

ChatRoom (orderItemId, customerId, vendorId)
└── ChatMessages (content, contentFiltered, hasBlockedContent)

Wallet
└── WalletTransactions (type[CREDIT|HOLD|RELEASE|PAYOUT], amount)
└── Payouts (amount, bankDetails, status)
```

---

## Project Structure

```
primewear/
├── prisma/schema.prisma
├── src/
│   ├── app/
│   │   ├── (auth)/login, admin-login, vendor-login, verify-otp
│   │   ├── (storefront)/products, cart, checkout, orders
│   │   ├── admin/vendors, products, orders, disputes, payouts, settings
│   │   ├── vendor/products, orders, wallet, chats, profile
│   │   └── api/auth, products, cart, orders, payments, wallet, chat, disputes
│   ├── components/ui, common, products, cart, checkout, orders, chat, admin, vendor
│   ├── lib/prisma, auth, payhere, email, sms, redis, validation
│   ├── services/auth, product, order, payment, wallet, chat, dispute
│   └── middleware.ts
└── server/socket.ts, cron/payout.ts
```

---

## Implementation Phases

---

### Phase 1: Project Setup & Configuration ✅
**Status: COMPLETED**

**Files created:**
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `tailwind.config.ts` - Tailwind config
- `prisma/schema.prisma` - Complete database schema
- `.env.example` - Environment template
- `.env` - Environment config (needs credentials)
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/utils.ts` - Utility functions
- `src/types/index.ts` - TypeScript types
- `prisma/seed.ts` - Database seeder
- `src/components/ui/*` - 18 shadcn/ui components
- `CLAUDE.md` - Project guidelines

---

### Phase 2: Authentication System ⏳
**Status: PENDING**

**Files to create:**
- `src/lib/auth.ts` - JWT utilities, password hashing
- `src/lib/otp.ts` - OTP generation, storage, verification
- `src/lib/email.ts` - Resend email service
- `src/lib/redis.ts` - Redis client
- `src/middleware.ts` - Route protection
- `src/app/api/auth/login/route.ts` - Admin/Vendor login
- `src/app/api/auth/otp/send/route.ts` - Send OTP
- `src/app/api/auth/otp/verify/route.ts` - Verify OTP
- `src/app/api/auth/change-password/route.ts` - Vendor password change
- `src/app/api/auth/me/route.ts` - Get current user
- `src/app/(auth)/login/page.tsx` - Customer login (OTP)
- `src/app/(auth)/admin/login/page.tsx` - Admin login
- `src/app/(auth)/vendor/login/page.tsx` - Vendor login
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/OTPForm.tsx`
- `src/components/auth/PasswordChangeForm.tsx`
- `src/stores/authStore.ts` - Zustand auth state

**Tasks:**
- [ ] Implement JWT token generation/verification (access + refresh)
- [ ] Implement password hashing with bcrypt (cost 12)
- [ ] Implement OTP generation (6-digit, 5-min expiry, 3 attempts max)
- [ ] Implement Redis OTP storage with rate limiting
- [ ] Create email templates for OTP
- [ ] Build Admin login page (email + password)
- [ ] Build Vendor login with forced password change flow
- [ ] Build Customer OTP login (email only for now)
- [ ] Create middleware for route protection by role
- [ ] Test all auth flows

---

### Phase 3: Dashboard Layouts ⏳
**Status: PENDING**

**Files to create:**
- `src/app/(storefront)/layout.tsx` - Customer layout
- `src/app/admin/layout.tsx` - Admin layout
- `src/app/vendor/layout.tsx` - Vendor layout
- `src/components/common/Header.tsx`
- `src/components/common/Footer.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/vendor/VendorSidebar.tsx`
- `src/app/(storefront)/page.tsx` - Homepage
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/vendor/page.tsx` - Vendor dashboard

**Tasks:**
- [ ] Create responsive storefront layout (header, footer, nav)
- [ ] Create admin dashboard layout with sidebar
- [ ] Create vendor dashboard layout with sidebar
- [ ] Build dashboard home pages with placeholder stats
- [ ] Ensure mobile responsiveness

---

### Phase 4: Vendor Management (Admin) ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/admin/vendors/route.ts` - List, create vendors
- `src/app/api/admin/vendors/[id]/route.ts` - Get, update vendor
- `src/services/vendor.service.ts` - Vendor business logic
- `src/app/admin/vendors/page.tsx` - Vendor list
- `src/app/admin/vendors/create/page.tsx` - Create vendor
- `src/app/admin/vendors/[id]/page.tsx` - Vendor detail/edit
- `src/components/admin/VendorForm.tsx`
- `src/components/admin/VendorTable.tsx`

**Tasks:**
- [ ] Admin can create vendor (generates username + temp password)
- [ ] Admin can view all vendors with filters
- [ ] Admin can enable/disable vendor
- [ ] Admin can set commission rate per vendor
- [ ] Auto-create wallet when vendor is created
- [ ] Send email to vendor with credentials

---

### Phase 5: Category & Product Management ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/categories/route.ts` - CRUD categories
- `src/app/api/products/route.ts` - List, create products
- `src/app/api/products/[id]/route.ts` - Get, update, delete
- `src/app/api/upload/route.ts` - Image upload (Cloudinary)
- `src/lib/cloudinary.ts` - Cloudinary utilities
- `src/services/product.service.ts`
- `src/app/admin/categories/page.tsx` - Category management
- `src/app/vendor/products/page.tsx` - Vendor products
- `src/app/vendor/products/create/page.tsx`
- `src/app/vendor/products/[id]/page.tsx`
- `src/components/products/ProductForm.tsx`
- `src/components/products/ProductTable.tsx`
- `src/components/products/ImageUpload.tsx`

**Tasks:**
- [ ] Admin can CRUD categories (with parent/child support)
- [ ] Vendor can create product with images, variants
- [ ] Vendor can update/delete own products
- [ ] Image upload to Cloudinary with optimization
- [ ] Admin can disable any product (with reason)
- [ ] Product validation (price, stock, images required)

---

### Phase 6: Storefront & Product Browsing ⏳
**Status: PENDING**

**Files to create:**
- `src/app/(storefront)/products/page.tsx` - Product listing
- `src/app/(storefront)/products/[slug]/page.tsx` - Product detail
- `src/app/(storefront)/categories/[slug]/page.tsx` - Category page
- `src/app/(storefront)/vendors/[slug]/page.tsx` - Vendor store
- `src/components/products/ProductCard.tsx`
- `src/components/products/ProductGrid.tsx`
- `src/components/products/ProductDetail.tsx`
- `src/components/products/ProductFilters.tsx`
- `src/components/common/SearchBar.tsx`
- `src/components/common/Pagination.tsx`

**Tasks:**
- [ ] Product listing with pagination
- [ ] Filter by category, price range, vendor
- [ ] Search functionality
- [ ] Product detail page with images, variants
- [ ] Vendor storefront page
- [ ] SEO optimization (metadata, structured data)

---

### Phase 7: Cart System ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/cart/route.ts` - Get, add to cart
- `src/app/api/cart/[itemId]/route.ts` - Update, remove item
- `src/services/cart.service.ts`
- `src/stores/cartStore.ts` - Zustand cart state
- `src/app/(storefront)/cart/page.tsx`
- `src/components/cart/CartDrawer.tsx`
- `src/components/cart/CartItem.tsx`
- `src/components/cart/CartSummary.tsx`
- `src/hooks/useCart.ts`

**Tasks:**
- [ ] Add to cart (with variant selection)
- [ ] Update quantity
- [ ] Remove item
- [ ] Persistent cart for logged-in users (DB)
- [ ] Guest cart (localStorage, merge on login)
- [ ] Cart drawer/sidebar component
- [ ] Stock validation on add/checkout

---

### Phase 8: Checkout & Address Management ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/addresses/route.ts` - CRUD addresses
- `src/app/api/orders/route.ts` - Create order
- `src/app/api/coupons/validate/route.ts` - Validate coupon
- `src/services/order.service.ts`
- `src/services/coupon.service.ts`
- `src/app/(storefront)/checkout/page.tsx`
- `src/components/checkout/CheckoutForm.tsx`
- `src/components/checkout/AddressSelector.tsx`
- `src/components/checkout/AddressForm.tsx`
- `src/components/checkout/OrderSummary.tsx`
- `src/components/checkout/CouponInput.tsx`

**Tasks:**
- [ ] Address CRUD for customers
- [ ] Checkout page with address selection
- [ ] Coupon application and validation
- [ ] Order summary with totals
- [ ] Create order (status: PENDING_PAYMENT)
- [ ] Generate human-readable order number
- [ ] Snapshot product data in order items

---

### Phase 9: PayHere Payment Integration ⏳
**Status: PENDING**

**Files to create:**
- `src/lib/payhere.ts` - Hash generation, verification
- `src/app/api/payments/initiate/route.ts` - Generate payment data
- `src/app/api/payments/notify/route.ts` - Webhook handler
- `src/app/api/payments/return/route.ts` - Return URL handler
- `src/app/api/payments/cancel/route.ts` - Cancel URL handler
- `src/services/payment.service.ts`
- `src/app/(storefront)/checkout/payment/page.tsx`
- `src/app/(storefront)/orders/[id]/success/page.tsx`
- `src/app/(storefront)/orders/[id]/failed/page.tsx`

**PayHere Flow:**
```
1. Customer clicks Pay → POST /api/payments/initiate
2. Generate hash: MD5(merchant_id + order_id + amount + currency + MD5(secret).upper()).upper()
3. Redirect to PayHere with form data
4. PayHere POSTs to /api/payments/notify (webhook)
5. Verify: MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(secret).upper()).upper()
6. If status_code=2: Update order to PAYMENT_CONFIRMED, credit vendor wallet (pending)
```

**Tasks:**
- [ ] Implement hash generation utility
- [ ] Create payment initiation endpoint
- [ ] Build PayHere redirect form
- [ ] Implement webhook handler with signature verification
- [ ] Handle all status codes (2=success, 0=pending, -1=canceled, -2=failed, -3=chargeback)
- [ ] Update order status on payment
- [ ] Credit vendor wallet (pending balance) on success
- [ ] Build success/failure pages
- [ ] Test with sandbox cards

---

### Phase 10: Order Management ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/orders/[id]/route.ts` - Get order
- `src/app/api/orders/[id]/status/route.ts` - Update status (vendor)
- `src/app/api/orders/[id]/cancel/route.ts` - Cancel order
- `src/app/api/orders/[id]/confirm-delivery/route.ts` - Customer confirms
- `src/app/api/orders/[id]/return/route.ts` - Request return
- `src/app/(storefront)/orders/page.tsx` - Customer orders
- `src/app/(storefront)/orders/[id]/page.tsx` - Order detail
- `src/app/vendor/orders/page.tsx` - Vendor orders
- `src/app/vendor/orders/[id]/page.tsx` - Vendor order detail
- `src/app/admin/orders/page.tsx` - All orders
- `src/components/orders/OrderCard.tsx`
- `src/components/orders/OrderDetail.tsx`
- `src/components/orders/OrderTimeline.tsx`
- `src/components/orders/OrderActions.tsx`

**Order Status Flow:**
```
PENDING_PAYMENT → PAYMENT_CONFIRMED → PROCESSING → SHIPPED → DELIVERED → DELIVERY_CONFIRMED
                                                              ↓
                                                        RETURN_REQUESTED → RETURNED
```

**Tasks:**
- [ ] Customer: View orders, order detail with timeline
- [ ] Customer: Cancel within 24h of order (if not shipped)
- [ ] Customer: Confirm delivery (releases funds to vendor)
- [ ] Customer: Request return within 24h of delivery
- [ ] Vendor: View orders, update status (Processing/Shipped)
- [ ] Vendor: Add tracking number/URL
- [ ] Vendor: CANNOT mark as delivered
- [ ] Admin: View all orders, override status if needed
- [ ] Order status history tracking

---

### Phase 11: Wallet & Payout System ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/wallet/route.ts` - Get wallet
- `src/app/api/wallet/transactions/route.ts` - Transaction history
- `src/app/api/wallet/payout-request/route.ts` - Request payout
- `src/app/api/admin/payouts/route.ts` - List, process payouts
- `src/services/wallet.service.ts`
- `src/app/vendor/wallet/page.tsx`
- `src/app/admin/payouts/page.tsx`
- `src/components/vendor/WalletCard.tsx`
- `src/components/vendor/TransactionHistory.tsx`
- `src/components/admin/PayoutManager.tsx`

**Wallet Flow:**
```
Payment Received (Rs.10,000)
→ Platform Commission 10%: Rs.1,000
→ Vendor Pending Balance: Rs.9,000

Customer Confirms Delivery
→ Pending → Available: Rs.9,000

Weekly Payout (Admin approves)
→ Available → Paid: Rs.9,000
→ Bank transfer processed
```

**Tasks:**
- [ ] Auto-create wallet on vendor creation
- [ ] Credit pending balance on payment (minus commission)
- [ ] Move pending → available on delivery confirmation
- [ ] Vendor dashboard: View balances (pending/available/total)
- [ ] Vendor: View transaction history
- [ ] Vendor: Request payout (if available > 0)
- [ ] Admin: View pending payouts
- [ ] Admin: Approve/process payouts
- [ ] Transaction logging for audit trail

---

### Phase 12: Coupon System ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/coupons/route.ts` - CRUD coupons
- `src/app/api/coupons/[id]/route.ts` - Update, delete
- `src/app/admin/coupons/page.tsx` - Platform coupons
- `src/app/vendor/coupons/page.tsx` - Vendor coupons
- `src/components/coupons/CouponForm.tsx`
- `src/components/coupons/CouponTable.tsx`

**Tasks:**
- [ ] Admin: Create platform-wide coupons
- [ ] Vendor: Create vendor-specific coupons
- [ ] Coupon types: FLAT amount, PERCENTAGE
- [ ] Coupon rules: min order, max discount, usage limit, expiry
- [ ] Per-user usage limit
- [ ] Validate coupon at checkout
- [ ] Track coupon usage

---

### Phase 13: Chat System ⏳
**Status: PENDING**

**Files to create:**
- `server/socket.ts` - Socket.io server
- `src/lib/socket.ts` - Socket client
- `src/lib/chat-filter.ts` - Contact info filtering
- `src/app/api/chat/rooms/route.ts` - Get rooms
- `src/app/api/chat/rooms/[id]/messages/route.ts` - Get messages
- `src/app/api/chat/messages/route.ts` - Send message
- `src/services/chat.service.ts`
- `src/app/(storefront)/orders/[id]/chat/page.tsx`
- `src/app/vendor/chats/page.tsx`
- `src/app/vendor/chats/[id]/page.tsx`
- `src/app/admin/chats/page.tsx`
- `src/components/chat/ChatWindow.tsx`
- `src/components/chat/ChatList.tsx`
- `src/components/chat/MessageBubble.tsx`
- `src/components/chat/ChatInput.tsx`
- `src/hooks/useSocket.ts`

**Contact Filtering Patterns:**
```typescript
const BLOCKED_PATTERNS = [
  /\b\d{10}\b/,                           // 10-digit phone
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,   // Phone with separators
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/,          // Email
  /\b(whatsapp|telegram|viber|signal)\b/i,
  /\b(facebook|fb|instagram|ig|twitter)\b/i,
  /\b(\.com|\.lk|\.net|\.org)\b/i,        // URLs
];
```

**Tasks:**
- [ ] Set up Socket.io server (Railway deployment)
- [ ] Create chat room on order creation
- [ ] Real-time message sending/receiving
- [ ] Filter contact info from messages (block & flag)
- [ ] Store original + filtered message
- [ ] Unread message count
- [ ] Admin can view all chats (read-only)
- [ ] Chat available only after order placed

---

### Phase 14: Dispute System ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/disputes/route.ts` - Create, list disputes
- `src/app/api/disputes/[id]/route.ts` - Get dispute
- `src/app/api/disputes/[id]/comments/route.ts` - Add comment
- `src/app/api/admin/disputes/[id]/resolve/route.ts` - Resolve
- `src/services/dispute.service.ts`
- `src/app/(storefront)/orders/[id]/dispute/page.tsx`
- `src/app/admin/disputes/page.tsx`
- `src/app/admin/disputes/[id]/page.tsx`
- `src/components/disputes/DisputeForm.tsx`
- `src/components/disputes/DisputeDetail.tsx`
- `src/components/admin/DisputeManager.tsx`

**Tasks:**
- [ ] Customer: Open dispute (reason, description, evidence)
- [ ] Evidence upload (images)
- [ ] Admin: View disputes with filters
- [ ] Admin: View order + chat history for context
- [ ] Admin: Add comments
- [ ] Admin: Resolve (customer favor / vendor favor / closed)
- [ ] Handle refund on customer-favor resolution
- [ ] Vendor CANNOT close disputes
- [ ] Notifications on dispute updates

---

### Phase 15: Notification System ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/notifications/route.ts` - Get notifications
- `src/app/api/notifications/[id]/read/route.ts` - Mark read
- `src/services/notification.service.ts`
- `src/lib/email-templates/` - Email templates
- `src/components/common/NotificationBell.tsx`
- `src/components/common/NotificationDropdown.tsx`
- `src/hooks/useNotifications.ts`
- `src/stores/notificationStore.ts`

**Notification Events:**
- Order placed/confirmed/shipped/delivered
- Payment received/failed
- Delivery confirmation reminder (after 7 days)
- Dispute opened/updated/resolved
- Payout processed
- New chat message

**Tasks:**
- [ ] In-app notification system
- [ ] Real-time notifications via Socket.io
- [ ] Email notifications (Resend)
- [ ] Notification bell with unread count
- [ ] Mark as read / mark all read
- [ ] Email templates for each event type

---

### Phase 16: Admin Dashboard & Reports ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/admin/dashboard/route.ts` - Stats
- `src/app/api/admin/reports/route.ts` - Generate reports
- `src/app/admin/reports/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/components/admin/DashboardStats.tsx`
- `src/components/admin/RevenueChart.tsx`
- `src/components/admin/RecentOrders.tsx`

**Tasks:**
- [ ] Dashboard: Total sales, orders, vendors, customers
- [ ] Dashboard: Revenue chart (daily/weekly/monthly)
- [ ] Dashboard: Recent orders, pending payouts
- [ ] Reports: Sales by vendor, category, date range
- [ ] Reports: Commission earned
- [ ] Settings: Platform commission default
- [ ] Settings: Email templates
- [ ] Export reports (CSV)

---

### Phase 17: Vendor Dashboard & Reports ⏳
**Status: PENDING**

**Files to create:**
- `src/app/api/vendor/dashboard/route.ts`
- `src/app/api/vendor/reports/route.ts`
- `src/app/vendor/reports/page.tsx`
- `src/app/vendor/profile/page.tsx`
- `src/components/vendor/DashboardStats.tsx`
- `src/components/vendor/EarningsChart.tsx`

**Tasks:**
- [ ] Dashboard: Today's orders, pending orders, earnings
- [ ] Dashboard: Wallet summary
- [ ] Reports: Daily/weekly/monthly sales
- [ ] Reports: Commission deducted
- [ ] Reports: Net earnings
- [ ] Profile: Update business info, logo
- [ ] Shop vacation mode (request closure)

---

### Phase 18: Testing & Quality Assurance ⏳
**Status: PENDING**

**Files to create:**
- `tests/unit/` - Unit tests
- `tests/integration/` - API tests
- `tests/e2e/` - Playwright tests
- `jest.config.js`
- `playwright.config.ts`

**Tasks:**
- [ ] Unit tests for services (wallet, payment, auth)
- [ ] Integration tests for critical API endpoints
- [ ] E2E test: Complete purchase flow
- [ ] E2E test: Vendor order management
- [ ] E2E test: Admin dispute resolution
- [ ] PayHere sandbox testing with all status codes
- [ ] Security audit (OWASP checklist)
- [ ] Performance testing

---

### Phase 19: Deployment & Launch ⏳
**Status: PENDING**

**Tasks:**
- [ ] Set up Vercel project
- [ ] Configure environment variables
- [ ] Set up Railway for Socket.io server
- [ ] Configure custom domain
- [ ] SSL certificate
- [ ] PayHere production credentials
- [ ] Set up Sentry for error tracking
- [ ] Set up analytics (Vercel Analytics)
- [ ] Create production database backup strategy
- [ ] Documentation for admin/vendor usage
- [ ] Launch checklist verification

---

## Critical Files Summary

| Priority | File | Purpose |
|----------|------|---------|
| P0 | `prisma/schema.prisma` | Complete database schema with all models |
| P0 | `src/lib/auth.ts` | JWT + bcrypt + token management |
| P0 | `src/lib/otp.ts` | OTP generation, Redis storage |
| P0 | `src/middleware.ts` | Route protection, RBAC |
| P1 | `src/lib/payhere.ts` | Hash generation, webhook verification |
| P1 | `src/app/api/payments/notify/route.ts` | PayHere webhook (critical for money flow) |
| P1 | `src/services/wallet.service.ts` | Escrow logic, commission, balance management |
| P1 | `src/services/order.service.ts` | Order lifecycle, status transitions |
| P2 | `src/lib/chat-filter.ts` | Contact info blocking in messages |
| P2 | `server/socket.ts` | Real-time chat server |
| P2 | `src/services/dispute.service.ts` | Dispute workflow, resolution |

---

## Key API Endpoints

```
Auth:     POST /api/auth/login, /otp/send, /otp/verify
Products: GET/POST /api/products, PUT/DELETE /api/products/:id
Cart:     GET/POST/PUT/DELETE /api/cart
Orders:   POST /api/orders, /orders/:id/cancel, /confirm-delivery, /return
Payments: POST /api/payments/initiate, /payments/notify (webhook)
Wallet:   GET /api/wallet, /transactions, POST /payout-request
Disputes: POST /api/disputes, PATCH /admin/disputes/:id/resolve
Chat:     GET /api/chat/rooms, /messages, POST /messages
Admin:    POST /admin/vendors, GET /admin/payouts, PATCH /admin/products/:id/status
```

---

## Security Measures

- **Passwords**: bcrypt (cost 12+)
- **OTP**: 6-digit, 5-min expiry, 3 attempts max
- **PayHere**: Server-side hash, webhook IP verification
- **Chat**: Regex filtering for contact info
- **API**: JWT + role-based middleware
- **Input**: Zod validation on all endpoints

---

## Verification Plan

1. **Auth Testing**: Login all 3 user types, verify OTP flow, password change
2. **Product Flow**: Create product as vendor, browse as customer, disable as admin
3. **Order Flow**: Add to cart → Checkout → Pay (sandbox) → Track → Confirm delivery
4. **Wallet Verification**: Check pending/available balance transitions, commission math
5. **Chat Test**: Send messages, verify contact blocking, admin view
6. **Dispute Flow**: Open case → Admin review → Resolve
7. **PayHere Sandbox**: Test cards (Visa: 4916217501611292), verify webhook
8. **E2E Test**: Complete purchase journey with Playwright

---

## Environment Variables Required

```env
# Supabase PostgreSQL
DATABASE_URL=postgresql://...

# Upstash Redis
REDIS_URL=redis://...

# Auth
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# PayHere (register at sandbox.payhere.lk)
PAYHERE_MERCHANT_ID=...
PAYHERE_MERCHANT_SECRET=...
PAYHERE_MODE=sandbox

# Email (Resend)
RESEND_API_KEY=...
EMAIL_FROM=noreply@primewear.lk

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment Architecture

```
[Customer/Vendor/Admin Browser]
         ↓
    [Vercel - Next.js]
         ↓
   ┌─────┴─────┐
   ↓           ↓
[Supabase]  [Railway]
PostgreSQL   Socket.io
   ↓
[Upstash Redis]
   ↓
[PayHere API]
```

## Setup Steps (Before Continuing)

1. **Supabase**: Create project at supabase.com → Get DATABASE_URL
2. **Upstash**: Create Redis at upstash.com → Get REDIS_URL
3. **PayHere Sandbox**: Register at sandbox.payhere.lk → Get merchant credentials
4. **Resend**: Sign up at resend.com → Get API key
5. **Cloudinary**: Create account → Get cloud credentials

---

## Notes & Recommendations

1. **Start with Phase 1-4** to get a working MVP with payments
2. **PayHere sandbox first** - Test thoroughly before going live
3. **Commission rate**: Store per-vendor (default 10%) for flexibility
4. **Weekly payouts**: Start manual (admin approval), automate later
5. **Chat filtering**: Use aggressive regex, log blocked attempts
6. **Mobile-first**: Most Sri Lankan users shop on mobile

---

## Commands Reference

```bash
# Development
npm run dev          # Start development server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio

# Build
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```
