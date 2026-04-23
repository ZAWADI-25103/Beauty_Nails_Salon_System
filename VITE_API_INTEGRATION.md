# Beauty Nails - Vite API Integration Guide

This document explains how the Vite frontend integrates with the Next.js API backend using TanStack Query (React Query) and axiosdb.

---

## 🎯 Overview

The Beauty Nails frontend now uses **real API calls** instead of mocked data, with:
- ✅ **TanStack Query** for server state management
- ✅ **Axios** for HTTP requests
- ✅ **Automatic caching** and background refetching
- ✅ **Optimistic updates** for better UX
- ✅ **Loading and error states** handling
- ✅ **TypeScript** for type safety

---

## 📦 Installation

Install the required dependencies:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools axios
```

---

## 🔧 Configuration

### 1. Environment Variables

Create a `.env` file in your root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.beautynails.cd/api
```

### 2. Axios Instance (`/lib/axiosdb.ts`)

The axios instance is configured to:
- Use the API base URL from environment variables
- Send cookies for session authentication
- Automatically redirect to login on 401 errors
- Include proper headers

### 3. Query Client (`/lib/queryClient.ts`)

Configured with:
- 5-minute stale time
- 10-minute garbage collection time
- Automatic refetch disabled on window focus
- 1 retry attempt

---

## 📁 File Structure

```
/lib
  /api
    auth.ts           # Authentication API calls
    appointments.ts   # Appointments API calls
    clients.ts        # Clients API calls
    staff.ts          # Staff API calls
    services.ts       # Services API calls
    inventory.ts      # Inventory API calls
    payments.ts       # Payments/POS API calls
    loyalty.ts        # Loyalty & referrals API calls
    notifications.ts  # Notifications API calls
    reports.ts        # Reports & analytics API calls
  
  /hooks
    useAuth.ts           # Authentication hooks
    useAppointments.ts   # Appointments hooks
    useClients.ts        # Clients hooks
    useStaff.ts          # Staff hooks
    useServices.ts       # Services hooks
    useInventory.ts      # Inventory hooks
    usePayments.ts       # Payments hooks
    useLoyalty.ts        # Loyalty hooks
    useNotifications.ts  # Notifications hooks
    useReports.ts        # Reports hooks
  
  axiosdb.ts          # Axios instance
  queryClient.ts    # Query client configuration
```

---

## 🚀 Usage Examples

### Authentication

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function LoginComponent() {
  const { login, isLoginLoading } = useAuth();

  const handleSubmit = (email: string, password: string) => {
    login({ email, password });
  };

  return (
    <button onClick={() => handleSubmit(email, password)} disabled={isLoginLoading}>
      {isLoginLoading ? 'Connexion...' : 'Se connecter'}
    </button>
  );
}
```

### Appointments

```typescript
import { useAppointments } from '@/lib/hooks/useAppointments';

function AppointmentsList() {
  const { appointments, isLoading, createAppointment, isCreating } = useAppointments({
    date: '2024-01-15',
    status: 'confirmed',
  });

  const handleCreate = () => {
    createAppointment({
      serviceId: 'service-123',
      workerId: 'worker-456',
      date: '2024-01-15',
      time: '14:00',
      location: 'salon',
    });
  };

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>{apt.service.name}</div>
      ))}
      <button onClick={handleCreate} disabled={isCreating}>
        Créer rendez-vous
      </button>
    </div>
  );
}
```

### Clients

```typescript
import { useClients } from '@/lib/hooks/useClients';

function ClientsList() {
  const { clients, pagination, isLoading, updateNotes } = useClients({
    search: 'marie',
    tier: 'VIP',
    page: 1,
    limit: 20,
  });

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {clients.map(client => (
        <div key={client.id}>
          {client.user?.name} - {client.tier}
          <button onClick={() => updateNotes({ id: client.userId, notes: 'VIP client' })}>
            Ajouter note
          </button>
        </div>
      ))}
      <Pagination {...pagination} />
    </div>
  );
}
```

### Staff

```typescript
import { useStaff, useAvailableStaff } from '@/lib/hooks/useStaff';

function StaffManagement() {
  const { staff, isLoading, createWorker } = useStaff({ isAvailable: true });
  const { data: availableStaff } = useAvailableStaff({
    category: 'onglerie',
    date: '2024-01-15',
    time: '14:00',
  });

  return (
    <div>
      {staff.map(worker => (
        <div key={worker.id}>
          {worker.user?.name} - {worker.position}
        </div>
      ))}
    </div>
  );
}
```

### Services

```typescript
import { useServices } from '@/lib/hooks/useServices';

