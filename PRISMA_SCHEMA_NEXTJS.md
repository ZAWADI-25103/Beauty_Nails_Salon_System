# Beauty Nails - Prisma Schema for Next.js

This document contains the complete Prisma schema for the Beauty Nails salon management system.

---

## Complete Prisma Schema

```prisma
// This is your Prisma schema file for Beauty Nails
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION & USER MANAGEMENT
// ============================================

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  password      String
  phone         String    @unique
  avatar        String?
  role          UserRole  @default(client)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  accounts       Account[]
  sessions       Session[]
  clientProfile  ClientProfile?
  workerProfile  WorkerProfile?
  notifications  Notification[]
  createdReports Report[]       @relation("ReportCreatedBy")

  // Indexes
  @@index([email])
  @@index([phone])
  @@index([role])
  @@map("users")
}

enum UserRole {
  client
  worker
  admin
}

// NextAuth Account model
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

// NextAuth Session model
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ============================================
// CLIENT PROFILE & LOYALTY
// ============================================

model ClientProfile {
  id                 String   @id @default(cuid())
  userId             String   @unique
  tier               Tier     @default(Regular)
  loyaltyPoints      Int      @default(0)
  totalAppointments  Int      @default(0)
  totalSpent         Decimal  @default(0) @db.Decimal(10, 2)
  referralCode       String   @unique
  referredBy         String?
  preferences        Json?
  notes              String?  @db.Text
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  user               User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments       Appointment[]
  reviews            Review[]
  loyaltyTransactions LoyaltyTransaction[]
  referrals          Referral[]           @relation("ReferredClients")
  referrer           Referral?            @relation("Referrer")
  membershipPurchases MembershipPurchase[]
  sales              Sale[]

  @@index([tier])
  @@index([referralCode])
  @@map("client_profiles")
}

enum Tier {
  Regular
  VIP
  Premium
}

// ============================================
// WORKER PROFILE & COMMISSION
// ============================================

model WorkerProfile {
  id             String   @id @default(cuid())
  userId         String   @unique
  position       String
  specialties    String[]
  commissionRate Decimal  @default(0) @db.Decimal(5, 2)
  rating         Decimal  @default(0) @db.Decimal(3, 2)
  totalReviews   Int      @default(0)
  isAvailable    Boolean  @default(true)
  workingHours   Json?
  hireDate       DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  // Relations
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments  Appointment[]
  schedules     WorkerSchedule[]
  commissions   Commission[]
  reviews       Review[]
  leaves        WorkerLeave[]

  @@index([isAvailable])
  @@index([position])
  @@map("worker_profiles")
}

model WorkerSchedule {
  id          String   @id @default(cuid())
  workerId    String
  dayOfWeek   Int // 0 = Sunday, 6 = Saturday
  startTime   String // "09:00"
  endTime     String // "17:00"
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  worker WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@unique([workerId, dayOfWeek])
  @@map("worker_schedules")
}

model WorkerLeave {
  id        String      @id @default(cuid())
  workerId  String
  startDate DateTime
  endDate   DateTime
  reason    String?
  status    LeaveStatus @default(pending)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  // Relations
  worker WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@index([workerId])
  @@index([startDate, endDate])
  @@map("worker_leaves")
}

enum LeaveStatus {
  pending
  approved
  rejected
}

// ============================================
// SERVICES & CATEGORIES
// ============================================

model Service {
  id              String   @id @default(cuid())
  name            String
  category        Category
  price           Decimal  @db.Decimal(10, 2)
  duration        Int // in minutes
  description     String   @db.Text
  imageUrl        String?
  onlineBookable  Boolean  @default(true)
  isPopular       Boolean  @default(false)
  isActive        Boolean  @default(true)
  displayOrder    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  appointments Appointment[]
  addOns       ServiceAddOn[]
  sales        SaleItem[]
  packages     ServicePackage[] @relation("PackageServices")

  @@index([category])
  @@index([isActive])
  @@index([onlineBookable])
  @@map("services")
}

enum Category {
  onglerie // Nails
  cils     // Lashes
  tresses  // Tresses/Braids
  maquillage // Makeup
}

model ServiceAddOn {
  id          String  @id @default(cuid())
  serviceId   String
  name        String
  price       Decimal @db.Decimal(10, 2)
  duration    Int // in minutes
  description String?

  // Relations
  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@index([serviceId])
  @@map("service_add_ons")
}

model ServicePackage {
  id          String   @id @default(cuid())
  name        String
  description String   @db.Text
  price       Decimal  @db.Decimal(10, 2)
  discount    Decimal  @default(0) @db.Decimal(5, 2)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  services Service[] @relation("PackageServices")

  @@map("service_packages")
}

// ============================================
// APPOINTMENTS & BOOKINGS
// ============================================

model Appointment {
  id        String            @id @default(cuid())
  clientId  String
  serviceId String
  workerId  String
  date      DateTime
  time      String // "14:30"
  duration  Int // in minutes
  status    AppointmentStatus @default(pending)
  location  Location          @default(salon)
  price     Decimal           @db.Decimal(10, 2)
  addOns    String[] // Array of add-on IDs
  notes     String?           @db.Text
  cancelReason String?        @db.Text
  createdAt DateTime          @default(now())
  updatedAt DateTime          @updatedAt

  // Relations
  client  ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)
  service Service       @relation(fields: [serviceId], references: [id])
  worker  WorkerProfile @relation(fields: [workerId], references: [id])
  review  Review?
  sale    Sale?

  @@index([clientId])
  @@index([workerId])
  @@index([serviceId])
  @@index([date])
  @@index([status])
  @@map("appointments")
}

enum AppointmentStatus {
  pending
  confirmed
  in_progress
  completed
  cancelled
  no_show
}

enum Location {
  salon
  home
}

// ============================================
// REVIEWS & RATINGS
// ============================================

model Review {
  id            String   @id @default(cuid())
  appointmentId String   @unique
  clientId      String
  workerId      String
  rating        Int // 1-5
  comment       String?  @db.Text
  isPublished   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  appointment Appointment   @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  client      ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)
  worker      WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@index([workerId])
  @@index([rating])
  @@index([isPublished])
  @@map("reviews")
}

// ============================================
// MEMBERSHIPS & SUBSCRIPTIONS
// ============================================

model Membership {
  id                String   @id @default(cuid())
  name              String
  duration          Int // in months (3 or 6)
  price             Decimal  @db.Decimal(10, 2)
  discount          Decimal  @db.Decimal(5, 2) // percentage discount
  benefits          Json
  isActive          Boolean  @default(true)
  displayOrder      Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  purchases MembershipPurchase[]

  @@map("memberships")
}

model MembershipPurchase {
  id           String             @id @default(cuid())
  clientId     String
  membershipId String
  startDate    DateTime
  endDate      DateTime
  status       MembershipStatus   @default(active)
  autoRenew    Boolean            @default(false)
  purchaseDate DateTime           @default(now())
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  // Relations
  client     ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)
  membership Membership    @relation(fields: [membershipId], references: [id])

  @@index([clientId])
  @@index([membershipId])
  @@index([status])
  @@index([endDate])
  @@map("membership_purchases")
}

enum MembershipStatus {
  active
  expired
  cancelled
}

// ============================================
// LOYALTY & REFERRALS
// ============================================

model LoyaltyTransaction {
  id          String              @id @default(cuid())
  clientId    String
  points      Int
  type        LoyaltyType
  description String
  relatedId   String? // ID of related entity (appointment, referral, etc.)
  createdAt   DateTime            @default(now())

  // Relations
  client ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([clientId])
  @@index([type])
  @@index([createdAt])
  @@map("loyalty_transactions")
}

enum LoyaltyType {
  earned_appointment
  earned_referral
  redeemed_service
  bonus
  adjustment
}

model Referral {
  id            String        @id @default(cuid())
  referrerId    String        @unique
  referredId    String
  status        ReferralStatus @default(pending)
  rewardGranted Boolean       @default(false)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  referrer ClientProfile @relation("Referrer", fields: [referrerId], references: [id], onDelete: Cascade)
  referred ClientProfile @relation("ReferredClients", fields: [referredId], references: [id], onDelete: Cascade)

  @@index([referrerId])
  @@index([status])
  @@map("referrals")
}

enum ReferralStatus {
  pending
  completed
  rewarded
}

// ============================================
// POINT OF SALE (POS) & PAYMENTS
// ============================================

model Sale {
  id                String        @id @default(cuid())
  appointmentId     String?       @unique
  clientId          String
  total             Decimal       @db.Decimal(10, 2)
  subtotal          Decimal       @db.Decimal(10, 2)
  discount          Decimal       @default(0) @db.Decimal(10, 2)
  tax               Decimal       @default(0) @db.Decimal(10, 2)
  tip               Decimal       @default(0) @db.Decimal(10, 2)
  paymentMethod     PaymentMethod
  paymentStatus     PaymentStatus @default(pending)
  discountCode      String?
  loyaltyPointsUsed Int           @default(0)
  receiptNumber     String        @unique
  notes             String?       @db.Text
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  appointment Appointment? @relation(fields: [appointmentId], references: [id])
  client      ClientProfile @relation(fields: [clientId], references: [id], onDelete: Cascade)
  items       SaleItem[]
  payments    Payment[]

  @@index([clientId])
  @@index([createdAt])
  @@index([paymentStatus])
  @@index([receiptNumber])
  @@map("sales")
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  serviceId String
  quantity  Int     @default(1)
  price     Decimal @db.Decimal(10, 2)
  discount  Decimal @default(0) @db.Decimal(10, 2)

  // Relations
  sale    Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  service Service @relation(fields: [serviceId], references: [id])

  @@index([saleId])
  @@map("sale_items")
}

model Payment {
  id            String        @id @default(cuid())
  saleId        String
  amount        Decimal       @db.Decimal(10, 2)
  method        PaymentMethod
  transactionId String?       @unique
  status        PaymentStatus @default(completed)
  createdAt     DateTime      @default(now())

  // Relations
  sale Sale @relation(fields: [saleId], references: [id], onDelete: Cascade)

  @@index([saleId])
  @@index([status])
  @@map("payments")
}

enum PaymentMethod {
  cash
  card
  mobile // Mobile money (Airtel Money, M-Pesa, etc.)
  mixed
}

enum PaymentStatus {
  pending
  completed
  failed
  refunded
}

model DailyRegister {
  id           String   @id @default(cuid())
  date         DateTime @unique
  openingCash  Decimal  @db.Decimal(10, 2)
  closingCash  Decimal  @db.Decimal(10, 2)
  expectedCash Decimal  @db.Decimal(10, 2)
  discrepancy  Decimal  @db.Decimal(10, 2)
  totalSales   Decimal  @db.Decimal(10, 2)
  cashSales    Decimal  @db.Decimal(10, 2)
  cardSales    Decimal  @db.Decimal(10, 2)
  mobileSales  Decimal  @db.Decimal(10, 2)
  notes        String?  @db.Text
  closedBy     String?
  closedAt     DateTime?
  createdAt    DateTime @default(now())

  @@index([date])
  @@map("daily_registers")
}

// ============================================
// COMMISSION MANAGEMENT
// ============================================

model Commission {
  id                String   @id @default(cuid())
  workerId          String
  period            String // "2024-01"
  totalRevenue      Decimal  @db.Decimal(10, 2)
  commissionRate    Decimal  @db.Decimal(5, 2)
  commissionAmount  Decimal  @db.Decimal(10, 2)
  appointmentsCount Int
  status            CommissionStatus @default(pending)
  paidAt            DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  worker WorkerProfile @relation(fields: [workerId], references: [id], onDelete: Cascade)

  @@unique([workerId, period])
  @@index([workerId])
  @@index([period])
  @@index([status])
  @@map("commissions")
}

enum CommissionStatus {
  pending
  approved
  paid
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

model InventoryItem {
  id            String        @id @default(cuid())
  name          String
  category      String
  currentStock  Int
  minStock      Int
  maxStock      Int?
  unit          String // "pièce", "ml", "kg"
  cost          Decimal       @db.Decimal(10, 2)
  supplier      String?
  sku           String?       @unique
  lastRestocked DateTime?
  status        StockStatus
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  transactions InventoryTransaction[]
  reorders     ReorderRequest[]
  usages       InventoryUsage[]

  @@index([category])
  @@index([status])
  @@index([currentStock])
  @@map("inventory_items")
}

enum StockStatus {
  good
  low
  critical
  out_of_stock
}

model InventoryTransaction {
  id          String              @id @default(cuid())
  itemId      String
  quantity    Int
  type        TransactionType
  cost        Decimal?            @db.Decimal(10, 2)
  notes       String?
  performedBy String?
  createdAt   DateTime            @default(now())

  // Relations
  item InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([type])
  @@index([createdAt])
  @@map("inventory_transactions")
}

enum TransactionType {
  purchase
  usage
  adjustment
  return
}

model InventoryUsage {
  id        String   @id @default(cuid())
  itemId    String
  quantity  Int
  usedBy    String?
  usedFor   String? // "Appointment ID" or "Service"
  createdAt DateTime @default(now())

  // Relations
  item InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([createdAt])
  @@map("inventory_usage")
}

model ReorderRequest {
  id           String        @id @default(cuid())
  itemId       String
  quantity     Int
  supplier     String
  estimatedCost Decimal?     @db.Decimal(10, 2)
  status       ReorderStatus @default(pending)
  orderedAt    DateTime?
  receivedAt   DateTime?
  notes        String?       @db.Text
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  // Relations
  item InventoryItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([itemId])
  @@index([status])
  @@map("reorder_requests")
}

enum ReorderStatus {
  pending
  ordered
  received
  cancelled
}

// ============================================
// NOTIFICATIONS
// ============================================

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String           @db.Text
  link      String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  appointment_reminder
  appointment_confirmed
  appointment_cancelled
  payment_received
  loyalty_reward
  marketing
  system
  birthday
}

// ============================================
// MARKETING & CAMPAIGNS
// ============================================

model MarketingCampaign {
  id            String         @id @default(cuid())
  name          String
  type          CampaignType
  target        String // "all", "vip", "inactive", "custom"
  message       String         @db.Text
  status        CampaignStatus @default(draft)
  scheduledDate DateTime?
  sentDate      DateTime?
  recipients    Int            @default(0)
  openRate      Decimal?       @default(0) @db.Decimal(5, 2)
  clickRate     Decimal?       @default(0) @db.Decimal(5, 2)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([status])
  @@index([scheduledDate])
  @@map("marketing_campaigns")
}

enum CampaignType {
  email
  sms
  both
}

enum CampaignStatus {
  draft
  scheduled
  sending
  sent
  cancelled
}

model DiscountCode {
  id          String       @id @default(cuid())
  code        String       @unique
  type        DiscountType
  value       Decimal      @db.Decimal(10, 2)
  minPurchase Decimal?     @db.Decimal(10, 2)
  maxUses     Int?
  usedCount   Int          @default(0)
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([code])
  @@index([isActive])
  @@index([endDate])
  @@map("discount_codes")
}

enum DiscountType {
  percentage
  fixed_amount
}

// ============================================
// REPORTS & ANALYTICS
// ============================================

model Report {
  id          String     @id @default(cuid())
  name        String
  type        ReportType
  period      String // "daily", "weekly", "monthly", "custom"
  startDate   DateTime
  endDate     DateTime
  data        Json
  createdBy   String
  createdAt   DateTime   @default(now())

  // Relations
  creator User @relation("ReportCreatedBy", fields: [createdBy], references: [id])

  @@index([type])
  @@index([createdBy])
  @@index([createdAt])
  @@map("reports")
}

enum ReportType {
  revenue
  client_analytics
  service_performance
  inventory_usage
  staff_performance
  custom
}

// ============================================
// SYSTEM SETTINGS
// ============================================

model SalonProfile {
  id          String   @id @default(cuid())
  name        String
  address     String   @db.Text
  phone       String
  email       String
  website     String?
  description String?  @db.Text
  logo        String?
  openingHours Json?
  socialMedia Json?
  currency    String   @default("CDF") // Congolese Franc
  timezone    String   @default("Africa/Kinshasa")
  language    String   @default("fr")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("salon_profile")
}

model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  category  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@map("system_settings")
}

model Integration {
  id        String  @id @default(cuid())
  type      String // "sms", "email", "payment", "calendar"
  name      String
  config    Json
  isEnabled Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([type, name])
  @@map("integrations")
}

// ============================================
// AUDIT LOG
// ============================================

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  action     String // "create", "update", "delete"
  entity     String // "appointment", "client", "inventory", etc.
  entityId   String
  changes    Json?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([entity])
  @@index([createdAt])
  @@map("audit_logs")
}
```

