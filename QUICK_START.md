# Beauty Nails - Quick Start Guide

Get your Beauty Nails app running with real API integration in 5 minutes!

---

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools axios
```

### 2. Configure Environment

Create `.env` in your root folder:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Start Development

```bash
# Terminal 1 - Start Next.js backend
cd backend
npm run dev

# Terminal 2 - Start Vite frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` and you're ready! 🎉

---

## 💡 Using the New API Hooks

### Example 1: Login

```typescript
import { useAuth } from '@/lib/hooks/useAuth';

function LoginPage() {
  const { login, isLoginLoading } = useAuth();

  const handleLogin = () => {
    login({
      email: 'admin@beautynails.cd',
      password: 'Admin@123',
    });
  };

  return (
    <button onClick={handleLogin} disabled={isLoginLoading}>
      {isLoginLoading ? 'Connexion...' : 'Se connecter'}
    </button>
  );
}
```

### Example 2: View Appointments

```typescript
import { useAppointments } from '@/lib/hooks/useAppointments';

function AppointmentsList() {
  const { appointments, isLoading } = useAppointments({
    status: 'confirmed',
    date: '2024-01-15',
  });

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>
          {apt.client?.user?.name} - {apt.service?.name}
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Create Appointment

```typescript
import { useAppointments } from '@/lib/hooks/useAppointments';

function BookingForm() {
  const { createAppointment, isCreating } = useAppointments();

  const handleSubmit = () => {
    createAppointment({
      serviceId: 'service-123',
      workerId: 'worker-456',
      date: '2024-01-15',
      time: '14:00',
      location: 'salon',
    });
  };

  return (
    <button onClick={handleSubmit} disabled={isCreating}>
      {isCreating ? 'Création...' : 'Réserver'}
    </button>
  );
}
```

---

## 📋 Available Hooks

### Authentication
```typescript
import { useAuth } from '@/lib/hooks/useAuth';
const { user, login, logout, isLoginLoading } = useAuth();
```

### Appointments
```typescript
import { useAppointments } from '@/lib/hooks/useAppointments';
const { appointments, createAppointment, updateStatus, cancelAppointment } = useAppointments();
```

### Clients
```typescript
import { useClients } from '@/lib/hooks/useClients';
const { clients, pagination, updateNotes } = useClients();
```

### Staff
```typescript
import { useStaff } from '@/lib/hooks/useStaff';
const { staff, createWorker } = useStaff();
```

### Services
```typescript
import { useServices } from '@/lib/hooks/useServices';
const { services, createService, updateService } = useServices();
```

### Inventory
```typescript
import { useInventory } from '@/lib/hooks/useInventory';
const { inventory, updateStock, createReorder } = useInventory();
```

### Payments
```typescript
import { usePayments } from '@/lib/hooks/usePayments';
const { sales, processPayment, closeRegister } = usePayments();
```

### Loyalty
```typescript
import { useLoyalty, useReferral } from '@/lib/hooks/useLoyalty';
const { points, tier, transactions } = useLoyalty();
const { referralCode, referrals } = useReferral();
```

### Notifications
```typescript
import { useNotifications } from '@/lib/hooks/useNotifications';
const { notifications, unreadCount, markAsRead } = useNotifications();
```

### Reports
```typescript
import { useRevenueReport } from '@/lib/hooks/useReports';
const { data: revenue } = useRevenueReport({ from: '2024-01-01', to: '2024-01-31' });
```

---

## 🎨 Common Patterns

### Pattern 1: List with Loading

```typescript
function MyList() {
  const { items, isLoading, error } = useItems();

  if (isLoading) return <LoaderBN />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### Pattern 2: Create Form

```typescript
function CreateForm() {
  const { createItem, isCreating } = useItems();
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    createItem(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isCreating}>
        {isCreating ? 'Création...' : 'Créer'}
      </button>
    </form>
  );
}
```

### Pattern 3: Update Mutation

```typescript
function EditButton({ id }) {
  const { updateItem, isUpdating } = useItems();

  return (
    <button 
      onClick={() => updateItem({ id, updates: { status: 'active' }})}
      disabled={isUpdating}
    >
      Activer
    </button>
  );
}
```

---

## 🔍 Debugging

### Open React Query DevTools

Click the TanStack Query icon in the bottom-right corner to:
- View all queries
- Inspect cached data
- Manually refetch
- Clear cache

### Check Network Requests

Open browser DevTools → Network tab → Filter by "api" to see all API calls

### Common Issues

**401 Unauthorized**: Login again
```typescript
const { logout } = useAuth();
logout();
```

**CORS Error**: Make sure backend is running and CORS is configured

**Data not updating**: Check if mutation invalidates queries
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['items'] });
}
```

---

## 📚 Full Documentation

- **`/API_MIGRATION_SUMMARY.md`** - Complete feature overview
- **`/VITE_API_INTEGRATION.md`** - Detailed integration guide
- **`/API_ROUTES_NEXTJS.md`** - Backend API documentation
- **`/NEXTAUTH_SETUP.md`** - Authentication setup
- **`/PRISMA_SCHEMA_NEXTJS.md`** - Database schema

---

## ✅ Testing Checklist

- [ ] Backend running on `localhost:3000`
- [ ] Frontend running on `localhost:5173`
- [ ] `.env` file created with `NEXT_PUBLIC_API_URL`
- [ ] Can login successfully
- [ ] Can view appointments
- [ ] Can create appointment
- [ ] React Query DevTools visible

---

## 🎯 Next Steps

1. Replace mocked data in dashboard components with hooks
2. Test all features
3. Add loading skeletons
4. Handle error states
5. Deploy to production!

---

**Need help?** Check the full documentation files or open React Query DevTools! 🚀