function ServicesCatalog() {
  const { services, isLoading, createService, updateService, deleteService } = useServices({
    category: 'onglerie',
  });

  return (
    <div>
      {services.map(service => (
        <div key={service.id}>
          {service.name} - {service.price} CDF
          <button onClick={() => updateService({
            id: service.id,
            updates: { price: 30000 },
          })}>
            Modifier prix
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Inventory

```typescript
import { useInventory } from '@/lib/hooks/useInventory';

function InventoryManagement() {
  const { inventory, isLoading, updateStock, createReorder } = useInventory({
    status: 'low',
  });

  return (
    <div>
      {inventory.map(item => (
        <div key={item.id}>
          {item.name} - Stock: {item.currentStock}
          <button onClick={() => updateStock({
            id: item.id,
            stockData: {
              quantity: 10,
              operation: 'add',
              notes: 'Réapprovisionnement',
            },
          })}>
            Ajouter stock
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Payments

```typescript
import { usePayments } from '@/lib/hooks/usePayments';

function POSCheckout() {
  const { processPayment, isProcessing, paymentResult } = usePayments();

  const handlePayment = () => {
    processPayment({
      appointmentId: 'apt-123',
      items: [
        { serviceId: 'service-1', quantity: 1, price: 25000 },
        { serviceId: 'service-2', quantity: 1, price: 15000 },
      ],
      paymentMethod: 'cash',
      loyaltyPointsUsed: 10,
      tip: 2000,
    });
  };

  return (
    <button onClick={handlePayment} disabled={isProcessing}>
      {isProcessing ? 'Traitement...' : 'Payer'}
    </button>
  );
}
```

### Loyalty & Referrals

```typescript
import { useLoyalty, useReferral } from '@/lib/hooks/useLoyalty';

function LoyaltyCard() {
  const { points, tier, transactions, isLoading } = useLoyalty();
  const { referralCode, referrals, applyReferralCode } = useReferral();

  return (
    <div>
      <h3>Points: {points}</h3>
      <h3>Niveau: {tier}</h3>
      <h3>Code de parrainage: {referralCode}</h3>
      <h3>Parrainages: {referrals}</h3>
      
      <button onClick={() => applyReferralCode('ABC123')}>
        Utiliser code
      </button>
    </div>
  );
}
```

### Notifications

```typescript
import { useNotifications } from '@/lib/hooks/useNotifications';

function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    unread: true,
    limit: 50,
  });

  return (
    <div>
      <h3>Notifications ({unreadCount})</h3>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <strong>{notif.title}</strong>
          <p>{notif.message}</p>
        </div>
      ))}
      <button onClick={() => markAllAsRead()}>
        Tout marquer comme lu
      </button>
    </div>
  );
}
```

### Reports

```typescript
import { useRevenueReport, useClientAnalytics } from '@/lib/hooks/useReports';

function ReportsPage() {
  const { data: revenue, isLoading } = useRevenueReport({
    from: '2024-01-01',
    to: '2024-01-31',
  });

  const { data: clientData } = useClientAnalytics('monthly');

  return (
    <div>
      <h3>Revenus total: {revenue?.totalRevenue} CDF</h3>
      <h3>Nombre de ventes: {revenue?.salesCount}</h3>
      <h3>Nouveaux clients: {clientData?.newClients}</h3>
    </div>
  );
}
```

---

## 🔄 Query Keys

TanStack Query uses query keys for caching. Here are the keys used:

### Authentication
- `['auth', 'me']` - Current user

### Appointments
- `['appointments', params]` - List of appointments
- `['appointments', id]` - Single appointment
- `['appointments', 'available-slots', params]` - Available time slots

### Clients
- `['clients', params]` - List of clients
- `['clients', id]` - Single client
- `['clients', id, 'appointments', params]` - Client's appointments

### Staff
- `['staff', params]` - List of staff
- `['staff', id]` - Single worker
- `['staff', id, 'schedule', params]` - Worker schedule
- `['staff', id, 'commission', period]` - Worker commission
- `['staff', 'available', params]` - Available staff

### Services
- `['services', params]` - List of services
- `['services', id]` - Single service

### Inventory
- `['inventory', params]` - Inventory items
- `['inventory', id]` - Single item
- `['inventory', 'usage', params]` - Usage report

### Payments
- `['sales', params]` - Sales list
- `['sales', id, 'receipt']` - Receipt

### Loyalty
- `['loyalty', 'points']` - Loyalty points
- `['loyalty', 'referral']` - Referral code

### Notifications
- `['notifications', params]` - Notifications list

### Reports
- `['reports', 'revenue', params]` - Revenue report
- `['reports', 'clients', period]` - Client analytics
- `['reports', 'services', period]` - Service performance

---

## ⚡ Mutations

Mutations automatically invalidate related queries to refetch fresh data:

### Example Flow:
1. User creates an appointment
2. `createAppointment` mutation executes
3. On success, `['appointments']` queries are invalidated
4. All appointment lists automatically refetch
5. UI updates with fresh data

This happens automatically with TanStack Query!

---

## 🎨 Loading States

Every hook returns loading states:

```typescript
const { data, isLoading, error, isPending, isSuccess } = useQuery(...);