---

## Relationships Summary

### User-Related
- **User** → **ClientProfile** (1:1)
- **User** → **WorkerProfile** (1:1)
- **User** → **Notifications** (1:many)

### Client-Related
- **ClientProfile** → **Appointments** (1:many)
- **ClientProfile** → **Reviews** (1:many)
- **ClientProfile** → **LoyaltyTransactions** (1:many)
- **ClientProfile** → **Referrals** (1:many)
- **ClientProfile** → **MembershipPurchases** (1:many)
- **ClientProfile** → **Sales** (1:many)

### Worker-Related
- **WorkerProfile** → **Appointments** (1:many)
- **WorkerProfile** → **WorkerSchedules** (1:many)
- **WorkerProfile** → **Commissions** (1:many)
- **WorkerProfile** → **Reviews** (1:many)
- **WorkerProfile** → **WorkerLeaves** (1:many)

### Appointment-Related
- **Appointment** → **ClientProfile** (many:1)
- **Appointment** → **Service** (many:1)
- **Appointment** → **WorkerProfile** (many:1)
- **Appointment** → **Review** (1:1)
- **Appointment** → **Sale** (1:1)

### Service-Related
- **Service** → **Appointments** (1:many)
- **Service** → **ServiceAddOns** (1:many)
- **Service** → **ServicePackages** (many:many)

