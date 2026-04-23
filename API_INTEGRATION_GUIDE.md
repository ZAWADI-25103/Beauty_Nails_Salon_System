# Beauty Nails - API Integration Guide

This document provides a comprehensive guide for backend integration with the Beauty Nails frontend application.

## Overview

The frontend is built with React, TypeScript, and uses localStorage for mock data. All API calls are currently commented out using axios and are ready for backend integration.

## API Structure

All API endpoints follow RESTful conventions:
- Base URL: `/api`
- Authentication: JWT tokens (to be implemented)
- Content-Type: `application/json`

---

## Authentication & Authorization

### Endpoints

#### Register User
```typescript
POST /api/auth/register
Body: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'client' | 'worker' | 'admin';
}
Response: {
  user: UserObject;
  token: string;
}
```

#### Login
```typescript
POST /api/auth/login
Body: {
  email: string;
  password: string;
}
Response: {
  user: UserObject;
  token: string;
}
```

#### Get Current User
```typescript
GET /api/auth/me
Headers: { Authorization: 'Bearer {token}' }
Response: UserObject
```

---

## Client Management

### Endpoints

#### Get All Clients
```typescript
GET /api/clients
Headers: { Authorization: 'Bearer {token}' }
Query: ?search={string}&status={string}&page={number}&limit={number}
Response: {
  clients: ClientObject[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### Get Client Profile
```typescript
GET /api/clients/:clientId
Headers: { Authorization: 'Bearer {token}' }
Response: {
  client: ClientObject;
  appointments: AppointmentObject[];
  loyaltyPoints: number;
  totalSpent: number;
}
```

#### Update Client Notes
```typescript
PATCH /api/clients/:clientId/notes
Headers: { Authorization: 'Bearer {token}' }
Body: { notes: string }
Response: { success: boolean }
```

#### Get Client Appointments History
```typescript
GET /api/clients/:clientId/appointments
Headers: { Authorization: 'Bearer {token}' }
Query: ?status={string}&from={date}&to={date}
Response: AppointmentObject[]
```

---

## Staff Management

### Endpoints

#### Get All Staff
```typescript
GET /api/staff
Headers: { Authorization: 'Bearer {token}' }
Query: ?role={string}&status={string}
Response: StaffObject[]
```

#### Get Staff Schedule
```typescript
GET /api/staff/:staffId/schedule
Headers: { Authorization: 'Bearer {token}' }
Query: ?date={date}&week={string}
Response: {
  schedule: ScheduleObject[];
  workingHours: WorkingHoursObject;
}
```

#### Update Staff Schedule
```typescript
PATCH /api/staff/:staffId/schedule
Headers: { Authorization: 'Bearer {token}' }
Body: { schedule: ScheduleObject }
Response: { success: boolean }
```

#### Calculate Staff Commission
```typescript
GET /api/staff/:staffId/commission
Headers: { Authorization: 'Bearer {token}' }
Query: ?period={string}
Response: {
  totalRevenue: number;
  commission: number;
  appointmentsCount: number;
}
```

#### Get Available Staff
```typescript
GET /api/staff/available
Headers: { Authorization: 'Bearer {token}' }
Query: ?category={string}&date={date}&time={time}
Response: StaffObject[]
```

---

## Appointments & Bookings

### Endpoints

#### Get Appointments
```typescript
GET /api/appointments
Headers: { Authorization: 'Bearer {token}' }
Query: ?date={date}&status={string}&staffId={string}&clientId={string}
Response: AppointmentObject[]
```

#### Get Available Time Slots
```typescript
GET /api/appointments/available-slots
Headers: { Authorization: 'Bearer {token}' }
Query: ?date={date}&workerId={string}
Response: {
  slots: string[]; // Array of time strings like "09:00", "09:30"
}
```

#### Create Appointment
```typescript
POST /api/appointments
Headers: { Authorization: 'Bearer {token}' }
Body: {
  clientId: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  location: 'salon' | 'home';
  addOns?: string[];
  notes?: string;
}
Response: AppointmentObject
```

#### Update Appointment Status
```typescript
PUT /api/appointments/:appointmentId/status
Headers: { Authorization: 'Bearer {token}' }
Body: { status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' }
Response: { success: boolean }
```

#### Reschedule Appointment
```typescript
PATCH /api/appointments/:appointmentId/reschedule
Headers: { Authorization: 'Bearer {token}' }
Body: {
  newTime: string;
  newDate?: string;
  newStaffId?: string;
}
Response: AppointmentObject
```

#### Cancel Appointment
```typescript
DELETE /api/appointments/:appointmentId
Headers: { Authorization: 'Bearer {token}' }
Body: { reason?: string }
Response: { success: boolean }
```

#### Send Appointment Reminder
```typescript
POST /api/appointments/:appointmentId/reminder
Headers: { Authorization: 'Bearer {token}' }
Body: { type: 'sms' | 'email' | 'both' }
Response: { success: boolean }
```

---

## Services Management

### Endpoints

#### Get All Services
```typescript
GET /api/services
Query: ?category={string}&available={boolean}
Response: ServiceObject[]
```

#### Get Service Details
```typescript
GET /api/services/:serviceId
Response: ServiceObject
```

#### Create Service (Admin only)
```typescript
POST /api/services
Headers: { Authorization: 'Bearer {token}' }
Body: {
  name: string;
  category: string;
  price: number;
  duration: number;
  description: string;
  onlineBookable: boolean;
}
Response: ServiceObject
```

#### Update Service
```typescript
PATCH /api/services/:serviceId
Headers: { Authorization: 'Bearer {token}' }
Body: Partial<ServiceObject>
Response: ServiceObject
```

---

## Inventory Management

### Endpoints

#### Get Inventory
```typescript
GET /api/inventory
Headers: { Authorization: 'Bearer {token}' }
Query: ?category={string}&status={string}
Response: InventoryItemObject[]
```

#### Update Stock
```typescript
PATCH /api/inventory/:itemId
Headers: { Authorization: 'Bearer {token}' }
Body: {
  quantity: number;
  operation: 'add' | 'remove' | 'set';
}
Response: InventoryItemObject
```

#### Create Reorder Request
```typescript
POST /api/inventory/reorder
Headers: { Authorization: 'Bearer {token}' }
Body: {
  itemId: string;
  supplierId: string;
  quantity: number;
}
Response: ReorderObject
```

#### Get Usage Report
```typescript
GET /api/inventory/usage
Headers: { Authorization: 'Bearer {token}' }
Query: ?period={string}&itemId={string}
Response: {
  items: UsageReportObject[];
  totalCost: number;
}
```

---

## Point of Sale (POS)

### Endpoints

#### Process Payment
```typescript
POST /api/payments/process
Headers: { Authorization: 'Bearer {token}' }
Body: {
  appointmentId?: string;
  items: Array<{
    serviceId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'mixed';
  discountCode?: string;
  loyaltyPointsUsed?: number;
  tip?: number;
}
Response: {
  saleId: string;
  total: number;
  receipt: ReceiptObject;
}
```

#### Get Receipt
```typescript
GET /api/sales/:saleId/receipt
Headers: { Authorization: 'Bearer {token}' }
Response: ReceiptObject
```

#### Close Daily Register
```typescript
POST /api/sales/close-register
Headers: { Authorization: 'Bearer {token}' }
Body: {
  date: string;
  expectedCash: number;
  actualCash: number;
}
Response: {
  totalSales: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  discrepancy: number;
}
```

---

## Reports & Analytics

### Endpoints

#### Revenue Report
```typescript
GET /api/reports/revenue
Headers: { Authorization: 'Bearer {token}' }
Query: ?period={string}&from={date}&to={date}
Response: {
  totalRevenue: number;
  breakdown: RevenueBreakdownObject[];
  trend: TrendDataObject[];
}
```

#### Client Analytics
```typescript
GET /api/reports/clients
Headers: { Authorization: 'Bearer {token}' }
Query: ?period={string}
Response: {
  totalClients: number;
  newClients: number;
  retentionRate: number;
  topClients: ClientObject[];
}
```

#### Service Performance
```typescript
GET /api/reports/services
Headers: { Authorization: 'Bearer {token}' }
Query: ?period={string}
Response: {
  services: ServicePerformanceObject[];
  mostPopular: ServiceObject;
}
```

#### Custom Report
```typescript
POST /api/reports/custom
Headers: { Authorization: 'Bearer {token}' }
Body: {
  metrics: string[];
  filters: FilterObject;
  groupBy: string;
  period: string;
}
Response: CustomReportObject
```

---

## Loyalty & Marketing

### Endpoints

#### Get Client Loyalty Points
```typescript
GET /api/loyalty/points/:clientId
Headers: { Authorization: 'Bearer {token}' }
Response: {
  points: number;
  tier: string;
  rewards: RewardObject[];
}
```

#### Create Loyalty Program
```typescript
POST /api/loyalty/programs
Headers: { Authorization: 'Bearer {token}' }
Body: {
  name: string;
  type: 'points' | 'referral' | 'frequency';
  rules: RulesObject;
}
Response: LoyaltyProgramObject
```

#### Send Marketing Campaign
```typescript
POST /api/marketing/campaigns
Headers: { Authorization: 'Bearer {token}' }
Body: {
  name: string;
  type: 'email' | 'sms' | 'both';
  target: 'all' | 'vip' | 'inactive' | 'custom';
  message: string;
  scheduledDate?: string;
}
Response: CampaignObject
```

#### Get Referral Code
```typescript
GET /api/client/referral-code
Headers: { Authorization: 'Bearer {token}' }
Response: {
  code: string;
  referrals: number;
  rewards: RewardObject[];
}
```

#### Schedule Birthday Messages
```typescript
POST /api/marketing/birthday-scheduler
Headers: { Authorization: 'Bearer {token}' }
Body: { date: string }
Response: { scheduled: number }
```

---

## Notifications

### Endpoints

#### Get Notifications
```typescript
GET /api/notifications
Headers: { Authorization: 'Bearer {token}' }
Query: ?unread={boolean}&limit={number}
Response: NotificationObject[]
```

#### Mark as Read
```typescript
PUT /api/notifications/:notificationId/read
Headers: { Authorization: 'Bearer {token}' }
Response: { success: boolean }
```

#### Update Notification Templates
```typescript
PATCH /api/notifications/templates
Headers: { Authorization: 'Bearer {token}' }
Body: {
  templateType: string;
  content: string;
}
Response: { success: boolean }
```

---

## System Settings

### Endpoints

#### Get Salon Profile
```typescript
GET /api/salon/profile
Response: SalonProfileObject
```

#### Update Salon Profile
```typescript
PATCH /api/salon/profile
Headers: { Authorization: 'Bearer {token}' }
Body: Partial<SalonProfileObject>
Response: SalonProfileObject
```

#### Update User Roles
```typescript
PATCH /api/users/:userId/roles
Headers: { Authorization: 'Bearer {token}' }
Body: { roles: string[] }
Response: { success: boolean }
```

#### Update Integrations
```typescript
PATCH /api/integrations
Headers: { Authorization: 'Bearer {token}' }
Body: {
  type: string;
  config: object;
  enabled: boolean;
}
Response: { success: boolean }
```

---

## Data Models

### User Object
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'worker' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Client Object
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  totalAppointments: number;
  totalSpent: number;
  loyaltyPoints: number;
  tier: 'Regular' | 'VIP' | 'Premium';
  lastVisit: string;
  joinDate: string;
  notes?: string;
  preferences?: object;
}
```

### Staff Object
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialties: string[];
  rating: number;
  appointmentsCount: number;
  revenue: number;
  schedule: ScheduleObject;
  isActive: boolean;
}
```

### Appointment Object
```typescript
{
  id: string;
  clientId: string;
  clientName: string;
  staffId: string;
  staffName: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  location: 'salon' | 'home';
  price: number;
  notes?: string;
  addOns?: string[];
  createdAt: string;
  updatedAt: string;
}
```

### Service Object
```typescript
{
  id: string;
  name: string;
  category: 'onglerie' | 'cils' | 'tresses' | 'maquillage';
  price: number;
  duration: number;
  description: string;
  imageUrl?: string;
  onlineBookable: boolean;
  popular: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Inventory Item Object
```typescript
{
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  cost: number;
  supplier?: string;
  lastRestocked?: string;
  status: 'good' | 'low' | 'critical';
}
```

---

## Error Handling

All endpoints should return errors in the following format:

```typescript
{
  error: {
    code: string; // e.g., 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED'
    message: string; // Human-readable error message
    details?: object; // Additional error details
  }
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized (missing or invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (e.g., duplicate booking)
- 500: Internal Server Error

---

## Authentication Flow

1. User registers or logs in via `/api/auth/register` or `/api/auth/login`
2. Backend returns a JWT token
3. Frontend stores token in localStorage
4. All subsequent requests include the token in the Authorization header
5. Backend validates token and extracts user information
6. Backend checks user permissions based on role

---

## Data Storage

Currently, the frontend uses:
- **localStorage** for user session and mock data
- **Mock data** is structured to match the expected API responses

### Migration Path
1. Replace localStorage calls with axios API calls (currently commented)
2. Uncomment axios import statements
3. Update API base URL in environment variables
4. Test each endpoint individually
5. Add error handling and loading states
6. Implement token refresh mechanism

---

## WebSocket Events (Optional for Real-time Updates)

For real-time features like live appointment updates and notifications:

```typescript
// Connection
socket.on('connect', () => {
  socket.emit('authenticate', { token });
});

// Events to listen for
socket.on('appointment:created', (appointment) => {});
socket.on('appointment:updated', (appointment) => {});
socket.on('notification:new', (notification) => {});
socket.on('inventory:low', (item) => {});

// Events to emit
socket.emit('staff:available', { staffId, available: boolean });
socket.emit('appointment:start', { appointmentId });
socket.emit('appointment:complete', { appointmentId });
```

---

## Testing Recommendations

1. **Use Postman or Thunder Client** to test all endpoints
2. **Create seed data** for development environment
3. **Implement request/response logging** for debugging
4. **Add rate limiting** to prevent abuse
5. **Use pagination** for list endpoints
6. **Implement caching** for frequently accessed data (services, salon profile)

---

## Security Considerations

1. **Password Hashing**: Use bcrypt with salt rounds ≥ 10
2. **JWT Tokens**: Short expiry times (15-60 minutes) with refresh tokens
3. **Input Validation**: Validate all user inputs on backend
4. **SQL Injection**: Use parameterized queries or ORM
5. **CORS**: Configure allowed origins properly
6. **Rate Limiting**: Implement rate limiting per IP/user
7. **PII Protection**: Never log sensitive information
8. **HTTPS**: Always use HTTPS in production

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/beauty_nails
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+243...

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Payment Integration (Optional)
FLUTTERWAVE_PUBLIC_KEY=your-public-key
FLUTTERWAVE_SECRET_KEY=your-secret-key

# App Config
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://beautynails.cd
```

---

## Next Steps for Backend Development

1. ✅ Set up Node.js/Express or your preferred backend framework
2. ✅ Configure database (PostgreSQL recommended)
3. ✅ Create database schema and models
4. ✅ Implement authentication middleware
5. ✅ Build API endpoints following this guide
6. ✅ Add validation and error handling
7. ✅ Implement SMS/Email notifications
8. ✅ Set up payment processing (optional)
9. ✅ Deploy backend to production
10. ✅ Update frontend API base URL
11. ✅ Uncomment all axios calls in frontend
12. ✅ Test end-to-end functionality

---

## Support & Contact

For questions about the frontend codebase or API integration:
- Review commented axios calls in each component
- Check mock data structures for expected response formats
- All API calls are clearly marked with comments in the code

**Frontend File Structure:**
- `/pages/*Dashboard.tsx` - Dashboard pages with API calls
- `/components/*Management.tsx` - Admin components with API calls
- `/pages/Appointments.tsx` - Booking flow with API calls

Good luck with your backend integration! 🚀