const { mutate, isPending, isSuccess, isError } = useMutation(...);
```

Use these for UI feedback:

```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
return <DataDisplay data={data} />;
```

---

## 🛡️ Error Handling

Errors are automatically handled and displayed via toast notifications:

```typescript
onError: (error: any) => {
  toast.error(error.response?.data?.error?.message || 'Une erreur est survenue');
}
```

---

## 🔐 Authentication Flow

1. User enters credentials
2. `login()` mutation is called
3. API returns user data and sets session cookie
4. User data is cached in `['auth', 'me']`
5. Subsequent API calls include the session cookie automatically
6. On 401 error, user is redirected to login

---

## 📊 React Query DevTools

The DevTools are included in development mode:

- Press the TanStack Query icon in the bottom-right corner
- View all queries and their states
- Inspect cache data
- Manually refetch queries
- Clear cache

---

## 🚦 Migration Checklist

To integrate with the Next.js backend:

### Backend Setup
- [ ] Deploy Next.js API server
- [ ] Configure Prisma with database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed database: `npx prisma db seed`
- [ ] Configure CORS to allow frontend domain
- [ ] Set up NextAuth with session cookies

### Frontend Setup
- [ ] Update `.env` with API base URL
- [ ] Install dependencies: `npm install`
- [ ] Test API connection
- [ ] Update dashboard components to use hooks
- [ ] Remove all mocked data
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Test error scenarios

### Testing
- [ ] Login/logout
- [ ] Create appointment
- [ ] View appointments
- [ ] Update appointment status
- [ ] Client management
- [ ] Staff management
- [ ] Inventory updates
- [ ] POS checkout
- [ ] Loyalty points
- [ ] Notifications
- [ ] Reports generation

---

## 🎯 Next Steps

1. **Update Dashboard Components**: Replace mocked data with hooks
2. **Test API Integration**: Ensure all endpoints work correctly
3. **Handle Edge Cases**: Add proper error boundaries
4. **Optimize Performance**: Use React.memo and useMemo where needed
5. **Add Loading Skeletons**: Better UX during data fetching
6. **Implement Offline Support**: Use TanStack Query's offline capabilities

---

## 📝 Important Notes

### Session Management
- Session is managed via HTTP-only cookies by NextAuth
- No need to manually handle tokens in frontend
- Cookies are sent automatically with each request

### CORS Configuration
Make sure your Next.js API has CORS configured:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.FRONTEND_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

### Development vs Production
- **Development**: API at `http://localhost:3000/api`
- **Production**: API at `https://api.beautynails.cd/api`

---

## 🐛 Troubleshooting

### "Network Error" or CORS Issues
- Check API server is running
- Verify CORS configuration
- Check `withCredentials: true` in axios config

### "Unauthorized" Errors
- Clear cookies and login again
- Check NextAuth session configuration
- Verify API routes use `getServerSession`

### Data Not Updating
- Check query keys are correct
- Verify mutations invalidate queries
- Use React Query DevTools to inspect cache

### Slow Performance
- Increase staleTime for static data
- Use pagination for large lists
- Implement virtual scrolling for long lists

---

## 📚 Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com/)
- [NextAuth Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs/)

---

## ✅ Summary

Your Vite frontend is now fully configured to work with the Next.js API backend using:
- ✅ TanStack Query for efficient server state management
- ✅ Axios for HTTP requests with automatic cookie handling
- ✅ TypeScript for complete type safety
- ✅ Automatic caching and background updates
- ✅ Optimistic updates for instant UI feedback
- ✅ Comprehensive error handling
- ✅ French language support

All mocked data can now be replaced with real API calls! 🚀