### Sales-Related
- **Sale** → **SaleItems** (1:many)
- **Sale** → **Payments** (1:many)
- **Sale** → **ClientProfile** (many:1)
- **Sale** → **Appointment** (1:1)

### Inventory-Related
- **InventoryItem** → **InventoryTransactions** (1:many)
- **InventoryItem** → **ReorderRequests** (1:many)
- **InventoryItem** → **InventoryUsage** (1:many)

---

## Indexes Strategy

### Performance Optimization
- **User lookups**: email, phone, role
- **Appointments**: clientId, workerId, serviceId, date, status
- **Financial data**: sale dates, payment status
- **Inventory**: stock levels, categories
- **Time-based**: createdAt on most tables

### Query Patterns
```typescript
// Fast client lookup
await prisma.clientProfile.findUnique({
  where: { userId: session.user.id },
  include: {
    appointments: { orderBy: { date: 'desc' } },
    loyaltyTransactions: true,
  },
});

// Fast appointment search
await prisma.appointment.findMany({
  where: {
    workerId,
    date: { gte: startDate, lte: endDate },
    status: 'confirmed',
  },
});

// Fast inventory low stock alert
await prisma.inventoryItem.findMany({
  where: { status: 'low' },
  orderBy: { currentStock: 'asc' },
});
```

