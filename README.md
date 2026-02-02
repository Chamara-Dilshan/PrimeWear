# PrimeWear

Admin-controlled multi-vendor e-commerce platform for Sri Lanka market with escrow payment system.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Cache**: Redis (Upstash)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: JWT + Email OTP
- **Payments**: PayHere (Sri Lanka)

## Development Credentials

### Admin Login
- **Email**: `admin@primewear.lk`
- **Password**: `admin123`
- **Access**: Full system control

⚠️ **Important**: Change the admin password in production!

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run migrations
npm run db:migrate

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (DB GUI)
npm run db:studio
```

## Environment Setup

The project requires these environment variables (see [.env](.env)):

- `DATABASE_URL` - Supabase PostgreSQL connection string
- `REDIS_URL` - Upstash Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PAYHERE_MERCHANT_ID` - PayHere payment gateway credentials
- `RESEND_API_KEY` - Email service API key
- `CLOUDINARY_*` - Image storage credentials

## Database Schema

The database includes:
- **Users**: Admin, Vendor, Customer roles
- **Products**: With variants and images
- **Orders**: Full lifecycle tracking
- **Payments**: PayHere integration with escrow
- **Wallet**: Vendor balance management with commission
- **Chat**: Order-based messaging with content filtering
- **Disputes**: Customer dispute resolution system
- **Coupons**: Platform and vendor-specific discounts

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Login pages
│   ├── (storefront)/ # Customer-facing pages
│   ├── admin/        # Admin dashboard
│   ├── vendor/       # Vendor dashboard
│   └── api/          # API routes
├── components/       # React components
├── lib/              # Utilities (auth, database, etc.)
├── services/         # Business logic
├── hooks/            # Custom React hooks
├── stores/           # Zustand state management
└── types/            # TypeScript type definitions
```

## User Roles

1. **Admin** - Platform owner, full control
2. **Vendor** - Sellers (created by Admin)
3. **Customer** - Buyers (passwordless OTP login)

## Key Features

### Payment Flow (Escrow System)
1. Customer pays via PayHere → Platform receives payment
2. Platform deducts commission (default 10%, configurable per vendor)
3. Remaining amount goes to vendor's **pending balance**
4. Customer confirms delivery → Funds move to **available balance**
5. Weekly payouts → Admin approves withdrawals

### Order Lifecycle
```
Order Placed → Payment → Processing → Shipped → Delivered → Confirmed → Closed
```

### Cancel/Return Policy
- **Cancel**: Within 24 hours of order placement
- **Return**: Within 24 hours of delivery confirmation

### Chat System
- Available only after order placement
- Contact details (phone, email, social media) are automatically filtered
- Admin can view all chat histories

## Documentation

- [PLAN.md](PLAN.md) - Detailed implementation phases
- [CLAUDE.md](CLAUDE.md) - Development guidelines
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema

## Development Status

✅ **Phase 1**: Project setup, database schema, initial seed - **COMPLETED**

See [PLAN.md](PLAN.md) for upcoming phases.

## Support

For issues and questions, refer to the project documentation or contact the development team.