---

## Migration Commands

```bash
# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init_beauty_nails_schema

# Generate Prisma Client
npx prisma generate

# Seed database (optional)
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

---

## Seed Data Script (`/prisma/seed.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Beauty Nails',
      email: 'admin@beautynails.cd',
      password: adminPassword,
      phone: '+243900000001',
      role: 'admin',
      emailVerified: new Date(),
    },
  });

  // Create worker
  const workerPassword = await hash('Worker@123', 10);
  const worker = await prisma.user.create({
    data: {
      name: 'Sophie Worker',
      email: 'sophie@beautynails.cd',
      password: workerPassword,
      phone: '+243900000002',
      role: 'worker',
      emailVerified: new Date(),
      workerProfile: {
        create: {
          position: 'Nail Technician',
          specialties: ['onglerie', 'nail art'],
          commissionRate: 20,
          rating: 4.8,
          isAvailable: true,
        },
      },
    },
  });

  // Create client
  const clientPassword = await hash('Client@123', 10);
  const client = await prisma.user.create({
    data: {
      name: 'Marie Client',
      email: 'marie@example.cd',
      password: clientPassword,
      phone: '+243900000003',
      role: 'client',
      emailVerified: new Date(),
      clientProfile: {
        create: {
          referralCode: 'MARIE2024',
          tier: 'Regular',
          loyaltyPoints: 0,
        },
      },
    },
  });

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: 'Manucure Classique',
        category: 'onglerie',
        price: 25000,
        duration: 45,
        description: 'Manucure complète avec soin des cuticules et vernis',
        onlineBookable: true,
        isPopular: true,
      },
    }),
    prisma.service.create({
      data: {
        name: 'Pose de Cils',
        category: 'cils',
        price: 35000,
        duration: 90,
        description: 'Extension de cils naturels',
        onlineBookable: true,
        isPopular: true,
      },
    }),
  ]);

  // Create memberships
  await Promise.all([
    prisma.membership.create({
      data: {
        name: 'Abonnement 3 Mois',
        duration: 3,
        price: 150000,
        discount: 15,
        benefits: {
          discount: '15% de réduction',
          priority: 'Réservation prioritaire',
          points: 'Double points de fidélité',
        },
      },
    }),
    prisma.membership.create({
      data: {
        name: 'Abonnement 6 Mois',
        duration: 6,
        price: 270000,
        discount: 25,
        benefits: {
          discount: '25% de réduction',
          priority: 'Réservation prioritaire',
          points: 'Triple points de fidélité',
          free: '1 service gratuit par mois',
        },
      },
    }),
  ]);

  // Create salon profile
  await prisma.salonProfile.create({
    data: {
      name: 'Beauty Nails',
      address: 'Avenue des Arts, Kinshasa, RD Congo',
      phone: '+243900000000',
      email: 'contact@beautynails.cd',
      description: 'Salon de beauté spécialisé en ongles, cils, tresses et maquillage',
      currency: 'CDF',
      timezone: 'Africa/Kinshasa',
      language: 'fr',
      openingHours: {
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '09:00', close: '17:00' },
        sunday: { closed: true },
      },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Key Features

### 1. **Multi-Role System**
- Client, Worker, Admin roles with separate profiles
- Role-specific data isolation

### 2. **Loyalty Program**
- Points tracking via LoyaltyTransaction
- Referral system with rewards
- Tiered membership (Regular, VIP, Premium)

### 3. **Membership Subscriptions**
- 3-month and 6-month plans
- Auto-renewal option
- Status tracking (active, expired, cancelled)

### 4. **Comprehensive Appointments**
- Multiple statuses (pending → confirmed → completed)
- Home and salon locations
- Add-ons support
- Cancellation tracking

### 5. **POS & Financial**
- Complete sale tracking
- Multiple payment methods (cash, card, mobile money)
- Daily register for cash management
- Commission calculation for workers

### 6. **Inventory Management**
- Stock level monitoring
- Automatic reorder alerts
- Usage tracking per service
- Supplier management

### 7. **Marketing & Notifications**
- Campaign management (email/SMS)
- Discount codes
- Automated birthday messages
- Notification system

### 8. **Reviews & Ratings**
- Appointment-based reviews
- Worker ratings
- Publishable reviews for website

### 9. **Audit & Security**
- Audit log for all critical actions
- NextAuth integration
- Email verification

---

## Summary

This Prisma schema provides:
- ✅ Complete data model for Beauty Nails salon
- ✅ NextAuth integration (User, Account, Session)
- ✅ Three user roles with separate profiles
- ✅ Appointment booking system
- ✅ Loyalty & referral program
- ✅ Membership subscriptions (3 & 6 months)
- ✅ POS & payment processing
- ✅ Commission tracking
- ✅ Inventory management
- ✅ Marketing campaigns
- ✅ Reviews & ratings
- ✅ Reports & analytics support
- ✅ Optimized indexes for performance
- ✅ Comprehensive relationships
- ✅ French language support (DRC market)

Ready for production deployment! 🚀
